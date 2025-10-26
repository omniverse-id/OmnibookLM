import React from 'react';
import { StudioTool, Artifact, Notebook, IconName } from './types';
import { StickyNote, AudioLines, GitFork, Video, ClipboardList, Layers, HelpCircle, TrendingUp, Bot, BookOpen, FileText, Router, ScrollText } from 'lucide-react';

export const iconMap: Record<IconName, React.ElementType> = {
    TrendingUp,
    Bot,
    BookOpen,
    FileText,
    Router,
    ScrollText,
};

export const studioTools: StudioTool[] = [
    { id: 1, name: 'Audio Overview', icon: AudioLines },
    { id: 2, name: 'Video Overview', icon: Video },
    { id: 3, name: 'Mind Map', icon: GitFork },
    { id: 4, name: 'Reports', icon: ClipboardList },
    { id: 5, name: 'Flashcards', icon: Layers },
    { id: 6, name: 'Quiz', icon: HelpCircle },
];

export const artifacts: Artifact[] = [];