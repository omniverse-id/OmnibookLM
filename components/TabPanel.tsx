import React from 'react';

type ActiveTab = 'sources' | 'chat' | 'studio';

interface TabPanelProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
}

const TabPanel: React.FC<TabPanelProps> = ({ activeTab, onTabChange }) => {
    const tabs: { id: ActiveTab; label: string }[] = [
        { id: 'sources', label: 'Sources' },
        { id: 'chat', label: 'Chat' },
        { id: 'studio', label: 'Studio' },
    ];

    return (
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
            <nav className="flex justify-around">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative py-3 px-4 text-center text-sm font-medium transition-colors focus:outline-none ${
                            activeTab === tab.id
                                ? 'text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 rounded-full" />
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default TabPanel;