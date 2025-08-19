import React, { useState, useRef } from 'react';
import { generateFlowchartData } from '../services/geminiService';
import { CodeFlowchartItem, FlowchartNode, FlowchartNodeType } from '../types';
import { SitemapIcon, SparklesIcon } from './Icon';
import FlowchartDisplay from './FlowchartDisplay';

interface CodeToFlowchartProps {
  onSave: (item: CodeFlowchartItem) => void;
}

const CodeToFlowchart: React.FC<CodeToFlowchartProps> = ({ onSave }) => {
    const [code, setCode] = useState('');
    const [flowchartData, setFlowchartData] = useState<FlowchartNode[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const handleGenerate = async () => {
        if (!code.trim()) {
            setError('Please provide some source code to visualize.');
            return;
        }
        setError('');
        setIsLoading(true);
        setFlowchartData(null);
        setIsSaved(false);
        try {
            const result = await generateFlowchartData(code);
            setFlowchartData(result);
        } catch (e: any) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (flowchartData) {
            const newItem: CodeFlowchartItem = {
                id: new Date().toISOString(),
                type: 'codeFlowchart',
                flowchartData: flowchartData,
                sourceCode: code,
                timestamp: new Date().toLocaleString(),
            };
            onSave(newItem);
            setIsSaved(true);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 h-full flex flex-col">
                <div className="flex items-center mb-4">
                    <SitemapIcon className="w-6 h-6 mr-3 text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-800">Code-to-Flowchart</h2>
                </div>
                <p className="text-slate-500 mb-6">Paste your source code to convert it into a visual flowchart diagram.</p>
                
                 <div className="flex flex-col gap-4 mb-4">
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your source code here..."
                        className="w-full h-48 p-3 bg-slate-900 text-slate-100 font-mono text-sm rounded-lg border border-slate-700 resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !code}
                        className="w-full sm:w-auto self-end flex justify-center items-center px-6 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all disabled:animate-none"
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Visualizing...' : 'Generate Flowchart'}
                    </button>
                </div>

                {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}

                <div className="flex-grow bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center min-h-[300px] overflow-hidden">
                    {isLoading ? (
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-1"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-2"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-3"></div>
                            </div>
                            <p className="mt-4 text-slate-500">Generating your flowchart... this may take a minute.</p>
                        </div>
                    ) : flowchartData ? (
                        <FlowchartDisplay flowchartData={flowchartData} />
                    ) : (
                        <p className="text-slate-400 text-center">Your generated flowchart will appear here.</p>
                    )}
                </div>
                
                {flowchartData && (
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className="mt-6 w-full px-6 py-3 animated-gradient-bg-green text-white font-bold rounded-lg shadow-md disabled:bg-green-400 disabled:cursor-not-allowed transition-all disabled:animate-none"
                    >
                        {isSaved ? 'Saved to History' : 'Save Flowchart to History'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CodeToFlowchart;