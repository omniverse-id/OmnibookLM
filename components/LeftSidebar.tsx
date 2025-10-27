
import React, { useState, useRef, useEffect } from 'react';
import { Source, SourceStatus, SourceType } from '../types';
import { Loader2, AlertCircle, Plus, Search, MoreVertical, Trash2, Pencil, PanelLeft, BookText } from 'lucide-react';
import { SourceIcon } from './SourceIcon';


interface LeftSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    sources: Source[];
    onAddSource: () => void;
    onDiscoverSource: () => void;
    onToggleSource: (id: string) => void;
    onToggleAllSources: (checked: boolean) => void;
    isAllSelected: boolean;
    onOpenDeleteConfirmation: (source: Source) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isOpen, onToggle, sources, onAddSource, onDiscoverSource, onToggleSource, onToggleAllSources, isAllSelected, onOpenDeleteConfirmation }) => {
    const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                // Check if the click was on another menu button
                const target = event.target as HTMLElement;
                if (!target.closest('[aria-haspopup="true"]')) {
                    setMenuOpenFor(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    return (
        <aside className={`h-full bg-white flex flex-col md:rounded-lg transition-all duration-300 ease-in-out md:border md:border-gray-200 overflow-hidden ${isOpen ? 'w-full md:w-[350px]' : 'w-full md:w-20'}`}>
            {/* On mobile, isOpen is effectively always true because the collapsed view is hidden */}
            {isOpen ? (
                <div className="flex flex-col h-full">
                    <div className="hidden md:flex items-center justify-between px-4 h-[48px] border-b border-gray-200 flex-shrink-0">
                        <h2 className="text-base font-medium text-gray-800 whitespace-nowrap">Sources</h2>
                        <button onClick={onToggle} title="Close Sources Panel" className="w-9 h-9 hidden md:flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#f8f8f7] transition-colors">
                            <PanelLeft className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="p-4 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <button onClick={onAddSource} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 h-10 text-sm font-medium text-gray-700 hover:bg-[#f8f8f7] transition-colors whitespace-nowrap">
                                <Plus className="h-4 w-4" />
                                <span>Add</span>
                            </button>
                            <button onClick={onDiscoverSource} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 h-10 text-sm font-medium text-gray-700 hover:bg-[#f8f8f7] transition-colors whitespace-nowrap">
                                <Search className="h-4 w-4" />
                                <span>Discover</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto sidebar-scroll">
                        {sources.length > 0 ? (
                            <div className="p-4">
                                <div className="px-0 py-2">
                                    <label className="flex items-center p-2 rounded-lg hover:bg-[#f8f8f7] cursor-pointer">
                                        <div className="flex-1 min-w-0 mx-2">
                                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Select all sources</span>
                                        </div>
                                        <input type="checkbox" className="h-4 w-4 rounded-lg border-gray-400 text-gray-800 focus:ring-gray-400 accent-gray-800 flex-shrink-0" checked={isAllSelected} onChange={(e) => onToggleAllSources(e.target.checked)} />
                                    </label>
                                </div>
                                <ul className="space-y-1">
                                    {sources.map(source => (
                                        <li key={source.id} className="relative flex items-center p-2 rounded-lg hover:bg-[#f8f8f7] group">
                                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-600 relative">
                                                <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-150">
                                                    <SourceIcon type={source.type} status={source.status} />
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setMenuOpenFor(menuOpenFor === source.id ? null : source.id); }} 
                                                        className="w-full h-full flex items-center justify-center rounded-lg hover:bg-gray-200"
                                                        aria-haspopup="true"
                                                        aria-expanded={menuOpenFor === source.id}
                                                        title="More options"
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {menuOpenFor === source.id && (
                                                <div ref={menuRef} className="absolute z-10 top-full left-8 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 w-48 py-1">
                                                    <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50" disabled>
                                                        <Pencil className="w-4 h-4 text-gray-500"/> Rename source
                                                    </button>
                                                    <button 
                                                        onClick={() => { onOpenDeleteConfirmation(source); setMenuOpenFor(null); }} 
                                                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4"/> Remove source
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 mx-2">
                                                <p className={`text-sm truncate ${
                                                    source.status === SourceStatus.INDEXING ? 'text-gray-500 italic' 
                                                    : source.status === SourceStatus.FAILED ? 'text-red-500' 
                                                    : 'text-gray-800'}`} 
                                                    title={source.status === SourceStatus.FAILED ? source.textContent : source.name}
                                                >
                                                    {source.status === SourceStatus.INDEXING ? `Indexing ${source.name}...` 
                                                    : source.status === SourceStatus.FAILED ? `Failed: ${source.name}` 
                                                    : source.name}
                                                </p>
                                            </div>
                                            {source.status === SourceStatus.INDEXED && (
                                                <input type="checkbox" className="h-4 w-4 rounded-lg border-gray-400 text-gray-800 focus:ring-gray-400 accent-gray-800 flex-shrink-0" checked={source.checked} onChange={() => onToggleSource(source.id)}/>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 py-7">
                                <BookText className="w-8 h-8 mb-4 text-gray-500" />
                                <h3 className="text-lg font-medium text-gray-800">Saved sources will appear here</h3>
                                <p className="text-sm text-gray-500 mt-2 max-w-xs">
                                    Click Add source above to add PDFs, websites, text, videos, or audio files. Or import a file directly from Google Drive.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-col items-center h-full py-3">
                    <div className="flex-shrink-0 flex flex-col items-center space-y-6">
                        <button onClick={onToggle} title="Open Sources Panel" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-[#f8f8f7] transition-colors">
                            <PanelLeft className="h-6 w-6" />
                        </button>
                        <button onClick={onAddSource} title="Add Source" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                            <Plus className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col items-center space-y-2 pt-4">
                        {sources.map(source => (
                            <button key={source.id} title={source.name} className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-[#f8f8f7] transition-colors flex-shrink-0">
                                <SourceIcon type={source.type} status={source.status} sizeClass="h-6 w-6" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
};

export default LeftSidebar;
