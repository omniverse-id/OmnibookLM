# RAG Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE (React)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Notebook   │  │   Sources    │  │     Chat     │  │    Studio    │   │
│  │   Manager    │  │   Sidebar    │  │     View     │  │    Panel     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────────┘   │
│         │                 │                  │                               │
└─────────┼─────────────────┼──────────────────┼───────────────────────────────┘
          │                 │                  │
          │                 │                  │
┌─────────┼─────────────────┼──────────────────┼───────────────────────────────┐
│         │                 │                  │                                │
│         ▼                 ▼                  ▼                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │  Document    │  │   Source     │  │    Query     │                      │
│  │   Upload     │  │  Management  │  │   Handler    │                      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                      │
│         │                 │                  │                                │
│         │                 │                  │         APPLICATION LOGIC     │
│         ▼                 ▼                  ▼                                │
│  ┌─────────────────────────────────────────────────┐                        │
│  │            App.tsx (State Management)            │                        │
│  │  • Notebook state                                 │                        │
│  │  • Source state                                   │                        │
│  │  • Message history                                │                        │
│  │  • Artifact management                            │                        │
│  └──────┬───────────────────────────────────────────┘                        │
│         │                                                                     │
└─────────┼─────────────────────────────────────────────────────────────────────┘
          │
          │
┌─────────┼─────────────────────────────────────────────────────────────────────┐
│         │                        RAG PROCESSING LAYER                          │
│         │                                                                       │
│         ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                     DOCUMENT INGESTION PIPELINE                       │     │
│  │                                                                       │     │
│  │  1. File Upload (PDF, TXT, Audio, Image)                            │     │
│  │          ↓                                                            │     │
│  │  2. Content Extraction                                               │     │
│  │     • PDF.js for PDFs → Text extraction                              │     │
│  │     • FileReader for text files                                      │     │
│  │     • Base64 encoding for media                                      │     │
│  │          ↓                                                            │     │
│  │  3. Text Chunking (embeddingService.ts)                             │     │
│  │     • Split by paragraphs (smart boundaries)                         │     │
│  │     • ~512 tokens per chunk                                          │     │
│  │     • 50-token overlap for context                                   │     │
│  │          ↓                                                            │     │
│  │  4. Embedding Generation (Transformers.js)                          │     │
│  │     • Model: Xenova/all-MiniLM-L6-v2                                │     │
│  │     • Output: 384-dimensional vectors                                │     │
│  │     • Runs in browser (Web Workers)                                  │     │
│  │          ↓                                                            │     │
│  │  5. Vector Storage (vectorStore.ts)                                 │     │
│  │     • In-memory for fast access                                      │     │
│  │     • IndexedDB for persistence                                      │     │
│  │     • Organized by source ID                                         │     │
│  └───────────────────────────────────────────────────────────────────────┘     │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                      QUERY PROCESSING PIPELINE                        │     │
│  │                                                                       │     │
│  │  1. User Query Input                                                 │     │
│  │          ↓                                                            │     │
│  │  2. Query Embedding (embeddingService.ts)                           │     │
│  │     • Same model as documents                                        │     │
│  │     • 384-dimensional vector                                         │     │
│  │     • ~100-300ms                                                     │     │
│  │          ↓                                                            │     │
│  │  3. Vector Search (vectorStore.ts)                                  │     │
│  │     • Cosine similarity calculation                                  │     │
│  │     • Filter by selected sources                                     │     │
│  │     • Top-K retrieval (K=8 by default)                              │     │
│  │     • Minimum score threshold (0.3)                                  │     │
│  │     • Returns ranked results                                         │     │
│  │          ↓                                                            │     │
│  │  4. Context Construction (openRouterService.ts)                     │     │
│  │     • Format retrieved chunks                                        │     │
│  │     • Add source references                                          │     │
│  │     • Include relevance scores                                       │     │
│  │     • Build system prompt                                            │     │
│  │          ↓                                                            │     │
│  │  5. LLM Generation (OpenRouter API)                                 │     │
│  │     • Model: GPT-4o-mini (or user choice)                           │     │
│  │     • Temperature: 0.3 (factual)                                     │     │
│  │     • Max tokens: 2000                                               │     │
│  │     • Streaming: No (can be added)                                   │     │
│  │          ↓                                                            │     │
│  │  6. Response with Citations                                          │     │
│  │     • Markdown formatted                                             │     │
│  │     • [Source N] citations                                           │     │
│  │     • Return to UI                                                   │     │
│  └───────────────────────────────────────────────────────────────────────┘     │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
          │
          │
