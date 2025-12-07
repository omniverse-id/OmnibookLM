# RAG Implementation Guide

## 🎯 Overview

This application now implements a **true RAG (Retrieval-Augmented Generation)** architecture using OpenRouter. This means your AI assistant doesn't just dump entire documents into the LLM context - instead, it intelligently searches for and retrieves only the most relevant information to answer your questions.

## 🏗️ Architecture

### Traditional Approach (What you had before)
```
User Query → Send ALL documents to LLM → Generate Response
```
**Problems:**
- Token limits with large documents
- Irrelevant information clutters context
- Expensive API calls
- Poor accuracy with multi-document scenarios

### RAG Approach (What you have now)
```
1. Documents → Chunk → Embed → Store in Vector DB
2. User Query → Embed Query
3. Search Vector DB → Retrieve Top-K Relevant Chunks
4. Query + Retrieved Context → LLM → Generate Response with Citations
```

**Benefits:**
- ✅ Handles unlimited document sizes
- ✅ Only relevant context sent to LLM
- ✅ More accurate, grounded responses
- ✅ Source citations for transparency
- ✅ Cost-effective (fewer tokens)

## 🔧 Components

### 1. **Document Processing Pipeline** (`embeddingService.ts`)
- **Chunking**: Splits documents into semantic chunks (~512 tokens)
  - Smart splitting by paragraphs, sentences
  - Overlap between chunks for context preservation
- **Embedding**: Converts text to 384-dimensional vectors
  - Uses `Xenova/all-MiniLM-L6-v2` (runs in browser!)
  - Semantic similarity representation

### 2. **Vector Store** (`vectorStore.ts`)
- **In-Memory Storage**: Fast vector similarity search
- **Persistence**: IndexedDB for offline capability
- **Search**: Cosine similarity for semantic matching
- **Management**: Add, remove, update chunks by source

### 3. **RAG Service** (`openRouterService.ts`)
- **Query Embedding**: Converts user questions to vectors
- **Retrieval**: Finds top-K most relevant chunks
- **Context Construction**: Formats retrieved chunks for LLM
- **Generation**: OpenRouter API call with context
- **Citation**: Tracks and returns source references

### 4. **OpenRouter Integration**
- **Multiple Models**: Switch between GPT-4, Claude, Llama, etc.
- **Cost-Effective**: Pay only for what you use
- **Unified API**: One interface for many models

## 🚀 Setup Instructions

