import React, { useState, useEffect, useCallback } from 'react';
import { generateRoadmap } from '../services/geminiService';
import { RoadmapItem, RoadmapNode, AIGeneratedRoadmapNode, NodeStatus } from '../types';
import { RouteIcon, SparklesIcon, SaveIcon, CircleIcon, CircleDotIcon, CheckCircle2Icon, MessageCircleIcon } from './Icon';

interface RoadmapGeneratorProps {
    studyContent: string;
    onSave: (item: RoadmapItem) => void;
    initialRoadmap: RoadmapItem | null;
    onSessionEnd: () => void;
}

const addStateToNodes = (nodes: AIGeneratedRoadmapNode[]): RoadmapNode[] => {
    return nodes.map(node => ({
        ...node,
        id: crypto.randomUUID(),
        status: NodeStatus.NotStarted,
        notes: '',
        isExpanded: false, // Collapsed by default
        subNodes: node.subNodes ? addStateToNodes(node.subNodes) : [],
    }));
};

const updateNodeInTree = (nodes: RoadmapNode[], nodeId: string, updates: Partial<RoadmapNode>): RoadmapNode[] => {
    return nodes.map(node => {
        if (node.id === nodeId) {
            return { ...node, ...updates };
        }
        if (node.subNodes && node.subNodes.length > 0) {
            return { ...node, subNodes: updateNodeInTree(node.subNodes, nodeId, updates) };
        }
        return node;
    });
};

const synchronizeParentStatuses = (nodes: RoadmapNode[]): RoadmapNode[] => {
    return nodes.map(node => {
        if (!node.subNodes || node.subNodes.length === 0) {
            return node;
        }

        const updatedSubNodes = synchronizeParentStatuses(node.subNodes);
        
        const allChildrenCompleted = updatedSubNodes.every(sn => sn.status === NodeStatus.Completed);
        const someChildrenStarted = updatedSubNodes.some(sn => sn.status !== NodeStatus.NotStarted);

        let newStatus = node.status;
        if (allChildrenCompleted) {
            newStatus = NodeStatus.Completed;
        } else if (someChildrenStarted) {
            newStatus = NodeStatus.InProgress;
        } else {
            newStatus = NodeStatus.NotStarted;
        }
        
        return { ...node, status: newStatus, subNodes: updatedSubNodes };
    });
};


