import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import ChatInput from './ChatInput';
import WelcomeMessage from './WelcomeMessage';
import ChatMessage from './ChatMessage';
import { Settings2, Loader2, RefreshCcw } from 'lucide-react';

interface ChatViewProps {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    onSubmit: (query: string) => void;
    sourceCount: number;
    onSaveToNote: (message: Message) => void;
    onClearChat: () => void;
    suggestions: string[];
}

const ChatView: React.FC<ChatViewProps> = ({ messages, isLoading, error, onSubmit, sourceCount, onSaveToNote, onClearChat, suggestions }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);
    
    return (
        <div className="flex-1 min-w-0 h-full bg-white md:rounded-lg md:border md:border-gray-200 flex flex-col overflow-hidden">
            <div className="hidden md:flex items-center justify-between px-4 h-[48px] border-b border-gray-200 flex-shrink-0">
                <h2 className="text-base font-medium text-gray-800">Chat</h2>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={onClearChat}
                        title="Clear chat" 
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#f8f8f7] transition-colors"
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </button>
                    <button title="Configure notebook" className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#f8f8f7] transition-colors">
                        <Settings2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div ref={chatContainerRef} className="flex-1 flex flex-col overflow-y-auto chat-scroll relative">
                {messages.length === 0 && !isLoading ? (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <WelcomeMessage />
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto px-3 py-6 space-y-6 w-full">
                        {messages.map((msg) => (
                           <ChatMessage key={msg.id} message={msg} onSaveToNote={onSaveToNote} />
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <Loader2 className="h-6 w-6 text-gray-600 animate-spin" />
                            </div>
                        )}
                    </div>
                )}
            </div>
            <ChatInput 
                isLoading={isLoading} 
                error={error} 
                onSubmit={onSubmit} 
                sourceCount={sourceCount} 
                suggestions={suggestions}
            />
        </div>
    );
};

export default ChatView;