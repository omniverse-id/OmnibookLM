# 🚀 Quick Start Guide - RAG Implementation

## What Changed?

Your app now uses **true RAG (Retrieval-Augmented Generation)** instead of dumping entire documents into the LLM.

### Before (Gemini API):
```
Upload Document → Send entire text to Gemini → Response
```
**Problems:** Limited by token windows, expensive, slow

### Now (OpenRouter + RAG):
```
Upload Document → Chunk → Embed → Vector Store
User Query → Search vectors → Retrieve top chunks → OpenRouter → Response
```
**Benefits:** Unlimited docs, faster, cheaper, more accurate

## 🎯 5-Minute Setup

### 1. Get OpenRouter API Key (2 minutes)

1. Go to https://openrouter.ai
2. Sign up (free)
3. Click "Keys" → "Create Key"
4. Copy your key: `sk-or-v1-...`
5. Add $5 credits (enough for ~10,000 queries)

### 2. Configure Environment (1 minute)

Create `.env.local` file:
```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**Important for Vite users:** If the above doesn't work, use:
```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

And update line 4 in `services/openRouterService.ts`:
```typescript
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
```

### 3. Install & Run (2 minutes)

```bash
npm install
npm run dev
```

Open http://localhost:5173

## ✅ Test It Works

### Test 1: Upload & Ask
1. Click "Create new notebook"
2. Upload a PDF (research paper works great)
3. Wait 5-10 seconds (embedding generation)
4. Ask: "What is the main finding?"
5. ✅ You should see `[Source 1]` citations in response

### Test 2: Multiple Documents
1. Upload 2-3 PDFs
2. Ask: "Compare these documents"
3. ✅ Should cite multiple sources

### Test 3: Check Vector Store
Open browser console (F12):
```javascript
// Paste this:
const stats = await import('./services/vectorStore.js').then(m => m.vectorStore.getStats());
console.log(stats);
// Should show: { totalChunks: 124, totalSources: 3, ... }
```

## 🔧 Common Issues

### ❌ "OPENROUTER_API_KEY is not configured"
**Fix:** Create `.env.local` with your key

### ❌ "401 Unauthorized" 
**Fix:** Key is invalid, generate a new one

### ❌ "402 Payment Required"
**Fix:** Add credits at https://openrouter.ai/credits

### ❌ Documents not processing
**Fix:** Check console for errors. Make sure PDF is text-based, not scanned.

### ❌ "Loading embedding model..." forever
**Fix:** First load downloads ~50MB model. Be patient or check network.

## 🎛️ Choose Your Model

Edit `services/openRouterService.ts` line 18:

```typescript
// Budget-friendly (recommended)
const DEFAULT_MODEL = 'openai/gpt-4o-mini'; // $0.15/1M tokens

// Most powerful
// const DEFAULT_MODEL = 'openai/gpt-4o'; // $2.50/1M tokens

// Best reasoning
// const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet'; // $3/1M tokens

// Huge context (1M tokens!)
// const DEFAULT_MODEL = 'google/gemini-pro-1.5'; // $1.25/1M tokens

// Open source (cheapest)
// const DEFAULT_MODEL = 'meta-llama/llama-3.1-70b-instruct'; // $0.35/1M tokens
```

See all models: https://openrouter.ai/models

## 📊 How RAG Works (ELI5)

**Imagine a library with 1000 books:**

### Without RAG:
- You ask: "What do these books say about climate change?"
- System: *Hands you all 1000 books*
- You: "I can't read all this!" 😫

### With RAG:
- You ask: "What do these books say about climate change?"
- System: *Searches index, finds 8 relevant pages*
- System: *Hands you only those 8 pages*
- You: "Perfect, I can read this!" 😊

**That's RAG:** Smart search before asking the AI.

## 🔍 Understanding the Flow

### When you upload a document:

1. **Extract Text**
   - PDF → Text extraction
   - Text → Clean & normalize

2. **Chunk Text**
   ```
   Document (10,000 words)
   ↓
   Split into chunks (~500 words each)
   ↓
   20 chunks with 50-word overlap
   ```

