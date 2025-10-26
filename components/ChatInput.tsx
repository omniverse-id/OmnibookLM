import React, { useState, useRef, useEffect } from 'react';
import { Loader2, ArrowUp, ChevronRight, ChevronLeft } from 'lucide-react';


interface ChatInputProps {
    isLoading: boolean;
    error: string | null;
    onSubmit: (query: string) => void;
    sourceCount: number;
    suggestions: string[];
}

const ChatInput: React.FC<ChatInputProps> = ({ isLoading, error, onSubmit, sourceCount, suggestions }) => {
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const isDisabled = sourceCount === 0;

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        if (inputValue.trim() && !isLoading && !isDisabled) {
            onSubmit(inputValue);
            setInputValue('');
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (isDisabled || isLoading) return;
        // Don't set the input value, just submit directly
        onSubmit(suggestion);
        setInputValue(''); // Clear input in case user was typing something else
    };

    const handleCarouselScrollRight = () => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.clientWidth * 0.8;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleCarouselScrollLeft = () => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.clientWidth * 0.8;
            carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);
    
    const isSendButtonDisabled = isLoading || !inputValue.trim() || isDisabled;

    return (
        <div className="p-3 bg-white">
            <div className="max-w-5xl mx-auto w-full">
                {error && <p className="text-sm text-red-600 text-center pb-2">{error}</p>}
                <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-3 pt-3 pb-2 transition-colors">
                    {isDisabled && <div className="absolute inset-0 z-10 cursor-not-allowed rounded-lg" title="Select one or more sources to begin" />}
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={isDisabled ? "Select one or more sources to begin" : "Start typing..."}
                                className="w-full p-3 rounded-lg bg-transparent text-gray-800 resize-none focus:outline-none focus:ring-0 placeholder:text-gray-500 text-sm no-scrollbar max-h-48"
                                rows={1}
                            />
                        </div>
                        <div className="flex items-center gap-3 pb-2 pr-2">
                            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{sourceCount} source{sourceCount !== 1 ? 's' : ''}</span>
                            <button
                                onClick={handleSubmit}
                                disabled={isSendButtonDisabled}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${isSendButtonDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white'}`}
                                aria-label={isDisabled ? 'Select a source to chat' : 'Send message'}
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                     {/* Always render suggestions container if suggestions exist to maintain height */}
                     {suggestions.length > 0 && (
                        <div className="relative mt-2 group">
                            <div ref={carouselRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-2 md:px-10">
                                {suggestions.map((suggestion, index) => (
                                    <button 
                                        key={index} 
                                        onClick={() => handleSuggestionClick(suggestion)} 
                                        className={`h-12 flex items-center text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 whitespace-nowrap transition-colors ${isDisabled ? 'cursor-not-allowed opacity-75' : 'hover:bg-[#f8f8f7]'}`}
                                        disabled={isDisabled || isLoading}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleCarouselScrollLeft} className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-lg shadow-md hidden md:flex items-center justify-center hover:bg-[#f8f8f7] transition-colors border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ChevronLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <button onClick={handleCarouselScrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-lg shadow-md hidden md:flex items-center justify-center hover:bg-[#f8f8f7] transition-colors border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ChevronRight className="h-5 w-5 text-gray-600" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInput;