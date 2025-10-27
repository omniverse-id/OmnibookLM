import React, { useState, useRef, useEffect } from 'react';
import { X, AudioLines, Check, ChevronDown } from 'lucide-react';
import { ResponseLength } from '../types';

interface AudioOverviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatOptions = [
    { title: 'Deep Dive', description: 'A lively conversation between two hosts, unpacking and connecting topics in your sources' },
    { title: 'Brief', description: 'A bite-sized overview to help you grasp the core ideas from your sources quickly' },
    { title: 'Critique', description: 'An expert review of your sources, offering constructive feedback to help you improve your material' },
    { title: 'Debate', description: 'A thoughtful debate between two hosts, illuminating different perspectives on your sources' }
];

const languages = ['Indonesia', 'English', 'Spanish'];

const focusSuggestions: Record<string, string[]> = {
    'Deep Dive': [
        'Focus on a specific source (“only cover the article about Italy”)',
        'Focus on a specific topic (“just discuss the novel’s main character”)',
        'Target a specific audience (“explain to someone new to biology”)'
    ],
    'Brief': [
        'Focus on a specific topic ("Give me a brief on the key findings about this topic")',
        'Target a specific audience ("Explain the core concepts to me as if I’m a beginner")',
        'Focus on a specific source ("Create a summary of just the provided meeting notes")'
    ],
    'Critique': [
        'Focus on a specific topic ("Critique the opening paragraph. Does it successfully hook the reader?")',
        'Target a specific audience ("Review this doc and tell me if the main point is clear for a general audience")',
        'Focus on a specific source ("Provide constructive feedback on the structure and clarity of this draft")',
        'Request a specific type of feedback ("Critique the writing style and tone", or "Analyze the methodology used in this paper.")'
    ],
    'Debate': [
        'Focus on a specific topic ("Formulate a debate on the ethical implications of the events described")',
        'Target a specific audience ("Debate the pros and cons of the proposed solution for an audience of skeptics.")',
        'Focus on a specific source ("Stage a debate about the main conclusion of the provided research paper")'
    ]
};


const AudioOverviewModal: React.FC<AudioOverviewModalProps> = ({ isOpen, onClose }) => {
    const [selectedFormat, setSelectedFormat] = useState('Deep Dive');
    const [selectedLength, setSelectedLength] = useState<ResponseLength>('Default');
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState('Indonesia');
    const langDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const currentSuggestions = focusSuggestions[selectedFormat] || [];
    const lengthOptions: ResponseLength[] = ['Shorter', 'Default'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" role="document" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <AudioLines className="h-6 w-6 text-gray-700" />
                        <h2 className="text-xl font-medium text-gray-800">Customize Audio Overview</h2>
                    </div>
                    <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Format Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Format</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {formatOptions.map(opt => {
                                const isSelected = selectedFormat === opt.title;
                                return (
                                    <button 
                                        key={opt.title} 
                                        onClick={() => setSelectedFormat(opt.title)}
                                        className={`relative p-4 text-left border border-gray-300 rounded-lg transition-colors duration-200 h-full ${isSelected ? 'bg-[#e4e4e2]' : 'hover:border-gray-400 bg-white'}`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-2 right-2">
                                                <Check className="h-5 w-5 text-gray-900" />
                                            </div>
                                        )}
                                        <h4 className="font-semibold text-gray-900 text-sm">{opt.title}</h4>
                                        <p className="text-xs text-gray-600 mt-1">{opt.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Language and Length Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Choose language</label>
                            <div className="relative" ref={langDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                                    className="w-full h-10 pl-3 pr-4 text-left bg-white text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md flex items-center justify-between"
                                    aria-haspopup="listbox"
                                    aria-expanded={isLangDropdownOpen}
                                >
                                    <span>{selectedLang}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-700 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isLangDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                        <ul role="listbox">
                                            {languages.map(lang => (
                                                <li
                                                    key={lang}
                                                    onClick={() => {
                                                        setSelectedLang(lang);
                                                        setIsLangDropdownOpen(false);
                                                    }}
                                                    className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                                                    role="option"
                                                    aria-selected={selectedLang === lang}
                                                >
                                                    {lang}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                            <div className="inline-flex items-center p-0.5 border border-gray-300 rounded-lg bg-gray-100">
                                {lengthOptions.map(opt => (
                                     <button
                                        key={opt}
                                        onClick={() => setSelectedLength(opt)}
                                        className={`flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            selectedLength === opt
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-transparent text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {selectedLength === opt && <Check className="w-4 h-4" />}
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Focus Section */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">What should the AI hosts focus on in this episode?</label>
                         <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-sm font-medium text-gray-800 mb-2">Things to try</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                {currentSuggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                ))}
                            </ul>
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 bg-white rounded-b-lg">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioOverviewModal;
