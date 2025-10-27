

import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import ChatInput from './ChatInput';
import WelcomeMessage from './WelcomeMessage';
import ChatMessage from './ChatMessage';
import { Settings2, RefreshCcw } from 'lucide-react';

interface ChatViewProps {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    onSubmit: (query: string) => void;
    sourceCount: number;
    totalSourcesCount: number;
    onSaveToNote: (message: Message) => void;
    onClearChat: () => void;
    onAddSource: () => void;
    suggestions: string[];
    onOpenConfigureChat: () => void;
}

const LoadingIndicator = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 300);
        return () => clearInterval(timer);
    }, []);

    return <p className="text-gray-600">Let me learn it{dots}</p>;
};

const ChatView: React.FC<ChatViewProps> = ({ messages, isLoading, error, onSubmit, sourceCount, totalSourcesCount, onSaveToNote, onClearChat, onAddSource, suggestions, onOpenConfigureChat }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);
    
    const showWelcomeArea = messages.length === 0 && !isLoading;

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
                    <button 
                        onClick={onOpenConfigureChat}
                        title="Configure Chat" 
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#f8f8f7] transition-colors"
                    >
                        <Settings2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div ref={chatContainerRef} className="flex-1 flex flex-col overflow-y-auto chat-scroll relative">
                {showWelcomeArea ? (
                    <div className="flex-1 flex items-center justify-center p-4">
                        <WelcomeMessage totalSourcesCount={totalSourcesCount} onAddSource={onAddSource} />
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto px-3 py-6 space-y-6 w-full">
                        {messages.map((msg) => (
                           <ChatMessage key={msg.id} message={msg} onSaveToNote={onSaveToNote} />
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <LoadingIndicator />
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
                totalSourcesCount={totalSourcesCount}
                suggestions={suggestions}
            />
        </div>
    );
};

export default ChatView;