const StatusIconButton: React.FC<{
    status: NodeStatus;
    nodeStatus: NodeStatus;
    onClick: () => void;
    title: string;
    icon: React.ReactNode;
}> = ({ status, nodeStatus, onClick, title, icon }) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded-full transition-all duration-200 transform hover:scale-125 ${
            nodeStatus === status ? 'bg-indigo-100' : 'hover:bg-slate-200'
        }`}
    >
        {icon}
    </button>
);


const RoadmapNodeComponent: React.FC<{ node: RoadmapNode; onUpdate: (id: string, updates: Partial<RoadmapNode>) => void; level: number }> = ({ node, onUpdate, level }) => {
    const [showNotes, setShowNotes] = useState(false);
    
    const statusClasses = {
        [NodeStatus.NotStarted]: 'border-slate-300 bg-white hover:shadow-md',
        [NodeStatus.InProgress]: 'border-amber-400 bg-amber-50 hover:shadow-lg',
        [NodeStatus.Completed]: 'border-green-400 bg-green-50 hover:shadow-lg',
    };

    return (
        <div className="relative pl-8 my-1">
            {/* Connecting Lines */}
            <div className="absolute left-3 top-0 w-0.5 h-full bg-slate-200"></div>
            <div className="absolute left-3 top-5 w-5 h-0.5 bg-slate-200"></div>
            
            <div className={`border-l-4 rounded-r-lg shadow-sm transition-all duration-300 ${statusClasses[node.status]}`}>
                 <div className="p-3">
                    <div className="flex items-start justify-between cursor-pointer" onClick={() => onUpdate(node.id, { isExpanded: !node.isExpanded })}>
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                                {node.status === NodeStatus.Completed ? (
                                    <CheckCircle2Icon className="w-5 h-5 text-green-500" />
                                ) : node.status === NodeStatus.InProgress ? (
                                    <CircleDotIcon className="w-5 h-5 text-amber-500 animate-pulse" />
                                ) : (
                                    <CircleIcon className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                            <div>
                                <h3 className={`font-bold text-slate-800 transition-colors ${node.status === NodeStatus.Completed ? 'line-through text-slate-500' : ''}`}>{node.title}</h3>
                                <p className="text-sm text-slate-600 mt-1">{node.description}</p>
                            </div>
                        </div>
                        <div className="p-1 text-slate-400 hover:text-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${node.isExpanded ? 'rotate-90' : ''}`}><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateRows: node.isExpanded ? '1fr' : '0fr', transition: 'grid-template-rows 0.4s ease-in-out' }}>
                    <div className="overflow-hidden">
                        <div className="mt-2 pt-3 border-t border-slate-200/80 px-3 pb-3">
                             {node.resources && node.resources.length > 0 && (
                                <div className="mb-3">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Resources</h4>
                                    <ul className="list-disc list-inside text-sm text-indigo-700 space-y-1">
                                        {node.resources.map((res, i) => <li key={i}>{res}</li>)}
                                    </ul>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                                <StatusIconButton
                                    status={NodeStatus.NotStarted} nodeStatus={node.status}
                                    onClick={() => onUpdate(node.id, { status: NodeStatus.NotStarted })} title="Mark as Not Started"
                                    icon={<CircleIcon className="w-5 h-5 text-slate-400" />} />
                                <StatusIconButton
                                    status={NodeStatus.InProgress} nodeStatus={node.status}
                                    onClick={() => onUpdate(node.id, { status: NodeStatus.InProgress })} title="Mark as In Progress"
                                    icon={<CircleDotIcon className="w-5 h-5 text-amber-500" />} />
                                <StatusIconButton
                                    status={NodeStatus.Completed} nodeStatus={node.status}
                                    onClick={() => onUpdate(node.id, { status: NodeStatus.Completed })} title="Mark as Completed"
                                    icon={<CheckCircle2Icon className="w-5 h-5 text-green-500" />} />

                                 <button onClick={() => setShowNotes(!showNotes)} className="ml-auto flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border bg-white hover:bg-slate-100 border-slate-300 text-slate-600">
                                    <MessageCircleIcon className="w-3 h-3" />
                                    {showNotes ? 'Hide Notes' : 'Notes'}
                                </button>
                            </div>
                            {showNotes && (
                                <textarea
                                    value={node.notes}
                                    onChange={(e) => onUpdate(node.id, { notes: e.target.value })}
                                    placeholder="Your notes here..."
                                    className="w-full h-20 p-2 mt-2 text-sm bg-white rounded border border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 animate-fade-in-slide-up"
                                />
                            )}
                            {node.subNodes && node.subNodes.length > 0 && (
                                <div className="mt-4">
                                    {node.subNodes.map(subNode => <RoadmapNodeComponent key={subNode.id} node={subNode} onUpdate={onUpdate} level={level + 1} />)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RoadmapGenerator: React.FC<RoadmapGeneratorProps> = ({ studyContent, onSave, initialRoadmap, onSessionEnd }) => {
    const [roadmap, setRoadmap] = useState<RoadmapNode[] | null>(initialRoadmap ? initialRoadmap.nodes : null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(true);
    
    // Generation settings
    const [topicInput, setTopicInput] = useState('');
    const [includeStudyMaterial, setIncludeStudyMaterial] = useState(true);
    
    useEffect(() => {
        // Load initial roadmap from history if provided
        if (initialRoadmap) {
            setRoadmap(initialRoadmap.nodes);
            setTopicInput(initialRoadmap.sourceContent.split('\n')[0].substring(0, 50)); // Crude way to get topic from old source
        }
        // Clear session when component unmounts
        return () => {
            onSessionEnd();
        }
    }, [initialRoadmap, onSessionEnd]);

    const handleGenerate = async () => {
        if (!studyContent.trim() && !topicInput.trim()) {
            setError('Please provide a topic or some study material on the dashboard.');
            return;
        }
        setError('');
        setIsLoading(true);
        setRoadmap(null);
        setIsSaved(false);
        try {
            const content = includeStudyMaterial ? studyContent : undefined;
            const result = await generateRoadmap(content, topicInput);
            setRoadmap(addStateToNodes(result));
        } catch (e: any) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (studyContent.trim() || topicInput.trim()){
            setError('');
        }
    }, [studyContent, topicInput]);

    const handleUpdateNode = useCallback((nodeId: string, updates: Partial<RoadmapNode>) => {
        setRoadmap(currentRoadmap => {
            if (!currentRoadmap) return null;
            const directlyUpdatedTree = updateNodeInTree(currentRoadmap, nodeId, updates);
            return synchronizeParentStatuses(directlyUpdatedTree);
        });
        setIsSaved(false);
    }, []);

    const handleSave = () => {
        if (roadmap) {
            const itemToSave: RoadmapItem = initialRoadmap 
                ? { ...initialRoadmap, nodes: roadmap, timestamp: new Date().toLocaleString() } 
                : {
                    id: new Date().toISOString(),
                    type: 'roadmap',
                    nodes: roadmap,
                    sourceContent: topicInput || studyContent, // Prioritize topic input for title
                    timestamp: new Date().toLocaleString(),
                  };
            onSave(itemToSave);
            setIsSaved(true);
        }
    };

    const isGenerateDisabled = isLoading || (!studyContent.trim() && !topicInput.trim());

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 h-full flex flex-col">
                <div className="flex items-center mb-4">
                    <RouteIcon className="w-6 h-6 mr-3 text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-800">AI Learning Roadmap</h2>
                </div>
                <p className="text-slate-500 mb-6">Enter a topic or use your study material to generate a step-by-step learning plan. Track your progress as you go!</p>
                
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-4 space-y-3">
                     <input 
                        type="text" 
                        value={topicInput}
                        onChange={e => setTopicInput(e.target.value)}
                        placeholder="Enter a skill or topic (e.g., 'React Hooks')"
                        className="w-full p-2.5 rounded-md border-2 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <label className="flex items-center text-sm text-slate-600 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={includeStudyMaterial}
                            onChange={e => setIncludeStudyMaterial(e.target.checked)}
                            disabled={!studyContent.trim() || isLoading}
                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-2">Use study material for context</span>
                        {!studyContent.trim() && <span className="ml-2 text-xs text-slate-400">(add material on Dashboard)</span>}
                    </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className="w-full flex justify-center items-center px-6 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all disabled:animate-none"
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Generating...' : (roadmap ? 'Regenerate Roadmap' : 'Generate Roadmap')}
                    </button>
                    {roadmap && (
                        <button
                            onClick={handleSave}
                            disabled={isSaved}
                            className="w-full px-6 py-3 animated-gradient-bg-green text-white font-bold rounded-lg shadow-md disabled:bg-green-400 disabled:cursor-not-allowed transition-all disabled:animate-none"
                        >
                            <SaveIcon className="w-5 h-5 mr-2" />
                            {isSaved ? 'Progress Saved' : 'Save Progress'}
                        </button>
                    )}
                </div>

                {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}

                <div className="flex-grow bg-slate-50 rounded-lg p-2 sm:p-4 border border-slate-200 overflow-y-auto min-h-[200px]">
                    {isLoading && (
                        <div className="flex flex-col justify-center items-center h-full">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-1"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-2"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-3"></div>
                            </div>
                            <p className="mt-4 text-slate-500">AI is crafting your study plan...</p>
                        </div>
                    )}
                    {roadmap ? (
                        <div className="animate-fade-in-slide-up">
                            {roadmap.map(node => <RoadmapNodeComponent key={node.id} node={node} onUpdate={handleUpdateNode} level={0} />)}
                        </div>
                    ) : (
                        !isLoading && <p className="text-slate-400 text-center mt-8">Your personalized learning roadmap will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoadmapGenerator;