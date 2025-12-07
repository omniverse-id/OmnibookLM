import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import ChatView from './components/ChatView';
import Footer from './components/Footer';
import ConfirmationModal from './components/ConfirmationModal';
import AddSourceModal from './components/AddSourceModal';
import DiscoverSourcesModal from './components/DiscoverSourcesModal';
import ConfigureChatModal from './components/ConfigureChatModal';
import LanguageModal from './components/LanguageModal';
import { Source, Message, SourceStatus, Notebook, SourceType, Chunk, Artifact, DiscoveredSource, ChatConfig } from './types';
import { generateChatResponse, generateSuggestions } from './services/openRouterService';
import { processDocumentToChunks } from './services/embeddingService';
import { vectorStore } from './services/vectorStore';
import TabPanel from './components/TabPanel';
import { iconMap, artifacts as initialArtifacts } from './constants';
import { Plus, LayoutGrid, List, ChevronDown, MoreVertical, Pencil, Trash2, StickyNote } from 'lucide-react';
import { db, getAllNotebooks, addNotebook, deleteNotebook, getSourcesByNotebookId, addSource, updateSourceStatus, deleteSource, updateNotebookTitle } from './services/db';
import { FileText } from 'lucide-react';

// Make pdf.js globally available from the script tag in index.html
declare const pdfjsLib: any;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to read file as Base64 string.'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Dynamically load pdf.js from CDN if it's not already present on the page.
const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const existing = (window as any).pdfjsLib || (globalThis as any).pdfjsLib;
        if (existing) return resolve(existing);

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.js';
        script.async = true;
        script.onload = () => {
            const lib = (window as any).pdfjsLib || (globalThis as any).pdfjsLib;
            if (lib) resolve(lib);
            else reject(new Error('pdf.js loaded but global pdfjsLib is not available'));
        };
        script.onerror = async () => {
            // CDN failed; try to load local package (pdfjs-dist) as a fallback.
            try {
                // dynamic import from node_modules (works in dev with Vite)
                const mod = await import('pdfjs-dist');
                // Some builds export a default or named exports; normalize
                const lib = (mod && (mod as any).default) ? (mod as any).default : mod;
                if (lib) return resolve(lib);
                // Try legacy subpath as last resort
                const legacy = await import('pdfjs-dist/legacy/build/pdf');
                const legacyLib = (legacy && (legacy as any).default) ? (legacy as any).default : legacy;
                if (legacyLib) return resolve(legacyLib);
                reject(new Error('Failed to import pdfjs-dist after CDN failure'));
            } catch (e) {
                reject(new Error('Failed to load pdf.js from CDN and failed to import pdfjs-dist: ' + (e instanceof Error ? e.message : String(e))));
            }
        };
        document.head.appendChild(script);
    });
};

// --- Sub-components for HomePage ---

interface NotebookTitleInputProps {
    initialTitle: string;
    onSave: (newTitle: string) => void;
    onCancel: () => void;
    className?: string;
}

const NotebookTitleInput: React.FC<NotebookTitleInputProps> = ({ initialTitle, onSave, onCancel, className }) => {
    const [title, setTitle] = useState(initialTitle);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const handleSave = () => {
        if (title.trim()) {
            onSave(title);
        } else {
            onCancel();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
                e.preventDefault(); // Prevent card click through
                e.stopPropagation();
            }}
            className={className}
        />
    );
};


interface NotebookCardProps {
    notebook: Notebook;
    onClick: () => void;
    isMenuOpen: boolean;
    onToggleMenu: (event: React.MouseEvent) => void;
    onDelete: (event: React.MouseEvent) => void;
    isEditing: boolean;
    onStartEdit: () => void;
    onSaveEdit: (newTitle: string) => void;
    onCancelEdit: () => void;
}

