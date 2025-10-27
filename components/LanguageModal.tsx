import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface LanguageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (language: string) => void;
    initialLanguage: string;
}

const languages = ['Indonesia', 'English', 'Spanish', 'French', 'German'];

const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose, onSave, initialLanguage }) => {
    const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(selectedLanguage);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xl" role="document" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-200">
                    <h2 className="text-xl font-medium text-gray-800">Configure Settings</h2>
                    <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="language-select" className="block text-sm font-medium text-gray-500 mb-2">
                            Choose your language override
                        </label>
                        <div className="relative">
                            <select
                                id="language-select"
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="w-full h-12 pl-3 pr-10 text-left bg-white text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-gray-800 sm:text-sm rounded-lg appearance-none"
                            >
                                {languages.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <ChevronDown className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 bg-white rounded-b-lg border-t border-gray-200">
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LanguageModal;
