import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Message, Source } from '../types';
import { SourceIcon } from './SourceIcon';
import { Bookmark, Copy, Check } from 'lucide-react';


// Using a global 'marked' instance from the script tag in index.html
declare const marked: {
    parse(markdownString: string): string;
};

interface CitationPopoverProps {
    source: Source;
    chunkContent: string;
    style: React.CSSProperties;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const CitationPopover: React.FC<CitationPopoverProps> = ({ source, chunkContent, style, onMouseEnter, onMouseLeave }) => (
    <div
        style={style}
        className="absolute z-20 w-80 rounded-lg shadow-lg border border-gray-200 bg-white/90 backdrop-blur-md transform -translate-x-1/2 -translate-y-full -mt-3"
        role="tooltip"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
        <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 flex-shrink-0 bg-white rounded-full flex items-center justify-center border border-gray-200">
                    <SourceIcon type={source.type} status={source.status} sizeClass="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate" title={source.name}>{source.name}</p>
            </div>
            <p className="text-sm text-gray-700 line-clamp-4" title={chunkContent}>{chunkContent}</p>
        </div>
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-3 h-3 bg-white/90 border-r border-b border-gray-200 transform rotate-45"></div>
    </div>
);


interface ChatMessageProps {
    message: Message;
    onSaveToNote?: (message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSaveToNote }) => {
    const isUser = message.sender === 'user';
    const [popoverState, setPopoverState] = useState<{ source: Source; chunkContent: string; style: React.CSSProperties } | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<number | null>(null);
    
    const handleCopy = () => {
        if (isCopied) return;
        navigator.clipboard.writeText(message.text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const processedText = useMemo(() => {
        if (isUser || !message.text) return message.text;
        
        return message.text.replace(/\[source:(\d+)\]/g, (match, p1) => {
            const chunkIndex = parseInt(p1, 10) - 1;
            if (message.chunks && message.chunks[chunkIndex]) {
                return `<button class="citation-button" data-chunk-index="${chunkIndex}" aria-label="Source chunk ${p1}">${p1}</button>`;
            }
            return ''; // Remove marker if chunk not found
        });
    }, [message.text, message.chunks, isUser]);

    const rawMarkup = useMemo(() => {
        if (isUser) return '';
        return marked.parse(processedText);
    }, [processedText, isUser]);

    const cancelHidePopover = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const hidePopover = useCallback(() => {
        cancelHidePopover(); // Prevent multiple timers from running
        hideTimerRef.current = window.setTimeout(() => {
            setPopoverState(null);
        }, 200);
    }, [cancelHidePopover]);

    useEffect(() => {
        const contentEl = contentRef.current;
        if (!contentEl || isUser) return;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('citation-button')) {
                cancelHidePopover();
                const chunkIndex = parseInt(target.dataset.chunkIndex || '', 10);
                if (message.chunks && !isNaN(chunkIndex) && message.chunks[chunkIndex]) {
                    const chunk = message.chunks[chunkIndex];
                    const source = message.sources?.[chunk.sourceIndex];
                    
                    if (source) {
                        const rect = target.getBoundingClientRect();
                        const containerRect = contentEl.getBoundingClientRect();

                        setPopoverState({
                            source,
                            chunkContent: chunk.content,
                            style: {
                                top: rect.top - containerRect.top,
                                left: rect.left - containerRect.left + rect.width / 2,
                                position: 'absolute'
                            },
                        });
                    }
                }
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
             const target = e.target as HTMLElement;
            if (target.classList.contains('citation-button')) {
                hidePopover();
            }
        };

        contentEl.addEventListener('mouseover', handleMouseOver);
        contentEl.addEventListener('mouseout', handleMouseOut);

        return () => {
            contentEl.removeEventListener('mouseover', handleMouseOver);
            contentEl.removeEventListener('mouseout', handleMouseOut);
            cancelHidePopover();
        };
    }, [rawMarkup, message.chunks, message.sources, isUser, cancelHidePopover, hidePopover]);

    if (isUser) {
         return (
            <div className="flex justify-end">
                <div className="max-w-[80%]">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-tr-none">
                        <p>{message.text}</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex justify-start">
            <div className="w-full">
                <div className="relative">
                    <div ref={contentRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: rawMarkup }} />
                    {popoverState && <CitationPopover 
                        source={popoverState.source} 
                        chunkContent={popoverState.chunkContent} 
                        style={popoverState.style}
                        onMouseEnter={cancelHidePopover}
                        onMouseLeave={hidePopover}
                    />}
                </div>

                {message.text && (
                    <div className="mt-4 flex items-center gap-2">
                        <button
                            onClick={() => onSaveToNote?.(message)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-transparent border border-gray-300 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Bookmark className="w-4 h-4" />
                            Save to note
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                            title={isCopied ? "Copied!" : "Copy"}
                        >
                            {isCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
