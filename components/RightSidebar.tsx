import React, { useState, useRef, useEffect } from 'react';
import { studioTools } from '../constants';
import { StudioTool, Artifact } from '../types';
import { PanelRight, MoreVertical, StickyNote, Pencil, Trash2, FileUp, Files } from 'lucide-react';
import AudioOverviewModal from './AudioOverviewModal';
import QuizModal from './QuizModal';
import FlashcardsModal from './FlashcardsModal';
import CreateReportModal from './CreateReportModal';
import NoteDetailView from './NoteDetailView';


interface ToolItemProps {
    tool: StudioTool;
    isCollapsed: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onEditClick?: (e: React.MouseEvent) => void;
    disabled: boolean;
}

const ToolItem: React.FC<ToolItemProps> = ({ tool, isCollapsed, onClick, onEditClick, disabled }) => {
    const Icon = tool.icon;
    const hasEditIcon = ['Audio Overview', 'Video Overview', 'Flashcards', 'Quiz'].includes(tool.name);
    
    const commonClasses = `group rounded-lg transition-colors ${
        disabled 
        ? 'bg-gray-100 cursor-not-allowed'
        : 'bg-white hover:bg-[#f8f8f7] cursor-pointer'
    }`;

    const iconClasses = `w-6 h-6 ${disabled ? 'text-gray-400' : 'text-gray-800'}`;
    const textClasses = `text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-800'}`;

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled && onEditClick) {
            onEditClick(e);
        }
    };
    
    if (isCollapsed) {
        return (
            <button onClick={onClick} title={tool.name} disabled={disabled} className={`${commonClasses} w-12 h-12 flex items-center justify-center`}>
                <Icon className={iconClasses} />
            </button>
        );
    }

    return (
        <button onClick={onClick} title={tool.name} disabled={disabled} className={`${commonClasses} p-3 flex flex-col justify-between h-[100px] border border-gray-200 relative text-left`}>
             {hasEditIcon && (
                 <div 
                    onClick={handleEditClick}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleEditClick(e as any); }}
                    aria-label={`Customize ${tool.name}`}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg text-gray-500 transition-all duration-200 ${disabled ? 'cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'}`}
                >
                    <Pencil className="w-5 h-5" />
                </div>
            )}
            <Icon className={iconClasses} />
            <span className={textClasses}>{tool.name}</span>
        </button>
    );
};

interface StudioHomeViewProps {
    onToggle: () => void;
    artifacts: Artifact[];
    onAddNote: () => void;
    onArtifactSelect: (artifact: Artifact) => void;
    onDelete: (artifact: Artifact) => void;
    setAudioModalOpen: (isOpen: boolean) => void;
    setQuizModalOpen: (isOpen: boolean) => void;
    setFlashcardsModalOpen: (isOpen: boolean) => void;
    setReportModalOpen: (isOpen: boolean) => void;
    disabled: boolean;
}

const StudioHomeView: React.FC<StudioHomeViewProps> = ({ onToggle, artifacts, onAddNote, onArtifactSelect, onDelete, setAudioModalOpen, setQuizModalOpen, setFlashcardsModalOpen, setReportModalOpen, disabled }) => {
    const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('[aria-haspopup="true"]')) {
                    setMenuOpenFor(null);
                }
            }
        };

        if (menuOpenFor !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpenFor]);

    return (
        <div className="flex flex-col h-full relative">
            <div className="hidden md:flex items-center justify-between px-4 h-[48px] border-b border-gray-200 flex-shrink-0">
                <h2 className="text-base font-medium text-gray-800">Studio</h2>
                <button onClick={onToggle} title="Close Studio Panel" className="w-9 h-9 hidden md:flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#f8f8f7] transition-colors">
                    <PanelRight className="h-5 w-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto sidebar-scroll pb-20">
                <div className="p-4 grid grid-cols-2 gap-2">
                    {studioTools.map(tool => {
                        let clickHandler;
                        let editHandler;
                        if (tool.name === 'Audio Overview') {
                            editHandler = () => setAudioModalOpen(true);
                        } else if (tool.name === 'Quiz') {
                            editHandler = () => setQuizModalOpen(true);
                        } else if (tool.name === 'Flashcards') {
                            editHandler = () => setFlashcardsModalOpen(true);
                        } else if (tool.name === 'Reports') {
                            clickHandler = () => setReportModalOpen(true);
                        }


                        return (
                            <ToolItem 
                                key={tool.id} 
                                tool={tool} 
                                isCollapsed={false}
                                onClick={clickHandler} 
                                onEditClick={editHandler}
                                disabled={disabled}
                            />
                        )
                    })}
                </div>

                {artifacts.length > 0 ? (
                    <>
                        <div className="px-4 pt-4"><div className="border-t border-gray-200"></div></div>
                        <div className="px-4 py-4 space-y-2">
                            {artifacts.map(artifact => {
                                const Icon = artifact.icon;
                                return (
                                    <div key={artifact.id} className="group flex items-center rounded-lg hover:bg-[#f8f8f7] transition-colors">
                                        <button onClick={() => onArtifactSelect(artifact)} className="flex-1 flex items-center p-2 text-left min-w-0">
                                            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-gray-800" />
                                            </div>
                                            <div className="flex-1 min-w-0 mx-2">
                                                <p className="text-sm font-medium text-gray-800 truncate">{artifact.title}</p>
                                                <p className="text-xs text-gray-500 truncate">{artifact.details}</p>
                                            </div>
                                        </button>
                                        <div className="relative flex-shrink-0 pr-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpenFor(prev => prev === artifact.id ? null : artifact.id);
                                                }}
                                                aria-haspopup="true"
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical className="h-5 h-5" />
                                            </button>
                                            {menuOpenFor === artifact.id && (
                                                <div ref={menuRef} className="absolute z-10 top-full right-0 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 w-56 py-1">
                                                    <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50" disabled>
                                                        <FileUp className="w-4 h-4 text-gray-500"/> Convert to source
                                                    </button>
                                                    <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 disabled:opacity-50" disabled>
                                                        <Files className="w-4 h-4 text-gray-500"/> Convert all notes to source
                                                    </button>
                                                    <div className="my-1 h-px bg-gray-100"></div>
                                                    <button 
                                                        onClick={() => {
                                                            onDelete(artifact);
                                                            setMenuOpenFor(null);
                                                        }} 
                                                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                                    >
                                                        <Trash2 className="w-4 h-4"/> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                     <>
                        <div className="px-4 pt-4"><div className="border-t border-gray-200"></div></div>
                        <div className="flex flex-col items-center text-center p-6 py-7">
                            <Pencil className="w-8 h-8 text-gray-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-800">Studio output will be saved here.</h3>
                            <p className="text-sm text-gray-500 mt-2 max-w-xs">
                                After adding sources, click to add Audio Overview, Study Guide, Mind Map, and more!
                            </p>
                        </div>
                     </>
                )}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                <button
                    onClick={onAddNote}
                    disabled={disabled}
                    className="h-10 px-5 inline-flex items-center gap-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-md hover:bg-gray-800 transition-colors pointer-events-auto disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <StickyNote className="h-5 w-5" />
                    <span>Add note</span>
                </button>
            </div>
        </div>
    );
};

interface RightSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    artifacts: Artifact[];
    onAddNote: () => void;
    selectedArtifact: Artifact | null;
    onArtifactSelect: (artifact: Artifact) => void;
    onBack: () => void;
    onDelete: (artifact: Artifact) => void;
    disabled: boolean;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, onToggle, artifacts, onAddNote, selectedArtifact, onArtifactSelect, onBack, onDelete, disabled }) => {
    const [isAudioModalOpen, setAudioModalOpen] = useState(false);
    const [isQuizModalOpen, setQuizModalOpen] = useState(false);
    const [isFlashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);

    return (
        <>
            <aside className={`h-full bg-white flex flex-col md:rounded-lg transition-all duration-300 ease-in-out md:border md:border-gray-200 overflow-hidden ${isOpen ? 'w-full md:w-[350px]' : 'w-full md:w-20'}`}>
                {isOpen ? (
                    selectedArtifact ? (
                        <NoteDetailView 
                            artifact={selectedArtifact}
                            onBack={onBack}
                            onDelete={onDelete}
                        />
                    ) : (
                        <StudioHomeView
                             onToggle={onToggle}
                             artifacts={artifacts}
                             onAddNote={onAddNote}
                             onArtifactSelect={onArtifactSelect}
                             onDelete={onDelete}
                             setAudioModalOpen={setAudioModalOpen}
                             setQuizModalOpen={setQuizModalOpen}
                             setFlashcardsModalOpen={setFlashcardsModalOpen}
                             setReportModalOpen={setReportModalOpen}
                             disabled={disabled}
                        />
                    )
                ) : (
                    <div className="hidden md:flex flex-col items-center h-full py-3">
                        <div className="flex-shrink-0">
                            <button onClick={onToggle} title="Open Studio Panel" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-[#f8f8f7] transition-colors">
                                <PanelRight className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col items-center space-y-2 pt-6">
                            {studioTools.map(tool => {
                                let clickHandler;
                                if (tool.name === 'Reports') {
                                    clickHandler = () => setReportModalOpen(true);
                                }
                                return <ToolItem key={tool.id} tool={tool} onClick={clickHandler} isCollapsed={true} disabled={disabled} />
                            })}
                        </div>
                        <div className="flex-shrink-0">
                            <button title="Add note" onClick={onAddNote} disabled={disabled} className="w-12 h-12 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                <StickyNote className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                )}
            </aside>
            <AudioOverviewModal isOpen={isAudioModalOpen} onClose={() => setAudioModalOpen(false)} />
            <QuizModal isOpen={isQuizModalOpen} onClose={() => setQuizModalOpen(false)} />
            <FlashcardsModal isOpen={isFlashcardsModalOpen} onClose={() => setFlashcardsModalOpen(false)} />
            <CreateReportModal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} />
        </>
    );
};

export default RightSidebar;
