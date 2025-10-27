import React, { useState } from 'react';
import { X, Layers, Check } from 'lucide-react';

interface FlashcardsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type CardCount = 'Fewer' | 'Standard' | 'More';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ isOpen, onClose }) => {
    const [cardCount, setCardCount] = useState<CardCount>('Standard');
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    
    if (!isOpen) return null;

    const cardCountOptions: CardCount[] = ['Fewer', 'Standard', 'More'];
    const difficultyOptions: Difficulty[] = ['Easy', 'Medium', 'Hard'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl" role="document" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Layers className="h-6 w-6 text-gray-700" />
                        <h2 className="text-xl font-medium text-gray-800">Customize Flashcards</h2>
                    </div>
                    <button onClick={onClose} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Number of Cards */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Cards</label>
                            <div className="inline-flex items-center p-0.5 border border-gray-300 rounded-lg bg-gray-100">
                                {cardCountOptions.map(opt => (
                                     <button
                                        key={opt}
                                        onClick={() => setCardCount(opt)}
                                        className={`flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            cardCount === opt
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-transparent text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {cardCount === opt && <Check className="w-4 h-4" />}
                                        {opt}{opt === 'Standard' && ' (Default)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Level of Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Level of Difficulty</label>
                            <div className="inline-flex items-center p-0.5 border border-gray-300 rounded-lg bg-gray-100">
                                {difficultyOptions.map(opt => (
                                     <button
                                        key={opt}
                                        onClick={() => setDifficulty(opt)}
                                        className={`flex items-center gap-1 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                            difficulty === opt
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-transparent text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {difficulty === opt && <Check className="w-4 h-4" />}
                                        {opt}{opt === 'Medium' && ' (Default)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Topic Section */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">What should the topic be?</label>
                         <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <p className="text-sm font-medium text-gray-800 mb-2">Things to try</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                <li>The flashcards must be restricted to a specific source (e.g. "the article about Italy")</li>
                                <li>The flashcards must focus on a specific topic like "Newton's second law"</li>
                                <li>The card fronts must be short (1-5 words) for memorization</li>
                            </ul>
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 bg-white rounded-b-lg border-t border-gray-200">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                        Generate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlashcardsModal;
