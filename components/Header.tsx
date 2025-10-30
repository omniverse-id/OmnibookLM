import React, { useState, useEffect, useRef } from 'react';
import { Settings, Ratio, Settings2, UserCircle, Globe, Sun, Moon, MonitorSmartphone, ChevronRight } from 'lucide-react';

interface HeaderProps {
    activeTab: 'sources' | 'chat' | 'studio';
    onNavigateHome?: () => void;
    notebookTitle?: string;
    onUpdateTitle?: (newTitle: string) => void;
    onOpenLanguageModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onNavigateHome, notebookTitle, onUpdateTitle, onOpenLanguageModal }) => {
    const [title, setTitle] = useState(notebookTitle || 'Untitled Notebook');
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isThemeSubMenuOpen, setIsThemeSubMenuOpen] = useState(false);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(notebookTitle || 'Untitled Notebook');
    }, [notebookTitle]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setIsSettingsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const saveTitle = () => {
        const trimmedTitle = title.trim();
        if (trimmedTitle && trimmedTitle !== notebookTitle) {
            onUpdateTitle?.(trimmedTitle);
        } else {
            // Revert if empty or unchanged
            setTitle(notebookTitle || 'Untitled Notebook');
        }
        inputRef.current?.blur(); // remove focus
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            saveTitle();
        }
        if (e.key === 'Escape') {
            setTitle(notebookTitle || 'Untitled Notebook');
            inputRef.current?.blur();
        }
    };

    return (
        <header className="flex items-center h-16 px-4 md:px-9 bg-white z-10 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button 
                    onClick={onNavigateHome}
                    disabled={!onNavigateHome}
                    aria-label="OmnibookLM Homepage" 
                    className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors disabled:cursor-default disabled:hover:bg-gray-900"
                >
                    <Ratio className="h-6 w-6 text-white" />
                </button>
                {onNavigateHome ? (
                    <div className="relative min-w-[15ch]">
                        {/* This invisible div acts as a sizer for the input field */}
                        <div className="invisible whitespace-pre text-[22px] font-normal py-1 pl-1 pr-4" aria-hidden="true">
                            {title || ' '}
                        </div>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={title}
                            onChange={handleTitleChange}
                            onBlur={saveTitle}
                            onKeyDown={handleKeyDown}
                            disabled={!onUpdateTitle}
                            className="absolute inset-0 text-[22px] font-normal text-gray-800 bg-transparent w-full p-1 rounded-lg outline-none ring-1 ring-transparent focus:ring-gray-400 focus:bg-white disabled:bg-transparent disabled:ring-transparent disabled:cursor-default" 
                        />
                    </div>
                ) : (
                    <span className="text-2xl font-medium text-gray-800">OmnibookLM</span>
                )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
                {activeTab === 'chat' && (
                    <button title="Configure notebook" className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:bg-[#f8f8f7] transition-colors border border-gray-300">
                        <Settings2 className="h-5 w-5" />
                    </button>
                )}
                <div className="relative" ref={settingsMenuRef}>
                    <button 
                        onClick={() => setIsSettingsMenuOpen(prev => !prev)}
                        className="flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-[#f8f8f7] w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-lg transition-colors border border-gray-300"
                    >
                        <Settings className="h-5 w-5" />
                        <span className="hidden md:inline font-medium">Settings</span>
                    </button>
                     {isSettingsMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-[175px] bg-white shadow-lg rounded-lg border border-gray-200 py-2 z-50">
                            <button onClick={() => { onOpenLanguageModal(); setIsSettingsMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                                <Globe className="w-5 h-5 text-gray-500" />
                                <span>Output Language</span>
                            </button>
                            <div
                                className="relative"
                                onMouseEnter={() => setIsThemeSubMenuOpen(true)}
                                onMouseLeave={() => setIsThemeSubMenuOpen(false)}
                            >
                                <button className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 ${isThemeSubMenuOpen ? 'bg-gray-100' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <Sun className="w-5 h-5 text-gray-500" />
                                        <span>Light mode</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                </button>
                                {isThemeSubMenuOpen && (
                                    <div className="absolute top-0 right-full mr-1 w-[175px] bg-white shadow-lg rounded-lg border border-gray-200 py-2">
                                        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                                            <Sun className="w-5 h-5 text-gray-500" />
                                            <span>Light mode</span>
                                        </button>
                                        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                                            <Moon className="w-5 h-5 text-gray-500" />
                                            <span>Dark mode</span>
                                        </button>
                                        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                                            <MonitorSmartphone className="w-5 h-5 text-gray-500" />
                                            <span>Device</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <button className="flex items-center justify-center text-gray-700 hover:bg-[#f8f8f7] w-10 h-10 rounded-full transition-colors" title="User account">
                    <UserCircle className="w-8 h-8" />
                </button>
            </div>
        </header>
    );
};

export default Header;
