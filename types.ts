import React from 'react';

export type IconName = 'TrendingUp' | 'Bot' | 'BookOpen' | 'FileText' | 'Router' | 'ScrollText';

export enum SourceStatus {
    INDEXING = 'indexing',
    INDEXED = 'indexed',
    FAILED = 'failed'
}

export type SourceType = 'video' | 'pdf' | 'image' | 'file' | 'text' | 'website' | 'youtube' | 'audio';

export interface Source {
    id: string;
    name: string;
    type: SourceType;
    status: SourceStatus;
    checked: boolean;
    notebookId: number;
    content?: File | ArrayBuffer; // For binary content
    textContent?: string; // For text content like URLs or pasted text
    base64Content?: string; // For image/audio base64 data
    mimeType?: string; // Mime type for base64 content
}

export interface Chunk {
    sourceIndex: number;
    content: string;
}

export interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    sources?: Source[];
    chunks?: Chunk[];
}

export interface StudioTool {
    id: number;
    name:string;
    icon: React.ElementType;
}

export interface Artifact {
    id: number;
    title: string;
    icon: React.ElementType;
    details: string;
    content?: string;
    sources?: Source[];
    chunks?: Chunk[];
}

export interface Notebook {
    id: number;
    icon: IconName;
    title: string;
    date: string;
    sources: number;
}

export interface DiscoveredSource {
  title: string;
  link: string;
  description: string;
}

export interface DiscoverResults {
  summary: string;
  sources: DiscoveredSource[];
}

export type ConversationalStyle = 'Default' | 'Learning Guide' | 'Custom';
export type ResponseLength = 'Default' | 'Longer' | 'Shorter';

export interface ChatConfig {
    style: ConversationalStyle;
    length: ResponseLength;
    customPrompt?: string;
}