### Step 1: Get OpenRouter API Key
1. Visit [https://openrouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Go to [Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Add credits to your account (starts at $5)

### Step 2: Configure Environment
1. Create a `.env.local` file in the project root:
```bash
OPENROUTER_API_KEY=sk-or-v1-...your-key-here...
```

2. **For Vite Development**: The app uses `process.env.OPENROUTER_API_KEY`
   - Vite automatically loads `.env.local`
   - Prefix with `VITE_` if needed: `VITE_OPENROUTER_API_KEY`
   - Update `openRouterService.ts` to use `import.meta.env.VITE_OPENROUTER_API_KEY`

### Step 3: Install Dependencies
```bash
npm install
```

Dependencies used:
- `@xenova/transformers` - Browser-based ML models
- `dexie` - IndexedDB wrapper
- Standard fetch API for OpenRouter

### Step 4: Run the Application
```bash
npm run dev
```

## 📖 How It Works

### When You Upload a Document:

1. **File Upload** → `handleFileUpload()` in `App.tsx`
   ```typescript
   // PDF extraction
   const pdf = await pdfjs.getDocument(arrayBuffer).promise;
   // Extract text from all pages
   ```

2. **Chunking** → `processDocumentToChunks()`
   ```typescript
   // Split into semantic chunks
   const chunks = chunkText(content, {
     maxChunkSize: 512,
     overlap: 50
   });
   ```

3. **Embedding** → `generateEmbeddings()`
   ```typescript
   // Convert chunks to vectors
   const embeddings = await embeddingPipeline(chunks);
   ```

4. **Storage** → `vectorStore.addChunks()`
   ```typescript
   // Store in memory + IndexedDB
   await vectorStore.addChunks(documentChunks);
   ```

### When You Ask a Question:

1. **Query Embedding** → `generateEmbedding(query)`
   ```typescript
   const queryEmbedding = await generateEmbedding(userQuery);
   ```

2. **Similarity Search** → `vectorStore.search()`
   ```typescript
   const results = await vectorStore.search(queryEmbedding, {
     topK: 8,           // Get top 8 chunks
     minScore: 0.3,     // Minimum 30% similarity
     sourceIds: [...]   // Only search checked sources
   });
   ```

3. **Context Construction**
   ```typescript
   const context = results.map((r, i) => 
     `[Source ${i+1}] (${r.score}%)\n${r.chunk.content}`
   ).join('\n\n');
   ```

4. **LLM Generation** → `callOpenRouter()`
   ```typescript
   const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       model: 'openai/gpt-4o-mini',
       messages: [
         { role: 'system', content: systemPrompt + context },
         { role: 'user', content: query }
       ]
     })
   });
   ```

5. **Response with Citations**
   ```markdown
   The study found that... [Source 1]
   
   Additionally, research shows... [Source 3][Source 5]
   ```

## 🎛️ Configuration Options

### Model Selection (`openRouterService.ts`)
```typescript
const DEFAULT_MODEL = 'openai/gpt-4o-mini'; // Current default

// Alternative models:
// 'openai/gpt-4o'                    // Most capable, expensive
// 'anthropic/claude-3.5-sonnet'     // Great reasoning
// 'google/gemini-pro-1.5'           // 1M token context
// 'meta-llama/llama-3.1-70b-instruct' // Open source
// 'mistralai/mixtral-8x7b-instruct' // Fast & cheap
```

### Retrieval Parameters
```typescript
// In openRouterService.ts - generateChatResponse()
const retrievedChunks = await vectorStore.search(queryEmbedding, {
  topK: 8,         // Number of chunks to retrieve (adjust 3-15)
  minScore: 0.3,   // Minimum similarity (0.2-0.5 recommended)
  sourceIds: ...   // Filter by specific sources
});
```

### Chunking Parameters
```typescript
// In embeddingService.ts - chunkText()
const chunks = chunkText(text, {
  maxChunkSize: 512,  // Max tokens per chunk (256-1024)
  overlap: 50,        // Overlap between chunks (20-100)
  minChunkSize: 100   // Min chunk size (50-200)
});
```

### Temperature Settings
```typescript
// In openRouterService.ts - callOpenRouter()
const text = await callOpenRouter(messages, model, 0.3);
// 0.0-0.3: Factual, deterministic
// 0.4-0.7: Balanced
// 0.8-1.0: Creative, varied
```

## 🧪 Testing the RAG System

### Test 1: Basic RAG Flow
1. Upload a PDF document (e.g., research paper)
2. Wait for "Processing embeddings..." in console
3. Ask: "What is the main finding of this paper?"
4. Verify: Response includes `[Source N]` citations

### Test 2: Multi-Document
1. Upload 3-5 different documents
2. Ask: "Compare the approaches discussed in these papers"
3. Verify: Response cites multiple sources

### Test 3: Semantic Search
1. Upload a document about "machine learning"
2. Ask: "What are neural networks?" (synonym test)
3. Verify: Retrieves relevant chunks even with different wording

### Test 4: Source Filtering
1. Upload multiple documents
2. Uncheck some sources in the sidebar
3. Ask a question
4. Verify: Only checked sources are used

### Test 5: No Relevant Content
1. Upload a document about "cooking"
2. Ask: "What is quantum physics?"
3. Verify: System says information not found in sources

## 🐛 Debugging

### Check Vector Store
```javascript
// In browser console:
import { vectorStore } from './services/vectorStore';
const stats = vectorStore.getStats();
console.log(stats);
// { totalChunks: 124, totalSources: 3, averageChunksPerSource: 41.3 }
```

### View Retrieved Chunks
Look for console logs:
```
Generating query embedding...
Searching vector store...
Retrieved 8 relevant chunks
RAG retrieved 8 relevant chunks
```

### Check Embeddings
```javascript
// Test embedding generation:
import { generateEmbedding } from './services/embeddingService';
const embedding = await generateEmbedding("test query");
console.log(embedding.length); // Should be 384
```

### OpenRouter API Errors
Common issues:
- `401 Unauthorized`: Invalid API key
- `429 Too Many Requests`: Rate limit exceeded
- `402 Payment Required`: No credits in account
- `400 Bad Request`: Invalid model name

## 💡 Best Practices

### Document Preparation
- ✅ Use clean, well-formatted PDFs
- ✅ Remove unnecessary headers/footers
- ✅ One topic per document (better chunking)
- ❌ Avoid scanned PDFs (use OCR first)

### Querying
- ✅ Ask specific, focused questions
- ✅ Reference source material in questions
- ✅ Use follow-up questions for clarification
- ❌ Avoid overly broad questions

### Performance
- ✅ Enable only needed sources (uncheck others)
- ✅ Use cheaper models for simple queries
- ✅ Adjust `topK` based on document size
- ❌ Don't upload duplicate documents

## 🔄 Migration from Gemini

The old Gemini service is still available as a fallback. To switch back temporarily:

```typescript
// In App.tsx, change import:
import { generateChatResponse, generateSuggestions } 
  from './services/geminiService'; // Old way
  // from './services/openRouterService'; // New way
```

However, the RAG approach with OpenRouter provides:
- Better handling of large documents
- More accurate retrieval
- Cost-effective token usage
- Multiple model options

## 📊 Cost Comparison

### Without RAG (sending full docs):
- 10,000 tokens per query
- $0.15 per 1M tokens (GPT-4o-mini)
- **$0.0015 per query**
- Limited by context window

### With RAG (sending only relevant chunks):
- ~2,000 tokens per query (8 chunks × ~250 tokens)
- $0.15 per 1M tokens
- **$0.0003 per query**
- **5x cheaper!**
- Unlimited document size

## 🎓 Learning Resources

### RAG Concepts
- [Retrieval-Augmented Generation (Paper)](https://arxiv.org/abs/2005.11401)
- [Vector Databases Explained](https://www.pinecone.io/learn/vector-database/)
- [Semantic Search Tutorial](https://www.sbert.net/examples/applications/semantic-search/README.html)

### OpenRouter
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Model Comparison](https://openrouter.ai/models)
- [Pricing Calculator](https://openrouter.ai/models)

### Embeddings
- [Sentence Transformers](https://www.sbert.net/)
- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js)

## 🤝 Contributing

To improve the RAG implementation:

1. **Better Chunking**: Implement semantic chunking using sentence transformers
2. **Hybrid Search**: Combine vector search with keyword search (BM25)
3. **Re-ranking**: Add a re-ranking model to improve retrieval
4. **Query Expansion**: Generate multiple query variations
5. **Caching**: Cache frequent query embeddings
6. **Streaming**: Implement streaming responses

## 📝 Changelog

### v2.0.0 - RAG Implementation
- ✅ Added OpenRouter integration
- ✅ Implemented vector-based retrieval
- ✅ Automatic embedding generation on upload
- ✅ Smart context selection (top-K retrieval)
- ✅ Source citation tracking
- ✅ IndexedDB persistence for embeddings
- ✅ Multi-model support via OpenRouter

### v1.0.0 - Original (Gemini)
- ❌ No semantic search
- ❌ Entire documents sent to LLM
- ❌ Token limit issues
- ❌ Single model only

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Verify OpenRouter API key is valid
3. Ensure documents are processing (check console logs)
4. Try with a smaller document first
5. Check vector store stats in console

For questions, open an issue on GitHub or contact the development team.

---

**Built with ❤️ using OpenRouter, Transformers.js, and modern RAG architecture**
