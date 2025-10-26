

import React, { useState, useRef } from 'react';
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
    const carouselRef = useRef<HTMLDivElement>(null);

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
        if (inputValue.trim() && !isLoading) {
            onSubmit(inputValue);
            setInputValue('');
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
        onSubmit(suggestion);
        setInputValue('');
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
    
    const isSendButtonDisabled = isLoading || !inputValue.trim();

    return (
        <div className="p-3 bg-white">
            <div className="max-w-5xl mx-auto w-full">
                {error && <p className="text-sm text-red-600 text-center pb-2">{error}</p>}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 pt-3 pb-2">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <textarea
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Start typing..."
                                className="w-full p-3 rounded-lg bg-transparent text-gray-800 resize-none focus:outline-none focus:ring-0 placeholder:text-gray-500 text-sm no-scrollbar"
                                rows={1}
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-2 pr-2">
                            <span className="text-sm text-gray-500 font-medium">{sourceCount} source{sourceCount !== 1 ? 's' : ''}</span>
                            <button
                                onClick={handleSubmit}
                                disabled={isSendButtonDisabled}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isSendButtonDisabled ? 'bg-gray-200 text-gray-400' : 'bg-gray-800 text-white'}`}
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="relative mt-2 group">
                        <div ref={carouselRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-2 md:px-10">
                            {suggestions.map((suggestion, index) => (
                                <button key={index} onClick={() => handleSuggestionClick(suggestion)} className="h-12 flex items-center text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 whitespace-nowrap hover:bg-[#f8f8f7] transition-colors">
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
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
