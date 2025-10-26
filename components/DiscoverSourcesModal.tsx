import React, { useState, useEffect, useMemo } from 'react';
import { X, Wand2, WandSparkles, Loader2, ArrowLeft, ThumbsUp, ThumbsDown, FileText, ExternalLink } from 'lucide-react';
import { discoverSources } from '../services/geminiService';
import { DiscoverResults, DiscoveredSource } from '../types';

interface DiscoverSourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (sources: DiscoveredSource[]) => void;
}

const renderWithEmphasis = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\*.*?\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={i}>{part.slice(1, -1)}</strong>;
        }
        return part;
    });
};


const DiscoverSourcesModal: React.FC<DiscoverSourcesModalProps> = ({ isOpen, onClose, onImport }) => {
    const [view, setView] = useState<'search' | 'loading' | 'results' | 'error'>('search');
    const [topic, setTopic] = useState('');
    const [results, setResults] = useState<DiscoverResults | null>(null);
    const [selectedLinks, setSelectedLinks] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Delay reset to allow for closing animation
            const timer = setTimeout(() => {
                setView('search');
                setTopic('');
                setResults(null);
                setSelectedLinks({});
                setError(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);
    
    const handleSearch = async (searchTopic: string) => {
        setView('loading');
        setError(null);
        try {
            const res = await discoverSources(searchTopic);
            setResults(res);
            setView('results');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setView('error');
        }
    };

    const handleSubmit = () => {
        if (topic.trim()) {
            handleSearch(topic);
        }
    };

    const handleFeelingCurious = () => {
        const curiousTopic = "a surprising and interesting topic from history, science, or art";
        setTopic(curiousTopic)
        handleSearch(curiousTopic);
    };

    const handleToggleSelect = (link: string) => {
        setSelectedLinks(prev => ({ ...prev, [link]: !prev[link] }));
    };

    const selectedCount = useMemo(() => Object.values(selectedLinks).filter(Boolean).length, [selectedLinks]);
    const allSelected = useMemo(() => results ? results.sources.length > 0 && selectedCount === results.sources.length : false, [results, selectedCount]);

    const handleToggleSelectAll = () => {
        if (allSelected) {
            setSelectedLinks({});
        } else if (results) {
            const all = results.sources.reduce((acc, source) => {
                acc[source.link] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setSelectedLinks(all);
        }
    };

    const handleImport = () => {
        if (!results) return;
        const sourcesToImport = results.sources.filter(s => selectedLinks[s.link]);
        onImport(sourcesToImport);
    };


    const renderSearch = () => (
         <>
            <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-200">
                <h2 className="text-xl font-medium text-gray-800">Discover sources</h2>
                <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                    <X className="h-5 w-5" />
                </button>
            </div>
            <div className="p-8 text-center flex flex-col items-center">
                <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <WandSparkles className="w-7 h-7" />
                    </div>
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-4">What are you interested in?</h3>
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={'Describe something you’d like to learn about or click "I\'m feeling curious" to explore a new topic.'}
                    className="w-full h-28 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800 resize-none text-sm text-left"
                />
            </div>
            <div className="flex justify-end items-center gap-3 p-4 bg-white rounded-b-lg border-t border-gray-200">
                <button onClick={handleFeelingCurious} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium text-sm rounded-lg hover:bg-blue-100 focus:outline-none transition-colors">
                    <Wand2 className="h-4 w-4" />
                    I'm feeling curious
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!topic.trim()}
                    className="px-6 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Submit
                </button>
            </div>
        </>
    );

    const renderLoading = () => (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-gray-700 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-800">Discovering sources...</h3>
            <p className="text-sm text-gray-500 mt-1">Find the best sources for you.</p>
        </div>
    );

    const renderError = () => (
         <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-lg font-medium text-red-600">Something went wrong</h3>
            <p className="text-sm text-gray-500 mt-2 mb-4">{error}</p>
            <button
                onClick={() => setView('search')}
                className="px-6 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800"
            >
                Try Again
            </button>
        </div>
    );
    
    const renderResults = () => {
        if (!results) return renderError();
        return (
            <div className="flex flex-col h-full">
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
                     <button onClick={() => setView('search')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 mr-2">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-medium text-gray-800 text-center flex-1">Discover sources</h2>
                    <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-600 ml-2">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
                    <p className="text-gray-700 mb-6 text-sm">{renderWithEmphasis(results.summary)}</p>
                    <div className="border-b border-gray-200 mb-2">
                         <label className="flex items-center py-2 px-2 cursor-pointer hover:bg-gray-50 rounded-lg">
                            <span className="flex-1 text-sm font-medium text-gray-800">Select all sources</span>
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={allSelected}
                                onChange={handleToggleSelectAll}
                            />
                        </label>
                    </div>
                    <div className="space-y-1">
                        {results.sources.map(source => (
                            <label key={source.link} className="flex items-start py-3 px-2 cursor-pointer hover:bg-gray-50 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="ml-4 flex-1">
                                    <a href={source.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:underline inline-flex items-center gap-1">
                                        {source.title}
                                        <ExternalLink className="h-3 w-3 text-gray-500" />
                                    </a>
                                    <p className="text-sm text-gray-500 mt-1">{source.description}</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="ml-4 mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={!!selectedLinks[source.link]}
                                    onChange={() => handleToggleSelect(source.link)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end p-4 border-t border-gray-200 bg-white rounded-b-lg">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{selectedCount} source{selectedCount !== 1 ? 's' : ''} selected</span>
                        <button
                            onClick={handleImport}
                            disabled={selectedCount === 0}
                            className="px-6 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Import
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (view) {
            case 'search': return renderSearch();
            case 'loading': return renderLoading();
            case 'results': return renderResults();
            case 'error': return renderError();
            default: return renderSearch();
        }
    }


    if (!isOpen) return null;

    const modalHeightClass = view === 'results' ? 'h-[90vh] max-h-[700px]' : 'h-auto';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col ${modalHeightClass}`} role="document" onClick={(e) => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
};

export default DiscoverSourcesModal;