3. **Generate Embeddings**
   ```
   Chunk 1: "Climate change affects..." 
   ↓
   ML Model (in browser!)
   ↓
   [0.23, -0.45, 0.67, ...] (384 numbers)
   ```

4. **Store Vectors**
   ```
   IndexedDB (offline storage)
   ├── Chunk 1 → [vector]
   ├── Chunk 2 → [vector]
   └── ...
   ```

### When you ask a question:

1. **Embed Query**
   ```
   "What causes climate change?"
   ↓
   [0.19, -0.52, 0.71, ...]
   ```

2. **Search Vectors**
   ```
   Compare query vector to all chunk vectors
   ↓
   Cosine similarity
   ↓
   Top 8 most similar chunks
   ```

3. **Build Context**
   ```
   [Source 1] Chunk 7: "Greenhouse gases..."
   [Source 2] Chunk 3: "Carbon emissions..."
   [Source 1] Chunk 15: "Temperature rise..."
   ```

4. **Call OpenRouter**
   ```
   System: Answer using only these sources
   Context: [Retrieved chunks]
   Query: What causes climate change?
   ↓
   OpenRouter API (GPT-4, Claude, etc.)
   ↓
   Response with [Source N] citations
   ```

## 💰 Cost Breakdown

### Example: 10-page research paper

**Without RAG:**
- 10 pages × 500 words = 5,000 words
- ~6,500 tokens per query
- GPT-4o-mini: $0.15 per 1M tokens
- **Cost: $0.001 per query**

**With RAG:**
- 10 pages → 25 chunks
- Query retrieves 8 chunks
- 8 × 250 tokens = 2,000 tokens per query
- **Cost: $0.0003 per query**
- **70% savings!**

Plus: No 128k token limit, works with 100+ documents.

## 🎓 Next Steps

### Beginner
- ✅ Upload one PDF and ask questions
- ✅ Try different types of questions
- ✅ Check source citations

### Intermediate
- 🔧 Try different models in `openRouterService.ts`
- 🔧 Adjust `topK` (number of chunks retrieved)
- 🔧 Modify chunk size in `embeddingService.ts`

### Advanced
- 📖 Read [RAG_IMPLEMENTATION.md](./RAG_IMPLEMENTATION.md)
- 💻 Add hybrid search (BM25 + vectors)
- 💻 Implement re-ranking
- 💻 Add query expansion

## 📚 Learn More

### RAG Concepts
- [What is RAG?](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Vector Databases](https://www.pinecone.io/learn/vector-database/)
- [Semantic Search](https://www.sbert.net/examples/applications/semantic-search/README.html)

### OpenRouter
- [Model Comparison](https://openrouter.ai/models)
- [Pricing Calculator](https://openrouter.ai/models)
- [API Documentation](https://openrouter.ai/docs)

### Embeddings
- [Sentence Transformers](https://www.sbert.net/)
- [Transformers.js](https://huggingface.co/docs/transformers.js)

## ❓ FAQ

**Q: Do I need to change anything in my existing notebooks?**  
A: No! They'll automatically get embeddings when you open them.

**Q: Can I use both Gemini and OpenRouter?**  
A: Yes, see `App.tsx` line 13. Switch import between services.

**Q: Why is the first document slow?**  
A: First load downloads the embedding model (~50MB). Cached afterwards.

**Q: Can I use my own embedding model?**  
A: Yes! Change model in `embeddingService.ts` line 31.

**Q: Is my data sent to OpenRouter?**  
A: Only the retrieved chunks and your query. Full documents stay local.

**Q: Can I run this completely offline?**  
A: Embeddings yes (in-browser), LLM generation no (needs OpenRouter API).

**Q: What's the token limit?**  
A: With RAG, effectively unlimited! Only top chunks sent to LLM.

**Q: How accurate is it?**  
A: Very accurate when sources contain the answer. RAG reduces hallucinations.

## 🆘 Still Stuck?

1. Check browser console (F12) for errors
2. Verify API key is correct
3. Try a smaller document first
4. Check OpenRouter dashboard for API usage
5. Read full docs: [RAG_IMPLEMENTATION.md](./RAG_IMPLEMENTATION.md)

---

**Happy RAG-ing! 🎉**
