import { pipeline, env } from '@xenova/transformers';

// Configure to use local models (runs in browser)
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface DocumentChunk {
    id: string;
    sourceId: string;
    sourceName: string;
    content: string;
    embedding?: number[];
    metadata?: {
        pageNumber?: number;
        chunkIndex: number;
        totalChunks: number;
    };
}

// Singleton for the embedding pipeline
let embeddingPipeline: any = null;

/**
 * Initialize the embedding model (loads lazily on first use)
 */
async function getEmbeddingPipeline() {
    if (!embeddingPipeline) {
        console.log('Loading embedding model...');
        embeddingPipeline = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2'
        );
        console.log('Embedding model loaded successfully');
    }
    return embeddingPipeline;
}

/**
 * Smart text chunking with overlap for better context preservation
 */
export function chunkText(
    text: string,
    options: {
        maxChunkSize?: number;
        overlap?: number;
        minChunkSize?: number;
    } = {}
): string[] {
    const {
        maxChunkSize = 512,
        overlap = 50,
        minChunkSize = 100
    } = options;

    // Clean and normalize text
    const cleanText = text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

    if (cleanText.length <= maxChunkSize) {
        return [cleanText];
    }

    const chunks: string[] = [];
    
    // Try to split by paragraphs first
    const paragraphs = cleanText.split(/\n\s*\n/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();
        
        if (!trimmedParagraph) continue;

        // If adding this paragraph would exceed max size
        if ((currentChunk + ' ' + trimmedParagraph).length > maxChunkSize) {
            if (currentChunk.length >= minChunkSize) {
                chunks.push(currentChunk.trim());
                // Start new chunk with overlap from previous chunk
                const words = currentChunk.split(' ');
                currentChunk = words.slice(-overlap).join(' ') + ' ' + trimmedParagraph;
            } else {
                // Current chunk too small, just add paragraph
                currentChunk += ' ' + trimmedParagraph;
            }

            // If paragraph itself is too long, split it further
            if (trimmedParagraph.length > maxChunkSize) {
                const sentences = trimmedParagraph.split(/[.!?]+\s+/);
                currentChunk = '';
                
                for (const sentence of sentences) {
                    if ((currentChunk + ' ' + sentence).length > maxChunkSize) {
                        if (currentChunk.length >= minChunkSize) {
                            chunks.push(currentChunk.trim());
                            const words = currentChunk.split(' ');
                            currentChunk = words.slice(-overlap).join(' ') + ' ' + sentence;
                        } else {
                            currentChunk += ' ' + sentence;
                        }
                    } else {
                        currentChunk += ' ' + sentence;
                    }
                }
            }
        } else {
            currentChunk += ' ' + trimmedParagraph;
        }
    }

    // Add the last chunk if it meets minimum size
    if (currentChunk.trim().length >= minChunkSize) {
        chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const pipe = await getEmbeddingPipeline();
        const result = await pipe(text, {
            pooling: 'mean',
            normalize: true
        });
        
        // Convert to regular array
        return Array.from(result.data);
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const pipe = await getEmbeddingPipeline();
        const embeddings: number[][] = [];
        
        // Process in batches to avoid memory issues
        const batchSize = 10;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(text => pipe(text, {
                    pooling: 'mean',
                    normalize: true
                }))
            );
            
            embeddings.push(...batchResults.map(r => Array.from(r.data)));
        }
        
        return embeddings;
    } catch (error) {
        console.error('Error generating embeddings:', error);
        throw new Error('Failed to generate embeddings');
    }
}

/**
 * Process a document into chunks with embeddings
 */
export async function processDocumentToChunks(
    sourceId: string,
    sourceName: string,
    content: string,
    options?: {
        maxChunkSize?: number;
        overlap?: number;
        minChunkSize?: number;
    }
): Promise<DocumentChunk[]> {
    // Split into chunks
    const textChunks = chunkText(content, options);
    
    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(textChunks);
    
    // Create document chunks with embeddings
    const documentChunks: DocumentChunk[] = textChunks.map((text, index) => ({
        id: `${sourceId}-chunk-${index}`,
        sourceId,
        sourceName,
        content: text,
        embedding: embeddings[index],
        metadata: {
            chunkIndex: index,
            totalChunks: textChunks.length
        }
    }));
    
    return documentChunks;
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    
    return dotProduct / denominator;
}
