import React, { useState, useRef, useEffect } from 'react';
import { X, ClipboardList, WandSparkles, Pencil, ArrowLeft, ChevronDown } from 'lucide-react';

interface CreateReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const reportFormats = [
  { title: 'Create Your Own', description: 'Craft reports your way by specifying structure, style, tone, and more', hasEdit: false },
  { title: 'Briefing Doc', description: 'Overview of your sources featuring key insights and quotes', hasEdit: true },
  { title: 'Study Guide', description: 'Short-answer quiz, suggested essay questions, and glossary of key terms', hasEdit: true },
  { title: 'Blog Post', description: 'Insightful takeaways distilled into a highly readable article', hasEdit: true }
];

const suggestedFormats = [
  { title: 'Investment Thesis', description: 'A detailed memo outlining a day trading methodology based on order flow analysis.', hasEdit: true },
  { title: 'Strategic Playbook', description: 'A comprehensive playbook detailing two distinct, adaptable trading models.', hasEdit: true },
  { title: 'Concept Explainer', description: 'Learn the fundamentals of order flow and how professional traders use it.', hasEdit: true },
  { title: 'Strategy Summary', description: 'Discover the two main trading models used by a world-class scalper.', hasEdit: true }
];

const languages = ['Indonesia (default)', 'English', 'Spanish', 'French', 'German'];


interface FormatCardProps {
    title: string;
    description: string;
    hasEdit: boolean;
    onClick: () => void;
}

const FormatCard: React.FC<FormatCardProps> = ({ title, description, hasEdit, onClick }) => (
    <button onClick={onClick} className="relative text-left w-full h-full p-4 bg-[#fbfbf8] rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-[#f6f6f2] transition-colors duration-200 flex flex-col justify-between">
        {hasEdit && (
            <div className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-[#edebe4] rounded-lg">
                <Pencil className="w-4 h-4 text-gray-700" />
            </div>
        )}
        <div>
            <h4 className="font-medium text-gray-900 text-sm pr-8">{title}</h4>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
    </button>
);


const CreateReportModal: React.FC<CreateReportModalProps> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<'selection' | 'custom'>('selection');
    const [selectedLanguage, setSelectedLanguage] = useState('Indonesia (default)');
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [reportDescription, setReportDescription] = useState('');
    const langDropdownRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close after animation
            setTimeout(() => {
                setView('selection');
                setReportDescription('');
                setSelectedLanguage('Indonesia (default)');
            }, 300);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFormatClick = (title: string) => {
      if (title !== 'Create Your Own') {
        setReportDescription(`Create a ${title.toLowerCase()} based on the provided sources.`);
      } else {
        setReportDescription('');
      }
      setView('custom');
    };

    const renderSelectionView = () => (
        <div className="p-6 space-y-8">
            {/* Format Section */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Format</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {reportFormats.map(format => (
                        <FormatCard key={format.title} {...format} onClick={() => handleFormatClick(format.title)} />
                    ))}
                </div>
            </div>

            {/* Suggested Format Section */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <WandSparkles className="h-5 w-5 text-gray-700" />
                    <h3 className="text-sm font-medium text-gray-700">Suggested Format</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {suggestedFormats.map(format => (
                        <FormatCard key={format.title} {...format} onClick={() => handleFormatClick(format.title)} />
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCustomView = () => (
        <>
            <div className="p-6 space-y-6">
                {/* Language */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose language</label>
                    <div className="relative" ref={langDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                            className="w-full h-11 pl-3 pr-4 text-left bg-white text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-gray-800 sm:text-sm rounded-md flex items-center justify-between"
                            aria-haspopup="listbox"
                            aria-expanded={isLangDropdownOpen}
                        >
                            <span>{selectedLanguage}</span>
                            <ChevronDown className={`h-4 w-4 text-gray-700 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isLangDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                <ul role="listbox">
                                    {languages.map(lang => (
                                        <li
                                            key={lang}
                                            onClick={() => {
                                                setSelectedLanguage(lang);
                                                setIsLangDropdownOpen(false);
                                            }}
                                            className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                                            role="option"
                                            aria-selected={selectedLanguage === lang}
                                        >
                                            {lang}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Describe the report you want to create</label>
                    <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder={
`For example:
Create a formal competitive review of the 2026 functional beverage market for a new wellness drink. The tone should be analytical and strategic, focusing on the distribution and pricing of key competitors to inform our launch strategy.`
                        }
                        className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-800 resize-y text-sm placeholder:text-gray-400"
                    />
                </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end p-4 bg-white border-t border-gray-200 rounded-b-lg">
                <button
                    onClick={onClose}
                    disabled={!reportDescription.trim()}
                    className="px-6 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    Generate
                </button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl" role="document" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {view === 'custom' && (
                             <button onClick={() => setView('selection')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <ClipboardList className="h-6 w-6 text-gray-700" />
                        <h2 className="text-xl font-medium text-gray-800">Create report</h2>
                    </div>
                    <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Conditional Body */}
                {view === 'selection' ? renderSelectionView() : renderCustomView()}
            </div>
        </div>
    );
};

export default CreateReportModal;