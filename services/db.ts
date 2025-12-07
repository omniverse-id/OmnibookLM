

import Dexie, { type Table } from 'dexie';
import { Notebook, Source, SourceStatus } from '../types';
import type { DocumentChunk } from './embeddingService';

// Omit non-serializable properties for DB storage
export interface SourceDB extends Omit<Source, 'content'> {
    content?: ArrayBuffer;
}

// FIX: Switched from a class-based to an interface-based approach for defining the DB.
// This resolves TypeScript typing issues with Dexie's `version` and `transaction` methods
// that can occur in some compiler configurations when subclassing Dexie.
export const db = new Dexie('NotebookLMDB') as Dexie & {
    notebooks: Table<Notebook, number>;
    sources: Table<SourceDB, string>;
    vectorChunks: Table<DocumentChunk, string>;
};

db.version(1).stores({
    notebooks: '++id, title',
    sources: 'id, notebookId'
});

// Add vectorChunks table in version 2
db.version(2).stores({
    notebooks: '++id, title',
    sources: 'id, notebookId',
    vectorChunks: 'id, sourceId'
});


// --- Notebook Operations ---

export const getAllNotebooks = async (): Promise<Notebook[]> => {
    return db.notebooks.reverse().toArray();
};

export const addNotebook = async (notebook: Omit<Notebook, 'id'>): Promise<number> => {
    return db.notebooks.add(notebook as Notebook);
};

export const updateNotebookTitle = async (id: number, title: string): Promise<number> => {
    return db.notebooks.update(id, { title });
};

export const deleteNotebook = async (id: number): Promise<void> => {
    // FIX: Use table names as strings in transactions for robustness with this DB setup pattern.
    // Transaction to delete notebook and all its sources
    return db.transaction('rw', 'notebooks', 'sources', async () => {
        await db.sources.where('notebookId').equals(id).delete();
        await db.notebooks.delete(id);
    });
};

// --- Source Operations ---

export const getSourcesByNotebookId = async (notebookId: number): Promise<Source[]> => {
    const sourcesFromDB = await db.sources.where('notebookId').equals(notebookId).toArray();
    // The objects from DB are compatible with the Source type for reading purposes
    // (content will be ArrayBuffer or undefined, not File)
    return sourcesFromDB as Source[];
};

export const addSource = async (source: Source): Promise<string> => {
    const { content, ...restOfSource } = source;
    const sourceForDB: SourceDB = { ...restOfSource };
    if (content instanceof File) {
        sourceForDB.content = await content.arrayBuffer();
    } else if (content instanceof ArrayBuffer) {
        sourceForDB.content = content;
    }
    // Changed from add to put for upsert functionality
    return db.sources.put(sourceForDB);
};


export const updateSourceStatus = async (id: string, status: SourceStatus): Promise<number> => {
    return db.sources.update(id, { status });
}


export const deleteSource = async (id: string): Promise<void> => {
    return db.sources.delete(id);
};