import React, { useCallback, useRef, useState } from 'react';
import { X, Upload, FileSearch, Database, Link as LinkIcon, Clipboard, Globe, Youtube as YoutubeIconLucide } from 'lucide-react';
import AddSourceDetailView from './AddSourceDetailView';

// A simple placeholder for the Google icon
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.35 11.1H12.18V13.83H18.69C18.36 17.64 15.19 19.27 12.19 19.27C8.36 19.27 5.03 16.25 5.03 12.55C5.03 8.85 8.36 5.83 12.19 5.83C14.27 5.83 15.94 6.57 17.24 7.74L19.34 5.64C17.22 3.79 14.82 2.77 12.19 2.77C6.86 2.77 2.68 7.38 2.68 12.55C2.68 17.72 6.86 22.33 12.19 22.33C17.58 22.33 21.5 18.29 21.5 12.78C21.5 12.19 21.45 11.64 21.35 11.1Z" fill="#4285F4"/>
    </svg>
);

// A simple placeholder for the YouTube icon
const YouTubeIcon = () => (
     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.582,6.186 C21.326,5.283 20.62,4.577 19.717,4.32 C18.006,3.875 12,3.875 12,3.875 C12,3.875 5.994,3.875 4.283,4.32 C3.38,4.577 2.674,5.283 2.418,6.186 C1.974,7.897 1.974,12 1.974,12 C1.974,12 1.974,16.103 2.418,17.814 C2.674,18.717 3.38,19.423 4.283,19.68 C5.994,20.125 12,20.125 12,20.125 C12,20.125 18.006,20.125 19.717,19.68 C20.62,19.423 21.326,18.717 21.582,17.814 C22.026,16.103 22.026,12 22.026,12 C22.026,12 22.026,7.897 21.582,6.186 Z M9.933,15.008 L9.933,8.992 L15.437,12 L9.933,15.008 Z" fill="#FF0000"/>
    </svg>
);


interface AddSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFileUpload: (files: FileList) => void;
    onAddTextSource: (content: string, type: 'website' | 'youtube' | 'text') => void;
    onDiscoverSource: () => void;
    sourceCount: number;
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({ isOpen, onClose, onFileUpload, onAddTextSource, onDiscoverSource, sourceCount }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_SOURCES = 300;
    const [currentView, setCurrentView] = useState<'main' | 'youtube' | 'website' | 'text'>('main');

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFileUpload(files);
            handleCloseModal();
        }
    }, [onFileUpload]);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileUpload(files);
            handleCloseModal();
        }
    }

    const handleChooseFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleInsertSource = (content: string) => {
        if (currentView === 'main') return;
        onAddTextSource(content, currentView);
        handleCloseModal();
    };
    
    const handleCloseModal = () => {
        // Reset view to main when closing
        setTimeout(() => setCurrentView('main'), 300); // Delay reset to allow for closing animation
        onClose();
    };


    if (!isOpen) return null;

    const renderMainView = () => (
         <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 pl-6 border-b border-gray-200">
                <div>
                    <h2 className="text-xl font-medium text-gray-800">Add sources</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onDiscoverSource} className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                        <FileSearch className="h-4 w-4" />
                        Discover sources
                    </button>
                     <button onClick={handleCloseModal} aria-label="Close modal" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
                <p className="text-sm text-gray-600 max-w-2xl">
                    Sources let OmnibookLM base its responses on the information that matters most to you.
                    (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
                </p>

                <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                >
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                    <h3 className="text-base font-medium text-gray-800">Upload sources</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Drag & drop or <button onClick={handleChooseFileClick} className="font-medium text-gray-800 hover:underline focus:outline-none">choose file</button> to upload
                    </p>
                    <p className="text-xs text-gray-400 mt-4">
                        Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Google Workspace */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <GoogleIcon />
                            <h4 className="font-medium text-sm text-gray-800">Google Workspace</h4>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                            <img src="https://www.gstatic.com/images/branding/product/2x/drive_32dp.png" alt="Google Drive" className="w-5 h-5" />
                            Google Drive
                        </button>
                    </div>
                    {/* Link */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <LinkIcon className="w-4 h-4 text-gray-700" />
                            <h4 className="font-medium text-sm text-gray-800">Link</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setCurrentView('website')} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                               <Globe className="w-4 h-4" /> Website
                            </button>
                            <button onClick={() => setCurrentView('youtube')} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                                <YouTubeIcon /> YouTube
                            </button>
                        </div>
                    </div>
                    {/* Paste text */}
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <Clipboard className="w-4 h-4 text-gray-700" />
                            <h4 className="font-medium text-sm text-gray-800">Paste text</h4>
                        </div>
                        <button onClick={() => setCurrentView('text')} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
                            <Clipboard className="w-4 h-4" /> Copied text
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-b-lg">
                <Database className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Source limit</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-800 h-2 rounded-full" style={{ width: `${(sourceCount / MAX_SOURCES) * 100}%` }}></div>
                </div>
                <span className="text-sm text-gray-600">{sourceCount} / {MAX_SOURCES}</span>
            </div>
        </>
    );

     const renderDetailView = () => {
        switch (currentView) {
            case 'youtube':
                return <AddSourceDetailView 
                    title="YouTube URL"
                    description="Paste in a YouTube URL below to upload as a source in OmnibookLM."
                    inputPlaceholder="Paste YouTube URL *"
                    notes={[
                        'The AI will analyze the video and audio content of the YouTube video.',
                        'Only public YouTube videos are supported',
                        'Recently uploaded videos may not be available to import',
                        'If upload fails, <a href="#" class="underline">learn more</a> for common reasons.'
                    ]}
                    onBack={() => setCurrentView('main')}
                    onInsert={handleInsertSource}
                    icon={<YoutubeIconLucide className="w-4 h-4 text-gray-400" />}
                />;
            case 'website':
                return <AddSourceDetailView 
                    title="Website URLs"
                    description="Paste in Web URLs below to upload as sources in OmnibookLM."
                    inputPlaceholder="Paste URLs *"
                    notes={[
                        'To add multiple URLs, separate with a space or new line.',
                        'Only the visible text on the website will be imported.',
                        'Paid articles are not supported.'
                    ]}
                    onBack={() => setCurrentView('main')}
                    onInsert={handleInsertSource}
                    icon={<Globe className="w-4 h-4 text-gray-400" />}
                    isTextArea={true}
                />;
            case 'text':
                return <AddSourceDetailView 
                    title="Paste copied text"
                    description="Paste your copied text below to upload as a source in OmnibookLM."
                    inputPlaceholder="Paste text here *"
                    notes={[]}
                    onBack={() => setCurrentView('main')}
                    onInsert={handleInsertSource}
                    icon={<Clipboard className="w-4 h-4 text-gray-400" />}
                    isTextArea={true}
                />;
            default:
                return null;
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={handleCloseModal}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" role="document" onClick={(e) => e.stopPropagation()}>
                {/* Hidden file input placed inside the inner container so its programmatic click won't bubble
                    to the overlay and close the modal before the change event fires. */}
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileSelect}
                    accept="application/pdf,text/plain,text/markdown,audio/*,image/*"
                />
                {currentView === 'main' ? renderMainView() : renderDetailView()}
            </div>
        </div>
    );
};

export default AddSourceModal;