import { GoogleGenAI, Type } from "@google/genai";
import { Source, SourceStatus, Message, Chunk } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createChunks = (sources: Source[]): Chunk[] => {
    const chunks: Chunk[] = [];
    sources.forEach((source, sourceIndex) => {
        if (source.type === 'youtube' || source.type === 'website' || !source.textContent) return;
        
        const paragraphs = source.textContent.split(/\n\s*\n/).filter(p => p.trim().length > 100);
        
        if (paragraphs.length > 0) {
            paragraphs.forEach(p => {
                chunks.push({ sourceIndex, content: p.trim() });
            });
        } else if (source.textContent.trim().length > 0) {
             chunks.push({ sourceIndex, content: source.textContent.trim() });
        }
    });
    return chunks;
};

const callGemini = async (contents: string, systemInstruction?: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: systemInstruction ? { systemInstruction } : undefined
    });
    return response.text;
}

export const generateChatResponse = async (query: string, sources?: Source[]): Promise<{ text: string, chunks?: Chunk[] }> => {
    if (!query.trim()) return { text: "Please enter a query." };

    const checkedSources = sources?.filter(s => s.status === SourceStatus.INDEXED) || [];

    if (checkedSources.length === 0) {
        const lowerCaseQuery = query.toLowerCase().trim();
        if (lowerCaseQuery.includes('summarize') || lowerCaseQuery.includes('summary')) {
            const text = "I can summarize a source for you, but you need to add one first. Please upload a document, image, or link to get started.";
            return { text };
        }
        const text = await callGemini(query, 'You are a helpful assistant. Please format all of your responses using Markdown for readability.');
        return { text };
    }

    const parts: any[] = [];
    const textChunksForCitation = createChunks(checkedSources.filter(s => s.type === 'text' || s.type === 'pdf'));
    let combinedTextContext = '';

    // Process image and audio sources as inline data parts
    for (const source of checkedSources) {
        if ((source.type === 'image' || source.type === 'audio') && source.base64Content && source.mimeType) {
            parts.push({
                inlineData: {
                    mimeType: source.mimeType,
                    data: source.base64Content,
                }
            });
        }
    }

    // Process text-based content for citation context
    if (textChunksForCitation.length > 0) {
        const sourceContentForPrompt = textChunksForCitation
            .map((chunk, i) => `Source [${i + 1}]:\n${chunk.content}`)
            .join('\n\n---\n\n');
        combinedTextContext += `**Source Material:**\n${sourceContentForPrompt}\n\n`;
    }

    // Combine all text-based information into a single text part
    const websiteSources = checkedSources.filter(s => s.type === 'website');
    const youtubeSources = checkedSources.filter(s => s.type === 'youtube');
    const config: any = {};

    if (websiteSources.length > 0 || youtubeSources.length > 0) {
        config.tools = [{ googleSearch: {} }];
        if (websiteSources.length > 0) {
            const urls = websiteSources.map(s => s.name).join('\n');
            combinedTextContext += `Use the content from the following web pages to help answer the question:\n<web_sources>\n${urls}\n</web_sources>\n\n`;
        }
        if (youtubeSources.length > 0) {
            const urls = youtubeSources.map(s => s.name).join('\n');
            combinedTextContext += `Use the content from the following YouTube videos to help answer the question:\n<video_sources>\n${urls}\n</video_sources>\n\n`;
        }
    }

    const systemInstruction = `You are an expert AI assistant. Your task is to answer the user's query based ONLY on the provided source material, which may include text, images, and audio.
- Analyze the user's query and all provided sources.
- Synthesize an answer from the information found in the sources.
- **For text sources:** You MUST cite the sources you use. When you use information from a text source, add a citation marker \`[source:n]\` at the end of the relevant sentence, where 'n' is the 1-based index of the source chunk provided in the 'Source Material' section.
- If multiple sources support a sentence, add multiple citations, like \`[source:1][source:3]\`.
- **For image/audio sources:** Refer to them by name (e.g., "In the image 'cat.jpg'..." or "The audio file 'meeting.mp3' contains..."). The model will have direct access to these files.
- Do not use any information outside of the provided sources. If the sources do not contain the answer, state that the information is not available in the provided materials.
- Format your entire response in Markdown for clear readability (using headings, lists, bold text, etc.).`;

    config.systemInstruction = systemInstruction;

    // Add the consolidated text context and the user's query as the final text part
    parts.push({ text: `${combinedTextContext}**User Query:**\n${query}` });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: parts },
        config: config,
    });

    return { text: response.text, chunks: textChunksForCitation };
};


export const generateSuggestions = async (sources: Source[], messages: Message[]): Promise<string[]> => {
    const defaultSuggestions = [
        "Can you explain the main concept in simpler terms?",
        "What are the opposing viewpoints on this topic?",
        "What should I read next to learn more?"
    ];
    
    const checkedSources = sources.filter(s => s.status === SourceStatus.INDEXED);
    
    if (checkedSources.length === 0 && messages.length === 0) {
        return [
            "Summarize the key takeaways from the provided sources.",
            "What are the main arguments presented in the material?",
            "Create a list of action items based on our conversation."
        ];
    }
    
    try {
        let context = "";

        if (checkedSources.length > 0) {
            const sourceContent = checkedSources
                .map(s => s.textContent)
                .filter(Boolean)
                .slice(0, 5) // Limit context size
                .join('\n\n');
            if(sourceContent) context += `SOURCES:\n${sourceContent.substring(0, 4000)}\n\n`; // Limit context size
        }

        if (messages.length > 0) {
            const conversationHistory = messages
                .slice(-4)
                .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
                .join('\n');
            context += `CONVERSATION HISTORY:\n${conversationHistory}\n\n`;
        }

        if (!context.trim()) {
            return defaultSuggestions;
        }

        const prompt = `Generate three distinct, insightful, and concise questions a user might ask next. The questions must be phrased from the user's perspective.

**CRITICAL: Follow these language rules:**
1.  First, identify the primary language of the provided SOURCES.
2.  If the language is **NOT English** (e.g., Indonesian), generate suggestions in that language.
3.  If the language **IS English**, check the CONVERSATION HISTORY. Generate suggestions in the same language the USER is using.
4.  If sources and conversation are both English (or history is empty), use English.

Context:
${context}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            description: "An array of three suggested questions.",
                            items: {
                                type: Type.STRING
                            }
                        }
                    },
                    required: ['suggestions']
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        
        if (result.suggestions && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
            return result.suggestions.slice(0, 3);
        }

        return defaultSuggestions;

    } catch (error) {
        console.error("Error generating suggestions:", error);
        return defaultSuggestions;
    }
};