┌─────────┼─────────────────────────────────────────────────────────────────────┐
│         │                       STORAGE & PERSISTENCE                          │
│         │                                                                       │
│         ▼                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐   │
│  │   IndexedDB (Dexie)   │  │   Vector Store      │  │   Browser Cache  │   │
│  │                       │  │                      │  │                  │   │
│  │  • Notebooks table    │  │  • Document chunks   │  │  • ML model      │   │
│  │  • Sources table      │  │  • Embeddings        │  │  • ~50MB         │   │
│  │  • Chunks table       │  │  • Source mapping    │  │  • Persistent    │   │
│  │  • Offline support    │  │  • Fast retrieval    │  │                  │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘   │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
          │
          │
┌─────────┼─────────────────────────────────────────────────────────────────────┐
│         │                       EXTERNAL SERVICES                              │
│         │                                                                       │
│         ▼                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                        OpenRouter API                                 │    │
│  │                   https://openrouter.ai/api/v1                        │    │
│  │                                                                        │    │
│  │  Supported Models:                                                    │    │
│  │  • openai/gpt-4o-mini          ($0.15/1M tokens) ✓ Default          │    │
│  │  • openai/gpt-4o               ($2.50/1M tokens)                     │    │
│  │  • anthropic/claude-3.5-sonnet ($3.00/1M tokens)                     │    │
│  │  • google/gemini-pro-1.5       ($1.25/1M tokens)                     │    │
│  │  • meta-llama/llama-3.1-70b    ($0.35/1M tokens)                     │    │
│  │  • mistralai/mixtral-8x7b      ($0.24/1M tokens)                     │    │
│  │  • + 50+ other models                                                 │    │
│  │                                                                        │    │
│  │  Features:                                                            │    │
│  │  • Unified API for all models                                         │    │
│  │  • Pay-as-you-go pricing                                              │    │
│  │  • Model fallbacks                                                    │    │
│  │  • Usage analytics                                                    │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Document Upload

```
┌──────────────┐
│  User clicks │
│ Upload File  │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────┐
│  handleFileUpload(files)           │
│  • FileReader reads file           │
│  • PDF.js extracts text (if PDF)   │
│  • Create Source object            │
│  • Save to IndexedDB               │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  processDocumentToChunks()         │
│  • chunkText() splits into pieces  │
│  • ~512 tokens per chunk           │
│  • 50-token overlap                │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  generateEmbeddings()              │
│  • Load Transformers.js model      │
│  • Batch process chunks            │
│  • Generate 384-dim vectors        │
│  • Takes 5-15 seconds              │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  vectorStore.addChunks()           │
│  • Store in memory (Map)           │
│  • Persist to IndexedDB            │
│  • Index by source ID              │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  updateSourceStatus('INDEXED')     │
│  • Update UI                       │
│  • Enable querying                 │
│  • Ready for RAG                   │
└────────────────────────────────────┘
```

## Data Flow: User Query

```
┌──────────────┐
│  User types  │
│    query     │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────┐
│  handleQuerySubmit(query)          │
│  • Create user message             │
│  • Add to conversation history     │
│  • Filter checked sources          │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│  generateChatResponse()            │
│  [openRouterService.ts]            │
└──────┬─────────────────────────────┘
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
┌─────────────────┐         ┌──────────────────┐
│ generateEmbedding│         │ Filter sources   │
│ (query)          │         │ by checked       │
│ ~100-300ms       │         │ status           │
└─────────┬────────┘         └────────┬─────────┘
          │                           │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  vectorStore.search()     │
          │  • Cosine similarity      │
          │  • Top-K=8 chunks         │
          │  • Min score=0.3          │
          │  • <50ms                  │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  Retrieved Chunks         │
          │  [                        │
          │    {chunk, score: 0.85},  │
          │    {chunk, score: 0.78},  │
          │    {chunk, score: 0.71},  │
          │    ...                    │
          │  ]                        │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  formatRetrievedContext() │
          │  • Build context string   │
          │  • Add source labels      │
          │  • Include scores         │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  callOpenRouter()         │
          │  POST /chat/completions   │
          │  {                        │
          │    model: "gpt-4o-mini",  │
          │    messages: [            │
          │      {role: "system", ... }│
          │      {role: "user", ... } │
          │    ]                      │
          │  }                        │
          └───────────┬───────────────┘
                      │
                      ▼ (1-3 seconds)
          ┌───────────────────────────┐
          │  OpenRouter Response      │
          │  • Generated text         │
          │  • With [Source N] cites  │
          │  • Markdown formatted     │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  Create bot message       │
          │  • text: response         │
          │  • retrievedChunks: [...]│
          │  • Add to chat history    │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  Update UI                │
          │  • Display response       │
          │  • Show citations         │
          │  • Ready for next query   │
          └───────────────────────────┘
```

## Vector Search Deep Dive