const NotebookCard: React.FC<NotebookCardProps> = ({ notebook, onClick, isMenuOpen, onToggleMenu, onDelete, isEditing, onStartEdit, onSaveEdit, onCancelEdit }) => {
    const Icon = iconMap[notebook.icon];
    return (
        <div className="relative group">
             {/* Main clickable card content */}
            <button
                onClick={onClick}
                className="w-full text-left p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors duration-200 flex flex-col justify-between h-48"
            >
                <div>
                    <Icon className="w-8 h-8 text-gray-800" />
                </div>
                <div>
                     {isEditing ? (
                        <NotebookTitleInput
                            initialTitle={notebook.title}
                            onSave={onSaveEdit}
                            onCancel={onCancelEdit}
                            className="font-medium text-gray-800 w-full bg-gray-50 border border-gray-300 rounded p-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                    ) : (
                        <h3 className="font-medium text-gray-800 truncate" title={notebook.title}>{notebook.title}</h3>
                    )}
                    <p className="text-sm text-gray-500 mt-1">{notebook.sources} source{notebook.sources !== 1 ? 's' : ''}</p>
                </div>
            </button>
            {/* Menu button and dropdown */}
            <div className="absolute top-2 right-2 z-10">
                <button onClick={onToggleMenu} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" aria-haspopup="true">
                    <MoreVertical className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 w-48 py-1"
                    >
                        <button 
                            onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Pencil className="w-4 h-4 text-gray-500"/> Edit title
                        </button>
                        <button 
                            onClick={onDelete} 
                            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4"/> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CreateNewCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        onClick={onClick}
        className="text-left p-4 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 flex flex-col items-center justify-center h-48"
    >
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-gray-700" />
        </div>
        <p className="font-medium text-gray-800">Create new notebook</p>
    </button>
);

// List View Components
interface NotebookRowProps {
    notebook: Notebook;
    onClick: () => void;
    isMenuOpen: boolean;
    onToggleMenu: (event: React.MouseEvent) => void;
    onDelete: (event: React.MouseEvent) => void;
    isEditing: boolean;
    onStartEdit: () => void;
    onSaveEdit: (newTitle: string) => void;
    onCancelEdit: () => void;
}

const NotebookRow: React.FC<NotebookRowProps> = ({ notebook, onClick, isMenuOpen, onToggleMenu, onDelete, isEditing, onStartEdit, onSaveEdit, onCancelEdit }) => {
    const Icon = iconMap[notebook.icon];
    return (
        <div className="relative group flex items-center w-full hover:bg-gray-50 rounded-lg transition-colors">
            <button onClick={onClick} className="flex-1 flex items-center p-3 text-left min-w-0">
                <Icon className="w-6 h-6 text-gray-800 mr-4 flex-shrink-0" />
                 {isEditing ? (
                    <NotebookTitleInput
                        initialTitle={notebook.title}
                        onSave={onSaveEdit}
                        onCancel={onCancelEdit}
                        className="flex-1 font-medium text-gray-800 truncate pr-4 bg-gray-50 border border-gray-300 rounded p-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                ) : (
                    <span className="flex-1 font-medium text-gray-800 truncate pr-4" title={notebook.title}>{notebook.title}</span>
                )}
                <span className="text-sm text-gray-500 w-32 text-right flex-shrink-0 hidden sm:block">{notebook.sources} source{notebook.sources !== 1 ? 's' : ''}</span>
                <span className="text-sm text-gray-500 w-32 text-right flex-shrink-0 hidden md:block">{notebook.date}</span>
            </button>
            <div className="px-2 z-10 flex-shrink-0">
                <button onClick={onToggleMenu} className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" aria-haspopup="true">
                    <MoreVertical className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute top-full right-4 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 w-48 py-1"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Pencil className="w-4 h-4 text-gray-500"/> Edit title
                        </button>
                        <button onClick={onDelete} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 className="w-4 h-4"/> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


interface HomePageProps {
    onNotebookSelect: (notebook?: Notebook) => void;
    notebooks: Notebook[];
    onOpenDeleteConfirmation: (notebook: Notebook) => void;
    onUpdateNotebookTitle: (id: number, newTitle: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNotebookSelect, notebooks, onOpenDeleteConfirmation, onUpdateNotebookTitle }) => {
    const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
    const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
    const [editingNotebookId, setEditingNotebookId] = useState<number | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
             if (!(e.target as HTMLElement).closest('[aria-haspopup="true"]') && !(e.target as HTMLElement).closest('input')) {
                setMenuOpenFor(null);
                setEditingNotebookId(null);
            }
        };
        if (menuOpenFor !== null || editingNotebookId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpenFor, editingNotebookId]);

    return (
        <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Sub-header Controls */}
            <div className="px-4 md:px-9 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">All</button>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg">My notebooks</button>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Featured notebooks</button>
                </div>
                <div className="flex items-center gap-2">
                     <div className="flex items-center border border-gray-300 rounded-lg">
                        <button onClick={() => setViewType('grid')} title="Grid view" className={`p-2 rounded-l-md transition-colors ${viewType === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <div className="h-full w-px bg-gray-300"></div>
                        <button onClick={() => setViewType('list')} title="List view" className={`p-2 rounded-r-md transition-colors ${viewType === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                    <button className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300">
                        Most recent
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onNotebookSelect()}
                        className="flex items-center gap-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Create new
                    </button>
                </div>
            </div>

            {/* Notebook Grid / List */}
            <main className="flex-1 p-4 md:p-9">
                <h2 className="text-2xl font-normal text-gray-800 mb-6">My notebooks</h2>
                {viewType === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        <CreateNewCard onClick={() => onNotebookSelect()} />
                        {notebooks.map((notebook: Notebook) => (
                            <NotebookCard 
                                key={notebook.id} 
                                notebook={notebook} 
                                onClick={() => editingNotebookId !== notebook.id && onNotebookSelect(notebook)}
                                isMenuOpen={menuOpenFor === notebook.id}
                                onToggleMenu={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenFor(prev => (prev === notebook.id ? null : notebook.id));
                                }}
                                onDelete={(e) => {
                                    e.stopPropagation();
                                    onOpenDeleteConfirmation(notebook);
                                    setMenuOpenFor(null);
                                }}
                                isEditing={editingNotebookId === notebook.id}
                                onStartEdit={() => {
                                    setEditingNotebookId(notebook.id);
                                    setMenuOpenFor(null);
                                }}
                                onSaveEdit={(newTitle) => {
                                    onUpdateNotebookTitle(notebook.id, newTitle);
                                    setEditingNotebookId(null);
                                }}
                                onCancelEdit={() => setEditingNotebookId(null)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 border-b border-gray-200">
                            <span className="flex-1 pl-10">Title</span>
                            <span className="w-32 text-right hidden sm:block">Sources</span>
                            <span className="w-32 text-right hidden md:block">Date</span>
                            <span className="w-14 text-right"></span> {/* Spacer for menu button */}
                        </div>
                        {notebooks.map((notebook: Notebook) => (
                            <NotebookRow
                                key={notebook.id}
                                notebook={notebook}
                                onClick={() => editingNotebookId !== notebook.id && onNotebookSelect(notebook)}
                                isMenuOpen={menuOpenFor === notebook.id}
                                onToggleMenu={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenFor(prev => (prev === notebook.id ? null : notebook.id));
                                }}
                                onDelete={(e) => {
                                    e.stopPropagation();
                                    onOpenDeleteConfirmation(notebook);
                                    setMenuOpenFor(null);
                                }}
                                isEditing={editingNotebookId === notebook.id}
                                onStartEdit={() => {
                                    setEditingNotebookId(notebook.id);
                                    setMenuOpenFor(null);
                                }}
                                onSaveEdit={(newTitle) => {
                                    onUpdateNotebookTitle(notebook.id, newTitle);
                                    setEditingNotebookId(null);
                                }}
                                onCancelEdit={() => setEditingNotebookId(null)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};


// --- Main App Component ---

const initialSuggestions = [
    "Apakah strategi scalping order flow mampu memberikan keunggulan berkelanjutan bagi para trader?",
    "Bagaimana teori pasar lelang dan analisis volume digunakan untuk memvalidasi level perdagangan?",
    "Apa perbandingan risiko, imbal hasil, dan psikologi antara scalping futures dan trading Gold?",
];

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'homepage' | 'main'>('homepage');
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
    
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    
    const [sources, setSources] = useState<Source[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [artifacts, setArtifacts] = useState<Artifact[]>(initialArtifacts);
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
    const [artifactToDelete, setArtifactToDelete] = useState<Artifact | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);


    const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
    const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(null);
    
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
    const [isConfigureChatModalOpen, setIsConfigureChatModalOpen] = useState(false);
    const [chatConfig, setChatConfig] = useState<ChatConfig>({ style: 'Default', length: 'Default', customPrompt: '' });
    const [activeTab, setActiveTab] = useState<'sources' | 'chat' | 'studio'>('studio');
    const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
    const [outputLanguage, setOutputLanguage] = useState('Indonesia');

    // --- Database and State Initialization ---
    useEffect(() => {
        const initializeDB = async () => {
            const existingNotebooks = await getAllNotebooks();
            setNotebooks(existingNotebooks);
        };
        initializeDB();
    }, []);

    // --- Fetch sources when current notebook changes ---
    useEffect(() => {
        if (currentNotebook) {
            getSourcesByNotebookId(currentNotebook.id).then(setSources);
        } else {
            setSources([]);
        }
    }, [currentNotebook]);

    // --- Navigation and View Management ---
    const handleNotebookSelect = useCallback(async (notebook?: Notebook) => {
        if (notebook) {
            setCurrentNotebook(notebook);
            setCurrentView('main');
        } else {
            // Create a new notebook
            const newNotebookData: Omit<Notebook, 'id'> = {
                title: 'Untitled Notebook',
                icon: 'FileText',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                sources: 0
            };
            const newId = await addNotebook(newNotebookData);
            const newNotebook = { ...newNotebookData, id: newId };
            
            setNotebooks(prev => [...prev, newNotebook]);
            setCurrentNotebook(newNotebook);
            setCurrentView('main');
            setIsAddSourceModalOpen(true);
        }
    }, []);

    const handleGoToHomepage = useCallback(async () => {
        // If the current notebook is empty (has no sources), delete it when navigating away.
        if (currentNotebook && sources.length === 0) {
            await deleteNotebook(currentNotebook.id);
        }
        
        const updatedNotebooks = await getAllNotebooks();
        setNotebooks(updatedNotebooks);
        setCurrentNotebook(null);
        setMessages([]); // Clear chat history
        setCurrentView('homepage');
    }, [currentNotebook, sources]);

    // --- Sidebar Toggles ---
    const handleToggleLeftSidebar = useCallback(() => setIsLeftSidebarOpen(prev => !prev), []);
    const handleToggleRightSidebar = useCallback(() => setIsRightSidebarOpen(prev => !prev), []);
    
    // --- Source Management ---
    const handleFileUpload = useCallback(async (files: FileList) => {
        if (!currentNotebook) return;

        const sourcePromises = Array.from(files).map(async (file): Promise<Source> => {
            try {
                const baseSource = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    status: SourceStatus.INDEXING,
                    checked: true,
                    notebookId: currentNotebook.id,
                };

                if (file.type.startsWith('image/')) {
                    const base64Content = await fileToBase64(file);
                    return {
                        ...baseSource,
                        type: 'image',
                        base64Content: base64Content,
                        mimeType: file.type,
                    };
                } else if (file.type === 'application/pdf') {
                    // Ensure pdf.js is available at runtime. Try to load it dynamically if needed.
                    const pdfjs = await loadPdfJs();
                    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                        // Try to resolve a local worker URL via Vite's ?url import. This keeps the worker served
                        // by the dev server / build instead of relying on a CDN path which may 404 or be blocked.
                        try {
                            // Vite will return a string URL when importing with ?url
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            const workerUrlModule = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
                            const workerUrl = workerUrlModule && (workerUrlModule.default || workerUrlModule);
                            if (workerUrl) {
                                pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
                            } else {
                                throw new Error('pdf.worker URL not found from pdfjs-dist');
                            }
                        } catch (e) {
                            // Fallback to the CDN .mjs worker URL (use .mjs for newer pdf.js releases)
                            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
                        }
                    }

                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }
                    return { ...baseSource, type: 'pdf', textContent: fullText.trim() };
                } else if (file.type.startsWith('audio/')) {
                     const base64Content = await fileToBase64(file);
                     return {
                        ...baseSource,
                        type: 'audio',
                        base64Content: base64Content,
                        mimeType: file.type,
                    };
                } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
                    const textContent = await file.text();
                    return { ...baseSource, type: 'text', textContent };
                }

                // Fallback for unsupported types
                return {
                    ...baseSource,
                    type: 'file',
                    status: SourceStatus.FAILED,
                    textContent: `Unsupported file type: ${file.type}`
                };
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                // Create a source object on failure for UI feedback
                return {
                    id: crypto.randomUUID(),
                    name: file.name,
                    type: 'file',
                    status: SourceStatus.FAILED,
                    checked: true,
                    notebookId: currentNotebook.id,
                    textContent: `Failed to process file: ${(error as Error).message}`
                };
            }
        });
        
        const newSources = await Promise.all(sourcePromises);

        setSources(prev => [...prev, ...newSources]);
        
        for (const source of newSources) {
            await addSource(source);
        }
        
        const updatedNotebook = { ...currentNotebook, sources: currentNotebook.sources + newSources.length };
        await db.notebooks.update(currentNotebook.id, { sources: updatedNotebook.sources });
        setCurrentNotebook(updatedNotebook);
        setNotebooks(prev => prev.map(n => n.id === currentNotebook.id ? updatedNotebook : n));

        // Process sources with embeddings for RAG
        newSources.forEach(source => {
            if (source.status === SourceStatus.INDEXING) {
                // Generate embeddings asynchronously
                (async () => {
                    try {
                        // Only process text-based sources
                        if ((source.type === 'text' || source.type === 'pdf') && source.textContent) {
                            console.log(`Processing embeddings for: ${source.name}`);
                            const chunks = await processDocumentToChunks(
                                source.id,
                                source.name,
                                source.textContent
                            );
                            await vectorStore.addChunks(chunks);
                            console.log(`Added ${chunks.length} chunks to vector store for ${source.name}`);
                        }
                        
                        await updateSourceStatus(source.id, SourceStatus.INDEXED);
                        setSources(prev => prev.map(s => 
                            s.id === source.id ? { ...s, status: SourceStatus.INDEXED } : s
                        ));
                    } catch (error) {
                        console.error(`Failed to process source ${source.name}:`, error);
                        await updateSourceStatus(source.id, SourceStatus.FAILED);
                        setSources(prev => prev.map(s => 
                            s.id === source.id ? { ...s, status: SourceStatus.FAILED } : s
                        ));
                    }
                })();
            }
        });
    }, [currentNotebook]);
    
    const handleAddTextSource = useCallback(async (content: string, type: 'website' | 'youtube' | 'text') => {
        if (!currentNotebook) return;
    
        if (type === 'website') {
            const urls = content.split(/[\s\n]+/).filter(url => {
                try {
                    new URL(url);
                    return true;
                } catch (_) {
                    return false;
                }
            });
            
            if (urls.length === 0) return;
    
            const newSources: Source[] = urls.map(url => ({
                id: crypto.randomUUID(),
                name: url,
                type: 'website',
                status: SourceStatus.INDEXED,
                checked: true,
                notebookId: currentNotebook.id,
                textContent: url,
            }));
    
            setSources(prev => [...prev, ...newSources]);
    
            for (const source of newSources) {
                await addSource(source);
            }

            const updatedNotebook = { ...currentNotebook, sources: currentNotebook.sources + newSources.length };
            await db.notebooks.update(currentNotebook.id, { sources: updatedNotebook.sources });
            setCurrentNotebook(updatedNotebook);
            setNotebooks(prev => prev.map(n => n.id === currentNotebook.id ? updatedNotebook : n));
    
        } else { // Handle 'youtube' and 'text'
            const sourceName = type === 'text' 
                ? `Pasted Text - ${new Date().toLocaleTimeString()}` 
                : content;
    
            const newSource: Source = {
                id: crypto.randomUUID(),
                name: sourceName,
                type: type,
                status: SourceStatus.INDEXING,
                checked: true,
                notebookId: currentNotebook.id,
                textContent: content,
            };
            
            setSources(prev => [...prev, newSource]);
            
            await addSource(newSource);
    
            const updatedNotebook = { ...currentNotebook, sources: currentNotebook.sources + 1 };
            await db.notebooks.update(currentNotebook.id, { sources: updatedNotebook.sources });
            setCurrentNotebook(updatedNotebook);
            setNotebooks(prev => prev.map(n => n.id === currentNotebook.id ? updatedNotebook : n));
    
            // Process text source with embeddings
            (async () => {
                try {
                    if (newSource.textContent) {
                        console.log(`Processing embeddings for: ${newSource.name}`);
                        const chunks = await processDocumentToChunks(
                            newSource.id,
                            newSource.name,
                            newSource.textContent
                        );
                        await vectorStore.addChunks(chunks);
                        console.log(`Added ${chunks.length} chunks to vector store for ${newSource.name}`);
                    }
                    
                    await updateSourceStatus(newSource.id, SourceStatus.INDEXED);
                    setSources(prev => prev.map(s => 
                        s.id === newSource.id ? { ...s, status: SourceStatus.INDEXED } : s
                    ));
                } catch (error) {
                    console.error(`Failed to process source ${newSource.name}:`, error);
                    await updateSourceStatus(newSource.id, SourceStatus.FAILED);
                    setSources(prev => prev.map(s => 
                        s.id === newSource.id ? { ...s, status: SourceStatus.FAILED } : s
                    ));
                }
            })();
        }
    }, [currentNotebook]);

    const handleImportSources = useCallback(async (discoveredSources: DiscoveredSource[]) => {
        if (!currentNotebook) return;
    
        const newSources: Source[] = discoveredSources.map(ds => {
            let type: SourceType = 'website';
            try {
                const url = new URL(ds.link);
                if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                    type = 'youtube';
                }
            } catch (e) {
                console.warn(`Invalid URL discovered: ${ds.link}`);
            }
    
            return {
                id: crypto.randomUUID(),
                name: ds.title,
                type: type,
                status: SourceStatus.INDEXED, // Assume web sources are ready
                checked: true,
                notebookId: currentNotebook.id,
                textContent: ds.link, // Store the link here
            };
        });
    
        if (newSources.length > 0) {
            setSources(prev => [...prev, ...newSources]);
            
            for (const source of newSources) {
                await addSource(source);
            }
    
            const updatedNotebook = { ...currentNotebook, sources: currentNotebook.sources + newSources.length };
            await db.notebooks.update(currentNotebook.id, { sources: updatedNotebook.sources });
            setCurrentNotebook(updatedNotebook);
            setNotebooks(prev => prev.map(n => n.id === currentNotebook.id ? updatedNotebook : n));
        }
    
        setIsDiscoverModalOpen(false);
    }, [currentNotebook]);

    const handleToggleSource = useCallback((id: string) => {
        setSources(prevSources => prevSources.map(source =>
            source.id === id ? { ...source, checked: !source.checked } : source
        ));
    }, []);

    const handleToggleAllSources = useCallback((checked: boolean) => {
        setSources(prevSources => prevSources.map(source => ({ ...source, checked })));
    }, []);
    
    const handleOpenDeleteConfirmation = (source: Source) => setSourceToDelete(source);
    const handleCloseDeleteConfirmation = () => setSourceToDelete(null);

    const handleDeleteSource = async () => {
        if (sourceToDelete && currentNotebook) {
            await deleteSource(sourceToDelete.id);
            
            // Remove from vector store
            await vectorStore.removeChunksBySourceId(sourceToDelete.id);
            console.log(`Removed vector embeddings for: ${sourceToDelete.name}`);
            
            setSources(prevSources => prevSources.filter(s => s.id !== sourceToDelete.id));
            
            // Update notebook source count
            const updatedNotebook = { ...currentNotebook, sources: currentNotebook.sources - 1 };
            await db.notebooks.update(currentNotebook.id, { sources: updatedNotebook.sources });
            setCurrentNotebook(updatedNotebook);
            setNotebooks(prev => prev.map(n => n.id === currentNotebook.id ? updatedNotebook : n));

            setSourceToDelete(null);
        }
    };
    
    // --- Notebook Management ---
    const handleUpdateNotebookTitle = useCallback(async (id: number, newTitle: string) => {
        if (!newTitle.trim()) return; // Don't save empty titles

        await updateNotebookTitle(id, newTitle.trim());

        const updateState = (prev: Notebook[]) => prev.map(n => n.id === id ? { ...n, title: newTitle.trim() } : n);
        setNotebooks(updateState);

        if (currentNotebook && currentNotebook.id === id) {
            setCurrentNotebook(prev => prev ? { ...prev, title: newTitle.trim() } : null);
        }
    }, [currentNotebook]);

    const handleOpenNotebookDeleteConfirmation = (notebook: Notebook) => setNotebookToDelete(notebook);
    const handleCloseNotebookDeleteConfirmation = () => setNotebookToDelete(null);

    const handleDeleteNotebook = async () => {
        if (notebookToDelete) {
            await deleteNotebook(notebookToDelete.id);
            setNotebooks(prev => prev.filter(n => n.id !== notebookToDelete.id));
            setNotebookToDelete(null);
        }
    };

    // --- Chat, Notes and Suggestions ---
    const updateSuggestions = useCallback(async () => {
        if (!currentNotebook) return;

        const relevantSources = sources.filter(s => s.checked && s.status === SourceStatus.INDEXED);
        
        try {
            const newSuggestions = await generateSuggestions(relevantSources, messages);
            if (newSuggestions && newSuggestions.length > 0) {
                setSuggestions(newSuggestions);
            }
        } catch (e) {
            console.error("Failed to update suggestions:", e);
        }
    }, [currentNotebook, sources, messages]);

    useEffect(() => {
        if (currentNotebook) {
            const lastMessage = messages[messages.length - 1];
            // Update on notebook load (no messages) or after a bot response.
            if (!lastMessage || lastMessage.sender === 'bot') {
                 updateSuggestions();
            }
        } else {
            setSuggestions(initialSuggestions);
        }
    }, [currentNotebook, messages, sources, updateSuggestions]); // `sources` is added as a dependency to regenerate suggestions when sources change


    const handleSaveToNote = useCallback((messageToSave: Message) => {
        const noteContent = messageToSave.text;
        const plainText = noteContent
            .replace(/\[source:\d+\]/g, '')
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            .replace(/(\*|_)(.*?)\1/g, '$2')
            .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/\s+/g, ' ')
            .trim();

        const newArtifact: Artifact = {
            id: Date.now(),
            title: plainText.substring(0, 40) + (plainText.length > 40 ? '...' : ''),
            icon: StickyNote,
            details: `Saved just now`,
            content: noteContent,
            sources: messageToSave.sources,
            chunks: messageToSave.chunks,
        };
        setArtifacts(prev => [newArtifact, ...prev]);
        setActiveTab('studio');
    }, []);

    const handleAddNote = useCallback(() => {
        const newArtifact: Artifact = {
            id: Date.now(),
            title: 'Untitled Note',
            icon: StickyNote,
            details: `Created just now`,
            content: '',
        };
        setArtifacts(prev => [newArtifact, ...prev]);
        setActiveTab('studio');
    }, []);

    const handleArtifactSelect = (artifact: Artifact) => {
        if (artifact.content !== undefined) { // Only notes can be opened
            setSelectedArtifact(artifact);
            setActiveTab('studio');
        }
    };
    
    const handleBackToStudio = () => {
        setSelectedArtifact(null);
    };
    
    const handleOpenArtifactDeleteConfirmation = (artifact: Artifact) => {
        setArtifactToDelete(artifact);
    };
    
    const handleCloseArtifactDeleteConfirmation = () => {
        setArtifactToDelete(null);
    };
    
    const handleDeleteArtifact = async () => {
        if (artifactToDelete) {
            setArtifacts(prev => prev.filter(a => a.id !== artifactToDelete.id));
            if (selectedArtifact && selectedArtifact.id === artifactToDelete.id) {
                setSelectedArtifact(null);
            }
            setArtifactToDelete(null);
        }
    };


    const handleQuerySubmit = useCallback(async (query: string) => {
        if (!query.trim() || isLoading) return;

        setError(null);
        setIsLoading(true);
        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: query };
        setMessages(prev => [...prev, userMessage]);

        const checkedSources = sources.filter(s => s.checked && s.status === SourceStatus.INDEXED);
        
        try {
            // Use RAG-based generation with vector search
            const { text: botResponseText, retrievedChunks } = await generateChatResponse(
                query, 
                checkedSources,
                messages // Pass conversation history for context
            );
            
            console.log(`RAG retrieved ${retrievedChunks?.length || 0} relevant chunks`);
            
            const botMessage: Message = { 
                id: (Date.now() + 1).toString(), 
                sender: 'bot', 
                text: botResponseText,
                sources: checkedSources,
                // Convert retrieved chunks to the Message chunk format if needed
                chunks: retrievedChunks?.map((result, idx) => ({
                    sourceIndex: idx,
                    content: result.chunk.content
                })),
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            const botErrorMessage: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: `Sorry, an error occurred: ${errorMessage}` };
            setMessages(prev => [...prev, botErrorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, sources]);
    
    const handleClearChat = useCallback(() => {
        setMessages([]);
    }, []);

    // --- Modals ---
    const handleAddSourceClick = useCallback(() => setIsAddSourceModalOpen(true), []);
    const handleDiscoverSourceClick = useCallback(() => {
        setIsAddSourceModalOpen(false);
        setIsDiscoverModalOpen(true);
    }, []);
    const handleOpenConfigureChat = useCallback(() => setIsConfigureChatModalOpen(true), []);
    const handleSaveChatConfig = useCallback((newConfig: ChatConfig) => {
        setChatConfig(newConfig);
        // In a real app, you would likely save this to the DB for the current notebook
        console.log("Chat config saved:", newConfig);
    }, []);

    const handleOpenLanguageModal = useCallback(() => setIsLanguageModalOpen(true), []);
    const handleSaveLanguage = useCallback((language: string) => {
        setOutputLanguage(language);
        console.log("Language saved:", language);
        // In a real app, this would likely be saved to user preferences or DB.
    }, []);

    // --- Computed values ---
    const checkedSourcesCount = sources.filter(s => s.checked).length;
    const isAllSourcesSelected = sources.length > 0 && checkedSourcesCount === sources.length;
    const totalSourcesCount = sources.length;


    return (
        <div className="flex flex-col h-full max-h-screen overflow-hidden bg-white">
            <Header 
                activeTab={activeTab} 
                onNavigateHome={currentView === 'main' ? handleGoToHomepage : undefined}
                notebookTitle={currentNotebook?.title}
                onUpdateTitle={(newTitle) => currentNotebook && handleUpdateNotebookTitle(currentNotebook.id, newTitle)}
                onOpenLanguageModal={handleOpenLanguageModal}
            />
            
            {currentView === 'homepage' ? (
                <HomePage 
                    onNotebookSelect={handleNotebookSelect} 
                    notebooks={notebooks}
                    onOpenDeleteConfirmation={handleOpenNotebookDeleteConfirmation}
                    onUpdateNotebookTitle={handleUpdateNotebookTitle}
                />
            ) : (
                <>
                    {/* Mobile Tab Navigation */}
                    <div className="md:hidden">
                        <TabPanel activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>

                    <main className="flex flex-1 overflow-hidden md:p-4 md:pt-0 md:pb-0 md:gap-4 bg-white">
                        {/* Left Sidebar (Sources) */}
                        <div className={`${activeTab === 'sources' ? 'flex flex-1' : 'hidden'} md:flex md:flex-none`}>
                            <LeftSidebar
                                isOpen={isLeftSidebarOpen}
                                onToggle={handleToggleLeftSidebar}
                                sources={sources}
                                onAddSource={handleAddSourceClick}
                                onDiscoverSource={handleDiscoverSourceClick}
                                onToggleSource={handleToggleSource}
                                onToggleAllSources={handleToggleAllSources}
                                isAllSelected={isAllSourcesSelected}
                                onOpenDeleteConfirmation={handleOpenDeleteConfirmation}
                            />
                        </div>
                        {/* Chat View */}
                        <div className={`${activeTab === 'chat' ? 'flex' : 'hidden'} flex-1 min-w-0 md:flex`}>
                            <ChatView
                                messages={messages}
                                isLoading={isLoading}
                                error={error}
                                onSubmit={handleQuerySubmit}
                                sourceCount={checkedSourcesCount}
                                totalSourcesCount={totalSourcesCount}
                                onSaveToNote={handleSaveToNote}
                                onClearChat={handleClearChat}
                                onAddSource={handleAddSourceClick}
                                suggestions={suggestions}
                                onOpenConfigureChat={handleOpenConfigureChat}
                            />
                        </div>
                        {/* Right Sidebar (Studio) */}
                        <div className={`${activeTab === 'studio' ? 'flex flex-1' : 'hidden'} md:flex md:flex-none`}>
                             <RightSidebar
                                isOpen={isRightSidebarOpen}
                                onToggle={handleToggleRightSidebar}
                                artifacts={artifacts}
                                onAddNote={handleAddNote}
                                selectedArtifact={selectedArtifact}
                                onArtifactSelect={handleArtifactSelect}
                                onBack={handleBackToStudio}
                                onDelete={handleOpenArtifactDeleteConfirmation}
                                disabled={totalSourcesCount === 0}
                            />
                        </div>
                    </main>
                    <div className={activeTab === 'chat' ? '' : 'hidden md:block'}>
                        <Footer />
                    </div>
                </>
            )}

            <ConfirmationModal
                isOpen={!!sourceToDelete}
                onClose={handleCloseDeleteConfirmation}
                onConfirm={handleDeleteSource}
                title="Remove source"
                itemName={sourceToDelete?.name || ''}
            />
            <ConfirmationModal
                isOpen={!!notebookToDelete}
                onClose={handleCloseNotebookDeleteConfirmation}
                onConfirm={handleDeleteNotebook}
                title="Remove notebook"
                itemName={notebookToDelete?.title || ''}
            />
            <ConfirmationModal
                isOpen={!!artifactToDelete}
                onClose={handleCloseArtifactDeleteConfirmation}
                onConfirm={handleDeleteArtifact}
                title="Remove note"
                itemName={artifactToDelete?.title || ''}
            />
            <AddSourceModal 
                isOpen={isAddSourceModalOpen}
                onClose={() => setIsAddSourceModalOpen(false)}
                onFileUpload={handleFileUpload}
                onAddTextSource={handleAddTextSource}
                onDiscoverSource={handleDiscoverSourceClick}
                sourceCount={totalSourcesCount}
            />
            <DiscoverSourcesModal 
                isOpen={isDiscoverModalOpen}
                onClose={() => setIsDiscoverModalOpen(false)}
                onImport={handleImportSources}
            />
            <ConfigureChatModal
                isOpen={isConfigureChatModalOpen}
                onClose={() => setIsConfigureChatModalOpen(false)}
                onSave={handleSaveChatConfig}
                initialConfig={chatConfig}
            />
            <LanguageModal
                isOpen={isLanguageModalOpen}
                onClose={() => setIsLanguageModalOpen(false)}
                onSave={handleSaveLanguage}
                initialLanguage={outputLanguage}
            />
        </div>
    );
};

export default App;
