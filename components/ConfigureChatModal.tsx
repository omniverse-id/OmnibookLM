import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { ChatConfig, ConversationalStyle, ResponseLength } from '../types';

interface ConfigureChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: ChatConfig) => void;
    initialConfig: ChatConfig;
}

const styleOptions: { id: ConversationalStyle; title: string; description: string }[] = [
    { id: 'Default', title: 'Default', description: 'Best for general purpose research and brainstorming tasks.' },
    { id: 'Learning Guide', title: 'Learning Guide', description: 'Best for educational content, helping you grasp new concepts and skills efficiently.' },
    { id: 'Custom', title: 'Custom', description: 'Define a custom style for your notebook.' },
];

const lengthOptions: ResponseLength[] = ['Default', 'Longer', 'Shorter'];

const ConfigureChatModal: React.FC<ConfigureChatModalProps> = ({ isOpen, onClose, onSave, initialConfig }) => {
    const [selectedStyle, setSelectedStyle] = useState<ConversationalStyle>(initialConfig.style);
    const [selectedLength, setSelectedLength] = useState<ResponseLength>(initialConfig.length);
    const [customPrompt, setCustomPrompt] = useState(initialConfig.customPrompt || '');
    const MAX_CHARS = 500;

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ 
            style: selectedStyle, 
            length: selectedLength,
            customPrompt: selectedStyle === 'Custom' ? customPrompt : '',
        });
        onClose();
    };
    
    const selectedStyleDescription = styleOptions.find(opt => opt.id === selectedStyle)?.description || '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl" role="document" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-200">
                    <h2 className="text-xl font-medium text-gray-800">Configure Chat</h2>
                    <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    <p className="text-gray-600 text-sm">
                        Notebooks can be customized to work as a virtual research assistant, a personal tutor, a shared knowledge-base/help center, and more.
                    </p>
                    
                    {/* Conversational Style */}
                    <div>
                        <h3 className="text-base font-medium text-gray-800 mb-3">Define your conversational style</h3>
                        <div className="inline-flex items-center p-0.5 border border-gray-300 rounded-lg bg-gray-100">
                            {styleOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSelectedStyle(opt.id)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                                        selectedStyle === opt.id
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {selectedStyle === opt.id && <Check className="w-4 h-4" />}
                                    {opt.title}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-3 h-4">{selectedStyle !== 'Custom' && selectedStyleDescription}</p>
                        {selectedStyle === 'Custom' && (
                            <div className="mt-3">
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    maxLength={MAX_CHARS}
                                    placeholder={
`Examples:
* Customize the style (“respond at a PhD student level”)
* Suggest different roles (“pretend to be a role-playing game host”)`
                                    }
                                    className="w-full h-28 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y text-sm"
                                />
                                <p className="text-xs text-gray-500 text-right mt-1">{customPrompt.length} / {MAX_CHARS}</p>
                            </div>
                        )}
                    </div>

                    {/* Response Length */}
                     <div>
                        <h3 className="text-base font-medium text-gray-800 mb-3">Choose your response length</h3>
                        <div className="inline-flex items-center p-0.5 border border-gray-300 rounded-lg bg-gray-100">
                            {lengthOptions.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setSelectedLength(opt)}
                                     className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
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

                {/* Footer */}
                <div className="flex justify-end p-4 bg-white border-t border-gray-200 rounded-b-lg">
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

export default ConfigureChatModal;
