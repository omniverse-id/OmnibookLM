<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NotebookLM Clone - RAG-Powered AI Assistant

A true **RAG (Retrieval-Augmented Generation)** application that intelligently searches your documents to provide accurate, cited responses using OpenRouter's multi-model API.

## 🎯 Key Features

- ✅ **True RAG Architecture**: Semantic search with vector embeddings
- ✅ **Multi-Model Support**: GPT-4, Claude, Llama, Gemini via OpenRouter
- ✅ **Smart Document Processing**: Automatic chunking and embedding
- ✅ **Source Citations**: Transparent references to source material
- ✅ **Offline-Capable**: In-browser embeddings with IndexedDB storage
- ✅ **Multi-Format**: PDFs, text, images, audio, websites, YouTube

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API key:**
   
   Create a `.env.local` file:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

   Or for Vite projects, use:
   ```bash
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:5173`

## 📖 How It Works

### Traditional Approach ❌
```
Query → Send ENTIRE document to LLM → Response
```
Problems: Token limits, expensive, irrelevant context

### RAG Approach ✅
```
1. Upload → Chunk → Embed → Store in Vector DB
2. Query → Search → Retrieve relevant chunks only
3. Query + Context → LLM → Cited Response
```
Benefits: Scalable, accurate, cost-effective, transparent

## 📚 Documentation

- **[RAG Implementation Guide](./RAG_IMPLEMENTATION.md)** - Comprehensive architecture and usage guide
- **[API Configuration](./services/openRouterService.ts)** - Model selection and parameters

## 🎛️ Configuration

### Choose Your Model

Edit `services/openRouterService.ts`:

```typescript
const DEFAULT_MODEL = 'openai/gpt-4o-mini'; // Fast & cheap
// const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet'; // Best reasoning
// const DEFAULT_MODEL = 'openai/gpt-4o'; // Most capable
```

### Tune Retrieval

```typescript
topK: 8,        // Number of chunks to retrieve (3-15)
minScore: 0.3,  // Similarity threshold (0.2-0.5)
```

## 🧪 Testing

1. Upload a document (PDF recommended)
2. Wait for "Processing embeddings..." in console
3. Ask: "What are the main points?"
4. Verify citations: `[Source 1]` in response

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐    │
│  │ Document │  │  Query   │  │  Chat    │  │ Studio  │    │
│  │ Upload   │  │  Input   │  │  View    │  │ Panel   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────────┘    │
│       │             │              │                         │
└───────┼─────────────┼──────────────┼─────────────────────────┘
        │             │              │
        ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                  RAG Processing Layer                        │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Embedding     │  │  Vector      │  │  OpenRouter    │  │
│  │  Service       │  │  Store       │  │  Service       │  │
│  │ (Transformers) │  │ (IndexedDB)  │  │  (API)         │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │                     │                    │
        ▼                     ▼                    ▼
   [Embeddings]         [Vector Search]     [LLM Generation]
```

## 🔧 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Vector Search**: In-memory + IndexedDB
- **Embeddings**: Transformers.js (`all-MiniLM-L6-v2`)
- **LLM API**: OpenRouter (multi-model)
- **Document Processing**: PDF.js, File API
- **State Management**: React Hooks + Dexie

## 💡 Use Cases

- 📄 **Research Assistant**: Query multiple papers
- 📚 **Study Aid**: Understand textbooks
- 📝 **Document Q&A**: Search contracts, manuals
- 🎓 **Learning**: Ask questions about course materials
- 💼 **Business**: Analyze reports and documents

## 🐛 Troubleshooting

### Embeddings not generating?
```javascript
// Check in browser console:
import { vectorStore } from './services/vectorStore';
console.log(vectorStore.getStats());
```

### OpenRouter errors?
- `401`: Check API key in `.env.local`
- `429`: Rate limited, wait a moment
- `402`: Add credits at [openrouter.ai](https://openrouter.ai)

### Documents not processing?
- Check browser console for errors
- Ensure PDF is text-based (not scanned)
- Try a smaller file first

## 📊 Performance

### With RAG:
- 💰 **5x cheaper** (only relevant chunks sent)
- 📈 **Unlimited documents** (no context window limits)
- 🎯 **More accurate** (focused context)
- 🔍 **Transparent** (source citations)

### Metrics:
- Embedding: ~100-500ms per document
- Search: <50ms for 1000 chunks
- Generation: 1-3s depending on model

## 🤝 Contributing

Improvements welcome! Consider:
- Hybrid search (BM25 + vector)
- Re-ranking models
- Streaming responses
- Query expansion
- Better chunking strategies

## 📄 License

MIT License - See LICENSE file

## 🙏 Credits

Built with:
- [OpenRouter](https://openrouter.ai) - Multi-model API
- [Transformers.js](https://huggingface.co/docs/transformers.js) - In-browser ML
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF parsing
- [Dexie](https://dexie.org/) - IndexedDB wrapper

---

**View original AI Studio app:** https://ai.studio/apps/drive/1bPLpd0tomboyZizO0czTC4E6u1SVCN2O

**Questions?** Check [RAG_IMPLEMENTATION.md](./RAG_IMPLEMENTATION.md) for detailed docs.
