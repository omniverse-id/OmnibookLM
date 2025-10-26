import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Artifact, Source } from '../types';
import { SourceIcon } from './SourceIcon';

declare const marked: {
    parse(markdownString: string): string;
};

interface CitationPopoverProps {
    source: Source;
    chunkContent: string;
    style: React.CSSProperties;
}

const CitationPopover: React.FC<CitationPopoverProps> = ({ source, chunkContent, style }) => (
    <div 
        style={style} 
        className="absolute z-20 w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200 transform -translate-x-1/2 -translate-y-full -mt-2"
        role="tooltip"
    >
        <div className="flex items-center gap-2 mb-2">
            <SourceIcon type={source.type} status={source.status} sizeClass="h-4 w-4 flex-shrink-0" />
            <p className="text-sm font-medium text-gray-800 truncate" title={source.name}>{source.name}</p>
        </div>
        <p className="text-sm text-gray-600 line-clamp-4" title={chunkContent}>{chunkContent}</p>
    </div>
);

interface NoteContentViewProps {
    artifact: Artifact;
}

const NoteContentView: React.FC<NoteContentViewProps> = ({ artifact }) => {
    const [popoverState, setPopoverState] = useState<{ source: Source; chunkContent: string; style: React.CSSProperties } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const processedText = useMemo(() => {
        if (!artifact.content) return '';
        
        return artifact.content.replace(/\[source:(\d+)\]/g, (match, p1) => {
            const chunkIndex = parseInt(p1, 10) - 1;
            if (artifact.chunks && artifact.chunks[chunkIndex]) {
                return `<button class="citation-button" data-chunk-index="${chunkIndex}" aria-label="Source chunk ${p1}">${p1}</button>`;
            }
            return '';
        });
    }, [artifact.content, artifact.chunks]);

    const rawMarkup = useMemo(() => {
        return marked.parse(processedText);
    }, [processedText]);

    useEffect(() => {
        const contentEl = contentRef.current;
        if (!contentEl) return;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('citation-button')) {
                const chunkIndex = parseInt(target.dataset.chunkIndex || '', 10);
                if (artifact.chunks && !isNaN(chunkIndex) && artifact.chunks[chunkIndex]) {
                    const chunk = artifact.chunks[chunkIndex];
                    const source = artifact.sources?.[chunk.sourceIndex];
                    
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
                setPopoverState(null);
            }
        };

        contentEl.addEventListener('mouseover', handleMouseOver);
        contentEl.addEventListener('mouseout', handleMouseOut);

        return () => {
            contentEl.removeEventListener('mouseover', handleMouseOver);
            contentEl.removeEventListener('mouseout', handleMouseOut);
        };
    }, [rawMarkup, artifact.chunks, artifact.sources]);

    return (
        <div className="relative">
            <div ref={contentRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: rawMarkup }} />
            {popoverState && <CitationPopover source={popoverState.source} chunkContent={popoverState.chunkContent} style={popoverState.style} />}
        </div>
    );
};

export default NoteContentView;