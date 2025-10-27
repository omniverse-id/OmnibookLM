import React from 'react';
import { Upload } from 'lucide-react';

interface WelcomeMessageProps {
    totalSourcesCount: number;
    onAddSource: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ totalSourcesCount, onAddSource }) => {
    if (totalSourcesCount === 0) {
        return (
            <div className="max-w-5xl w-full text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-medium text-gray-800 mb-4">Add a source to get started</h1>
                <button 
                    onClick={onAddSource}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Upload a source
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-5xl w-full text-center flex flex-col items-center">
            <h1 className="text-4xl font-normal text-gray-800 mb-3">Hi, Guest</h1>
            <p className="text-xl text-gray-500">Let's Learn Together</p>
        </div>
    );
};

export default WelcomeMessage;