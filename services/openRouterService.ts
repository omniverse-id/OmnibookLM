import { Source, SourceStatus, Message, DiscoverResults } from '../types';
import { vectorStore, SearchResult } from './vectorStore';
import { generateEmbedding } from './embeddingService';

/**
 * OpenRouter Service
 * 
 * This service implements a true RAG (Retrieval-Augmented Generation) architecture:
 * 1. Documents are chunked and embedded when uploaded
 * 2. User queries are embedded to find relevant context
 * 3. Retrieved context is provided to the LLM for grounded responses
 * 4. Responses include citations to source material
 */

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Default model - can be changed based on your needs
const DEFAULT_MODEL = 'openai/gpt-4o-mini'; // Cost-effective and powerful
// Alternative models you can use:
// - 'openai/gpt-4o' (most capable)
// - 'anthropic/claude-3.5-sonnet' (excellent reasoning)
// - 'google/gemini-pro-1.5' (long context)
// - 'meta-llama/llama-3.1-70b-instruct' (open source)

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    max_tokens?: number;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter(
    messages: OpenRouterMessage[],
    model: string = DEFAULT_MODEL,
    temperature: number = 0.7
): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not configured. Please set it in your environment.');
    }

    const request: OpenRouterRequest = {
        model,
        messages,
        temperature,
        max_tokens: 2000,
    };

    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'NotebookLM Clone',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `OpenRouter API error: ${response.status} ${response.statusText}. ${
                    errorData.error?.message || ''
                }`
            );
        }

        const data: OpenRouterResponse = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from OpenRouter API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenRouter API call failed:', error);
        throw error;
    }
}

/**
 * Format retrieved chunks for the prompt
 */
function formatRetrievedContext(results: SearchResult[]): string {
    return results
        .map((result, index) => {
            return `[Source ${index + 1}] (Relevance: ${(result.score * 100).toFixed(1)}%)
Document: ${result.chunk.sourceName}
Content: ${result.chunk.content}
---`;
        })
        .join('\n\n');
}

/**
 * Create source citation mapping for response processing
 */
function createCitationMap(results: SearchResult[]): Map<number, SearchResult> {
    const map = new Map<number, SearchResult>();
    results.forEach((result, index) => {
        map.set(index + 1, result);
    });
    return map;
}

/**
 * Generate RAG-based chat response
 * 
 * This is the core RAG function that:
 * 1. Embeds the user query
 * 2. Retrieves relevant chunks from the vector store
 * 3. Constructs a prompt with retrieved context
 * 4. Generates a response using OpenRouter
 * 5. Returns the response with source citations
 */
export const generateChatResponse = async (
    query: string,
    sources?: Source[],
    conversationHistory?: Message[]
): Promise<{ text: string; retrievedChunks?: SearchResult[] }> => {
    if (!query.trim()) {
        return { text: "Please enter a query." };
    }

    const checkedSources = sources?.filter(s => s.status === SourceStatus.INDEXED) || [];

    // If no sources, provide a general response
    if (checkedSources.length === 0) {
        const messages: OpenRouterMessage[] = [
            {
                role: 'system',
                content: 'You are a helpful AI assistant. Format your responses using Markdown for readability.',
            },
            {
                role: 'user',
                content: query,
            },
        ];

        const text = await callOpenRouter(messages);
        return { text };
    }

    // ===== RAG PIPELINE =====

    // Step 1: Generate embedding for the user query
    console.log('Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Retrieve relevant chunks from vector store
    console.log('Searching vector store...');
    const sourceIds = checkedSources.map(s => s.id);
    const retrievedChunks = await vectorStore.search(queryEmbedding, {
        topK: 8, // Retrieve top 8 most relevant chunks
        sourceIds: sourceIds,
        minScore: 0.3, // Minimum similarity threshold
    });

    console.log(`Retrieved ${retrievedChunks.length} relevant chunks`);

    // Step 3: Handle cases where no relevant context is found
    if (retrievedChunks.length === 0) {
        const messages: OpenRouterMessage[] = [
            {
                role: 'system',
                content: `You are an AI assistant. The user has uploaded ${checkedSources.length} source(s), but no relevant content was found for their query. Politely inform them that their sources don't contain information about this topic.`,
            },
            {
                role: 'user',
                content: query,
            },
        ];

        const text = await callOpenRouter(messages);
        return { text, retrievedChunks: [] };
    }

    // Step 4: Construct RAG prompt with retrieved context
    const contextText = formatRetrievedContext(retrievedChunks);
    
    // Build conversation context if available
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
        conversationContext = '\n\n**Previous Conversation:**\n';
        conversationContext += conversationHistory
            .slice(-4) // Last 4 messages for context
            .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
            .join('\n');
    }

    const systemPrompt = `You are an expert AI assistant that answers questions based ONLY on the provided source material.

**Your Task:**
1. Carefully read and analyze the retrieved source material below
2. Answer the user's question using ONLY information from these sources
3. Cite your sources using the format [Source N] where N is the source number
4. If the sources don't contain enough information to fully answer the question, state what is covered and what isn't
5. Use clear Markdown formatting (headings, lists, bold text, etc.)
6. Be concise but thorough

**CRITICAL RULES:**
- ONLY use information from the provided sources
- ALWAYS cite sources for factual claims using [Source N]
- If sources contradict each other, mention both perspectives with citations
- If the answer isn't in the sources, say so clearly
- Do NOT make up information or use external knowledge

**Retrieved Source Material:**
${contextText}${conversationContext}`;

    const messages: OpenRouterMessage[] = [
        {
            role: 'system',
            content: systemPrompt,
        },
        {
            role: 'user',
            content: `**Question:** ${query}`,
        },
    ];

    // Step 5: Generate response using OpenRouter
    console.log('Generating response with OpenRouter...');
    const text = await callOpenRouter(messages, DEFAULT_MODEL, 0.3); // Lower temperature for factual accuracy

    console.log('RAG response generated successfully');
    
    return { 
        text, 
        retrievedChunks 
    };
};

