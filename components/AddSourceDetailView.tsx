import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface AddSourceDetailViewProps {
    title: string;
    description: string;
    inputPlaceholder: string;
    notes: string[];
    onBack: () => void;
    onInsert: (content: string) => void;
    icon: React.ReactNode;
    isTextArea?: boolean;
}

const AddSourceDetailView: React.FC<AddSourceDetailViewProps> = ({ title, description, inputPlaceholder, notes, onBack, onInsert, icon, isTextArea = false }) => {
    const [inputValue, setInputValue] = useState('');
    const isInsertDisabled = !inputValue.trim();

    const handleInsert = () => {
        if (!isInsertDisabled) {
            onInsert(inputValue);
        }
    };

    const InputComponent = isTextArea ? 'textarea' : 'input';

    return (
        <>
            {/* Header */}
            <div className="flex items-center p-4 pl-6 border-b border-gray-200">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-medium text-gray-800">{title}</h2>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
                <p className="text-sm text-gray-600">{description}</p>
                <div className="relative">
                    <div className={`absolute left-0 pl-3 flex items-center pointer-events-none ${isTextArea ? 'items-start pt-3' : 'inset-y-0'}`}>
                        {icon}
                    </div>
                    <InputComponent
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={inputPlaceholder}
                        className={`w-full ${isTextArea ? 'h-32' : 'h-12'} pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800 resize-none text-sm`}
                        {...(isTextArea ? {rows: 4} : {type: "text"})}
                    />
                </div>
                {notes.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-800 mb-2">Notes</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {notes.map((note, index) => (
                                <li key={index} dangerouslySetInnerHTML={{ __html: note }} />
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="flex justify-end p-4 bg-white rounded-b-lg">
                <button 
                    onClick={handleInsert}
                    disabled={isInsertDisabled}
                    className="px-6 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Insert
                </button>
            </div>
        </>
    );
};

export default AddSourceDetailView;