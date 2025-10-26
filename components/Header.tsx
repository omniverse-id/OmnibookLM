
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Ratio, Settings2, UserCircle } from 'lucide-react';

interface HeaderProps {
    activeTab: 'sources' | 'chat' | 'studio';
    onNavigateHome?: () => void;
    notebookTitle?: string;
    onUpdateTitle?: (newTitle: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onNavigateHome, notebookTitle, onUpdateTitle }) => {
    const [title, setTitle] = useState(notebookTitle || 'Untitled Notebook');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(notebookTitle || 'Untitled Notebook');
    }, [notebookTitle]);

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
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button 
                    onClick={onNavigateHome}
                    disabled={!onNavigateHome}
                    aria-label="OmnibookLM Homepage" 
                    className="flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors disabled:cursor-default disabled:hover:bg-gray-900"
                >
                    <Ratio className="h-6 w-6 text-white" />
                </button>
                {onNavigateHome ? (
                    <div className="flex-1 min-w-0">
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={title}
                            onChange={handleTitleChange}
                            onBlur={saveTitle}
                            onKeyDown={handleKeyDown}
                            disabled={!onUpdateTitle}
                            className="text-[22px] font-normal text-gray-800 bg-transparent w-full max-w-full p-1 rounded-lg outline-none ring-1 ring-transparent focus:ring-gray-400 focus:bg-white disabled:bg-transparent disabled:ring-transparent disabled:cursor-default" 
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
                <button className="flex items-center justify-center gap-2 text-sm text-gray-700 hover:bg-[#f8f8f7] w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-lg transition-colors border border-gray-300">
                    <Settings className="h-5 w-5" />
                    <span className="hidden md:inline font-medium">Settings</span>
                </button>
                <button className="flex items-center justify-center text-gray-700 hover:bg-[#f8f8f7] w-10 h-10 rounded-full transition-colors" title="User account">
                    <UserCircle className="w-8 h-8" />
                </button>
            </div>
        </header>
    );
};

export default Header;