/**
 * Discover sources using OpenRouter (web search)
 */
export const discoverSources = async (topic: string): Promise<DiscoverResults> => {
    try {
        const systemPrompt = `You are an expert research assistant. Find relevant, high-quality sources on the given topic.

Provide:
1. A concise one-paragraph summary of key findings (use markdown formatting)
2. A list of 5-7 excellent sources with title, URL, and brief description

Ensure all URLs are valid and directly accessible.`;

        const userPrompt = `Research topic: "${topic}"

Provide your response in the following JSON format:
{
  "summary": "One paragraph summary with *markdown* emphasis",
  "sources": [
    {
      "title": "Source title",
      "link": "https://...",
      "description": "Brief one-sentence description"
    }
  ]
}`;

        const messages: OpenRouterMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ];

        const responseText = await callOpenRouter(messages, DEFAULT_MODEL, 0.7);
        
        // Extract JSON from the response (handle markdown code blocks)
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const result = JSON.parse(jsonText);
        
        if (result.summary && Array.isArray(result.sources)) {
            return result as DiscoverResults;
        } else {
            throw new Error('Invalid response format from AI');
        }
    } catch (error) {
        console.error('Error discovering sources:', error);
        throw new Error('Failed to discover sources. Please try again.');
    }
};

/**
 * Generate conversation suggestions
 */
export const generateSuggestions = async (
    sources: Source[],
    messages: Message[]
): Promise<string[]> => {
    const defaultSuggestions = [
        "Can you explain the main concept in simpler terms?",
        "What are the key takeaways from these sources?",
        "How does this information connect to related topics?",
    ];

    const checkedSources = sources.filter(s => s.status === SourceStatus.INDEXED);

    if (checkedSources.length === 0 && messages.length === 0) {
        return [
            "Summarize the key points from my sources",
            "What are the main themes discussed?",
            "Find connections between different sources",
        ];
    }

    try {
        // Build context
        let context = '';
        
        if (messages.length > 0) {
            context += 'Recent conversation:\n';
            context += messages
                .slice(-3)
                .map(m => `${m.sender}: ${m.text.substring(0, 200)}`)
                .join('\n');
        }

        if (checkedSources.length > 0) {
            context += `\n\nUser has ${checkedSources.length} source document(s) loaded.`;
        }

        const systemPrompt = `Generate three insightful follow-up questions a user might ask based on their context. The questions should be:
- Specific and actionable
- Build on the existing conversation
- Help the user explore the topic deeper

Respond in JSON format:
{
  "suggestions": ["Question 1?", "Question 2?", "Question 3?"]
}`;

        const messages_req: OpenRouterMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context },
        ];

        const responseText = await callOpenRouter(messages_req, DEFAULT_MODEL, 0.8);
        
        // Extract JSON
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const result = JSON.parse(jsonText);
        
        if (result.suggestions && Array.isArray(result.suggestions)) {
            return result.suggestions.slice(0, 3);
        }

        return defaultSuggestions;
    } catch (error) {
        console.error('Error generating suggestions:', error);
        return defaultSuggestions;
    }
};
