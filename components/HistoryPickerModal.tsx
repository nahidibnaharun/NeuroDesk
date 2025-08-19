import React, { useState, useMemo } from 'react';
import { HistoryItem, RoadmapNode } from '../types';
import {
    CheckSquareIcon, FileTextIcon, NeuronIcon, FlaskConicalIcon,
    CodeIcon, RouteIcon, SitemapIcon, MessageCircleIcon, XIcon,
    Volume2Icon
} from './Icon';

const typeToIcon: { [key in HistoryItem['type']]: React.ReactNode } = {
    quiz: <CheckSquareIcon className="w-5 h-5 text-indigo-500"/>,
    summary: <FileTextIcon className="w-5 h-5 text-blue-500"/>,
    diagram: <NeuronIcon className="w-5 h-5 text-purple-500"/>,
    labReport: <FlaskConicalIcon className="w-5 h-5 text-teal-500"/>,
    codeExplanation: <CodeIcon className="w-5 h-5 text-gray-600"/>,
    roadmap: <RouteIcon className="w-5 h-5 text-orange-500"/>,
    codeFlowchart: <SitemapIcon className="w-5 h-5 text-green-500"/>,
    chat: <MessageCircleIcon className="w-5 h-5 text-pink-500"/>,
    audioSummary: <Volume2Icon className="w-5 h-5 text-sky-500"/>,
};

const getHistoryItemTitle = (item: HistoryItem): string => {
    switch (item.type) {
        case 'quiz': return `Quiz - ${item.result.score}/${item.result.total} in ${item.result.mode} mode`;
        case 'summary': return `Summary of "${item.sourceContent.substring(0, 40)}..."`;
        case 'diagram': return `Diagram: "${item.prompt}"`;
        case 'labReport': return `Lab Report`;
        case 'codeExplanation': return `Code Explanation`;
        case 'roadmap': return `Roadmap for "${item.sourceContent.substring(0, 40)}..."`;
        case 'codeFlowchart': return `Flowchart for code`;
        case 'chat': return `Chat starting with "${item.messages[0]?.content.substring(0, 40)}..."`;
        case 'audioSummary': return `Audio Summary of "${item.sourceContent.substring(0, 40)}..."`;
        default: {
            // This is an exhaustive check. If a new HistoryItem type is added,
            // TypeScript will throw a compile error here, forcing us to handle the new case.
            const _exhaustiveCheck: never = item;
            return 'Unknown Item';
        }
    }
};


const HistoryItemRow: React.FC<{ item: HistoryItem, isSelected: boolean, onToggle: (id: string) => void }> = ({ item, isSelected, onToggle }) => {
    return (
        <div
            onClick={() => onToggle(item.id)}
            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected ? 'bg-indigo-100 border-indigo-300' : 'hover:bg-slate-100 border-transparent'
            } border`}
        >
            <div className="flex-shrink-0">
                 {isSelected ? (
                    <CheckSquareIcon className="w-5 h-5 text-indigo-600" />
                ) : (
                    <div className="w-5 h-5 border-2 border-slate-300 rounded-md bg-white"></div>
                )}
            </div>
            <div className="flex-shrink-0">{typeToIcon[item.type]}</div>
            <div className="flex-grow overflow-hidden">
                <p className="font-medium text-sm text-slate-800 truncate">{getHistoryItemTitle(item)}</p>
                <p className="text-xs text-slate-500">{item.timestamp}</p>
            </div>
        </div>
    );
};

interface HistoryPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmSelection: (selectedItems: HistoryItem[]) => void;
    history: HistoryItem[];
    selectionMode?: 'single' | 'multiple';
    filterByType?: HistoryItem['type'];
    confirmButtonText?: string;
}

const HistoryPickerModal: React.FC<HistoryPickerModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirmSelection, 
    history, 
    selectionMode = 'multiple', 
    filterByType,
    confirmButtonText = 'Confirm Selection'
}) => {
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [searchTerm, setSearchTerm] = useState('');

    const handleToggle = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (selectionMode === 'single') {
                newSet.clear();
                newSet.add(id);
                return newSet;
            }
            // Multiple selection logic
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        const selectedItems = history.filter(item => selectedIds.has(item.id));
        onConfirmSelection(selectedItems);
        onClose();
    };
    
    // Clear selection when modal is closed
    React.useEffect(() => {
        if (!isOpen) {
            setSelectedIds(new Set());
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredHistory = useMemo(() => {
        let items = history;
        if (filterByType) {
            items = items.filter(item => item.type === filterByType);
        }
        if (!searchTerm) return items;
        const lowercasedFilter = searchTerm.toLowerCase();
        return items.filter(item => getHistoryItemTitle(item).toLowerCase().includes(lowercasedFilter));
    }, [history, searchTerm, filterByType]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col p-6 animate-fade-in-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Select from History</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
                        <XIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search history..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 mb-4 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />

                <div className="flex-grow overflow-y-auto space-y-2 border-y border-slate-200 -mx-6 px-6 py-2">
                    {filteredHistory.length > 0 ? (
                        [...filteredHistory].reverse().map(item => (
                            <HistoryItemRow 
                                key={item.id} 
                                item={item} 
                                isSelected={selectedIds.has(item.id)} 
                                onToggle={handleToggle}
                            />
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-8">No history items found.</p>
                    )}
                </div>

                <div className="flex justify-end items-center gap-4 pt-4 mt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className="px-6 py-2 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all disabled:animate-none"
                    >
                        {selectionMode === 'multiple' ? `${confirmButtonText} (${selectedIds.size})` : confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryPickerModal;