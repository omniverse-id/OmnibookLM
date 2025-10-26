import React from 'react';
import { Artifact } from '../types';
import { ChevronRight, Minimize2 } from 'lucide-react';
import NoteContentView from './NoteContentView';

const NoteDetailView: React.FC<{ artifact: Artifact; onBack: () => void; onDelete: (artifact: Artifact) => void; }> = ({ artifact, onBack, onDelete }) => {
    
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-[48px] border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center text-sm">
                    <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium">Studio</button>
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                    <span className="text-gray-800 font-medium">Note</span>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={onBack}
                        title="Close note" 
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <Minimize2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto sidebar-scroll p-4 space-y-4">
                <h1 className="text-xl font-medium text-gray-800">{artifact.title}</h1>
                <p className="text-sm text-gray-500">(Saved responses are view only)</p>
                <div className="border-t border-gray-200 my-4"></div>
                <NoteContentView artifact={artifact} />
            </div>

             {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
                 <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 h-10 text-sm font-medium text-gray-700 hover:bg-[#f8f8f7] transition-colors whitespace-nowrap">
                    Convert to source
                </button>
            </div>
        </div>
    );
};

export default NoteDetailView;