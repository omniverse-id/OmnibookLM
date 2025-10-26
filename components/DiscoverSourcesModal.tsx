import React, { useState } from 'react';
import { X, Wand2, WandSparkles } from 'lucide-react';

interface DiscoverSourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DiscoverSourcesModal: React.FC<DiscoverSourcesModalProps> = ({ isOpen, onClose }) => {
    const [topic, setTopic] = useState('');
    const [sourceFrom, setSourceFrom] = useState<'web' | 'drive'>('web');

    if (!isOpen) return null;

    const isSubmitDisabled = !topic.trim();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" role="document" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-200">
                    <h2 className="text-xl font-medium text-gray-800">Discover sources</h2>
                    <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
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
                    <div className="mt-6 text-left w-full">
                        <p className="text-sm font-medium text-gray-700 mb-3">Find sources from:</p>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="sourceFrom"
                                    value="web"
                                    checked={sourceFrom === 'web'}
                                    onChange={() => setSourceFrom('web')}
                                    className="h-4 w-4 text-gray-800 focus:ring-gray-400 accent-gray-800 border-gray-400"
                                />
                                <span className="ml-3 text-sm text-gray-800">Web</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="sourceFrom"
                                    value="drive"
                                    checked={sourceFrom === 'drive'}
                                    onChange={() => setSourceFrom('drive')}
                                    className="h-4 w-4 text-gray-800 focus:ring-gray-400 accent-gray-800 border-gray-400"
                                />
                                <span className="ml-3 text-sm text-gray-800">Google Drive</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-3 p-4 bg-white rounded-b-lg">
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium text-sm rounded-lg hover:bg-blue-100 focus:outline-none transition-colors">
                        <Wand2 className="h-4 w-4" />
                        I'm feeling curious
                    </button>
                    <button
                        disabled={isSubmitDisabled}
                        className="px-6 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiscoverSourcesModal;