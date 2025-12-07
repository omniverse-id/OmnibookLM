import { DocumentChunk, cosineSimilarity } from './embeddingService';
import { db } from './db';

export interface SearchResult {
    chunk: DocumentChunk;
    score: number;
}

/**
 * In-memory vector store with persistence to IndexedDB
 */
class VectorStore {
    private chunks: Map<string, DocumentChunk> = new Map();
    private sourceChunks: Map<string, Set<string>> = new Map(); // sourceId -> chunk IDs
    private initialized: boolean = false;

    /**
     * Initialize the vector store (loads from IndexedDB)
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        try {
            await this.loadFromDB();
            this.initialized = true;
            console.log(`Vector store initialized with ${this.chunks.size} chunks`);
        } catch (error) {
            console.error('Error initializing vector store:', error);
            this.initialized = true; // Continue even if load fails
        }
    }

    /**
     * Add chunks to the vector store
     */
    async addChunks(chunks: DocumentChunk[]): Promise<void> {
        await this.initialize();
        
        for (const chunk of chunks) {
            this.chunks.set(chunk.id, chunk);
            
            // Track chunks by source
            if (!this.sourceChunks.has(chunk.sourceId)) {
                this.sourceChunks.set(chunk.sourceId, new Set());
            }
            this.sourceChunks.get(chunk.sourceId)!.add(chunk.id);
        }
        
        // Persist to IndexedDB
        await this.saveToDB(chunks);
        
        console.log(`Added ${chunks.length} chunks to vector store`);
    }

    /**
     * Remove all chunks for a specific source
     */
    async removeChunksBySourceId(sourceId: string): Promise<void> {
        await this.initialize();
        
        const chunkIds = this.sourceChunks.get(sourceId);
        if (!chunkIds) return;
        
        // Remove from memory
        for (const chunkId of chunkIds) {
            this.chunks.delete(chunkId);
        }
        this.sourceChunks.delete(sourceId);
        
        // Remove from IndexedDB
        await this.deleteChunksFromDB(Array.from(chunkIds));
        
        console.log(`Removed chunks for source ${sourceId}`);
    }

    /**
     * Search for similar chunks using semantic similarity
     */
    async search(
        queryEmbedding: number[],
        options: {
            topK?: number;
            sourceIds?: string[];
            minScore?: number;
        } = {}
    ): Promise<SearchResult[]> {
        await this.initialize();
        
        const { topK = 5, sourceIds, minScore = 0.3 } = options;
        
        // Filter chunks by source if specified
        let chunksToSearch = Array.from(this.chunks.values());
        if (sourceIds && sourceIds.length > 0) {
            chunksToSearch = chunksToSearch.filter(chunk => 
                sourceIds.includes(chunk.sourceId)
            );
        }
        
        // Calculate similarity scores
        const results: SearchResult[] = [];
        for (const chunk of chunksToSearch) {
            if (!chunk.embedding) continue;
            
            const score = cosineSimilarity(queryEmbedding, chunk.embedding);
            if (score >= minScore) {
                results.push({ chunk, score });
            }
        }
        
        // Sort by score descending and return top K
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
    }

    /**
     * Get all chunks for specific sources
     */
    async getChunksBySourceIds(sourceIds: string[]): Promise<DocumentChunk[]> {
        await this.initialize();
        
        const chunks: DocumentChunk[] = [];
        for (const sourceId of sourceIds) {
            const chunkIds = this.sourceChunks.get(sourceId);
            if (chunkIds) {
                for (const chunkId of chunkIds) {
                    const chunk = this.chunks.get(chunkId);
                    if (chunk) {
                        chunks.push(chunk);
                    }
                }
            }
        }
        return chunks;
    }

    /**
     * Get statistics about the vector store
     */
    getStats(): {
        totalChunks: number;
        totalSources: number;
        averageChunksPerSource: number;
    } {
        const totalChunks = this.chunks.size;
        const totalSources = this.sourceChunks.size;
        const averageChunksPerSource = totalSources > 0 
            ? totalChunks / totalSources 
            : 0;
        
        return {
            totalChunks,
            totalSources,
            averageChunksPerSource: Math.round(averageChunksPerSource * 10) / 10
        };
    }

    /**
     * Clear all chunks from the vector store
     */
    async clear(): Promise<void> {
        this.chunks.clear();
        this.sourceChunks.clear();
        await db.vectorChunks?.clear();
        console.log('Vector store cleared');
    }

    // ===== Persistence Methods =====

    /**
     * Save chunks to IndexedDB
     */
    private async saveToDB(chunks: DocumentChunk[]): Promise<void> {
        try {
            // Ensure the table exists
            if (!db.vectorChunks) {
                console.warn('vectorChunks table not found, skipping persistence');
                return;
            }
            
            await db.vectorChunks.bulkPut(chunks);
        } catch (error) {
            console.error('Error saving chunks to DB:', error);
        }
    }

    /**
     * Load chunks from IndexedDB
     */
    private async loadFromDB(): Promise<void> {
        try {
            // Ensure the table exists
            if (!db.vectorChunks) {
                console.warn('vectorChunks table not found, skipping load');
                return;
            }
            
            const chunks = await db.vectorChunks.toArray();
            
            for (const chunk of chunks) {
                this.chunks.set(chunk.id, chunk);
                
                if (!this.sourceChunks.has(chunk.sourceId)) {
                    this.sourceChunks.set(chunk.sourceId, new Set());
                }
                this.sourceChunks.get(chunk.sourceId)!.add(chunk.id);
            }
        } catch (error) {
            console.error('Error loading chunks from DB:', error);
        }
    }

    /**
     * Delete specific chunks from IndexedDB
     */
    private async deleteChunksFromDB(chunkIds: string[]): Promise<void> {
        try {
            if (!db.vectorChunks) {
                console.warn('vectorChunks table not found, skipping deletion');
                return;
            }
            
            await db.vectorChunks.bulkDelete(chunkIds);
        } catch (error) {
            console.error('Error deleting chunks from DB:', error);
        }
    }
}

// Singleton instance
export const vectorStore = new VectorStore();
