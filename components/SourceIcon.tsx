import React from 'react';
import { SourceStatus, SourceType } from '../types';
import { Loader2, AlertCircle, Youtube, FileText, Image, File as FileIcon, Globe, AudioLines } from 'lucide-react';

interface SourceIconProps {
    type: SourceType;
    status: SourceStatus;
    sizeClass?: string;
}

export const SourceIcon: React.FC<SourceIconProps> = ({ type, status, sizeClass = 'h-5 w-5' }) => {
    if (status === SourceStatus.INDEXING) {
        return <Loader2 className={`${sizeClass} text-gray-400 animate-spin`} />;
    }
    if (status === SourceStatus.FAILED) {
        return <AlertCircle className={`${sizeClass} text-red-500`} />;
    }
    const iconMap: Record<SourceType, React.ElementType> = {
        video: Youtube,
        pdf: FileText,
        image: Image,
        file: FileIcon,
        text: FileText,
        website: Globe,
        youtube: Youtube,
        audio: AudioLines,
    };
    const Icon = iconMap[type] || FileIcon; // Fallback to FileIcon
    return <Icon className={`${sizeClass} text-gray-800`} />;
};