```
Query: "What causes climate change?"
    ↓
Embed Query
    ↓
[0.23, -0.45, 0.67, 0.12, -0.34, ...] (384 dimensions)
    ↓
Compare to ALL document chunk embeddings
    ↓
┌─────────────────────────────────────────────────┐
│  Chunk 1: "Renewable energy sources..."         │
│  Embedding: [0.15, -0.22, ...]                  │
│  Cosine Similarity: 0.35 ✓                      │
├─────────────────────────────────────────────────┤
│  Chunk 7: "Greenhouse gases trap heat..."       │
│  Embedding: [0.21, -0.48, ...]                  │
│  Cosine Similarity: 0.87 ✓✓✓ TOP MATCH         │
├─────────────────────────────────────────────────┤
│  Chunk 15: "Temperature anomalies..."           │
│  Embedding: [0.19, -0.39, ...]                  │
│  Cosine Similarity: 0.72 ✓✓                     │
├─────────────────────────────────────────────────┤
│  Chunk 23: "Ocean acidification..."             │
│  Embedding: [0.18, -0.41, ...]                  │
│  Cosine Similarity: 0.68 ✓✓                     │
├─────────────────────────────────────────────────┤
│  Chunk 31: "Historical weather patterns..."     │
│  Embedding: [-0.05, 0.12, ...]                  │
│  Cosine Similarity: 0.42 ✓                      │
└─────────────────────────────────────────────────┘
    ↓
Sort by score (descending)
    ↓
Take top-K (K=8)
    ↓
Filter by minScore (0.3)
    ↓
Return: [Chunk7, Chunk15, Chunk23, ...]
```

## Token Economy Comparison

### Without RAG (Old Approach)
```
┌─────────────────────────────────────────┐
│  10-page PDF = 5,000 words              │
│  ↓                                      │
│  Send ENTIRE document to LLM            │
│  ↓                                      │
│  ~6,500 tokens                          │
│  ↓                                      │
│  GPT-4o-mini: $0.15 / 1M tokens        │
│  ↓                                      │
│  Cost per query: $0.001                 │
│                                         │
│  Problems:                              │
│  • Token limit: 128k max                │
│  • Expensive at scale                   │
│  • Slow processing                      │
│  • Lots of irrelevant context           │
└─────────────────────────────────────────┘
```

### With RAG (New Approach)
```
┌─────────────────────────────────────────┐
│  10-page PDF = 5,000 words              │
│  ↓                                      │
│  Chunk into 25 pieces                   │
│  ↓                                      │
│  Embed all chunks (done once)           │
│  ↓                                      │
│  Query retrieves top 8 chunks           │
│  ↓                                      │
│  8 × 250 tokens = 2,000 tokens          │
│  ↓                                      │
│  GPT-4o-mini: $0.15 / 1M tokens        │
│  ↓                                      │
│  Cost per query: $0.0003                │
│                                         │
│  Benefits:                              │
│  • No token limit (unlimited docs)      │
│  • 70% cost savings                     │
│  • Faster (less to process)             │
│  • Only relevant context                │
│  • Better accuracy                      │
└─────────────────────────────────────────┘
```

## Component Responsibilities

```
┌────────────────────────────────────────────────────────┐
│  App.tsx                                               │
│  • Manages application state                           │
│  • Orchestrates document upload                        │
│  • Handles user interactions                           │
│  • Coordinates RAG pipeline                            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  openRouterService.ts                                  │
│  • OpenRouter API integration                          │
│  • RAG query pipeline                                  │
│  • Context construction                                │
│  • Citation management                                 │
│  • Model selection                                     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  embeddingService.ts                                   │
│  • Text chunking (smart splitting)                     │
│  • Embedding generation (Transformers.js)              │
│  • Batch processing                                    │
│  • Cosine similarity calculation                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  vectorStore.ts                                        │
│  • In-memory vector storage                            │
│  • IndexedDB persistence                               │
│  • Similarity search (top-K)                           │
│  • Source filtering                                    │
│  • Chunk management (add/remove)                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  db.ts                                                 │
│  • Dexie (IndexedDB) wrapper                          │
│  • Notebooks CRUD                                      │
│  • Sources CRUD                                        │
│  • Chunks persistence                                  │
└────────────────────────────────────────────────────────┘
```

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| First model load | 10-30s | Downloads ~50MB, cached after |
| Document chunking | 1-5s | Depends on size |
| Embedding generation | 5-15s | Per document, batched |
| Query embedding | 100-300ms | Fast |
| Vector search | <50ms | Extremely fast |
| OpenRouter API call | 1-3s | Depends on model & load |
| **Total query time** | **1.5-3.5s** | End-to-end |

## Scalability

| Metric | Limit | Notes |
|--------|-------|-------|
| Documents | Unlimited | IndexedDB has ~50GB+ |
| Chunks per doc | ~50-200 | Depends on size |
| Total chunks | 10,000+ | Fast search up to 100k |
| Query complexity | Any | Semantic understanding |
| Concurrent queries | 1 | Can add queueing |
| API rate limit | Varies | OpenRouter specific |

---

**This architecture provides a scalable, cost-effective, and accurate RAG system for document Q&A.**
