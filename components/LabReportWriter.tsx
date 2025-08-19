import React, { useState } from 'react';
import { generateLabReport } from '../services/geminiService';
import { LabReportItem } from '../types';
import { simpleMarkdownToHtml } from '../utils/formatters';
import { FlaskConicalIcon, SparklesIcon } from './Icon';

interface LabReportWriterProps {
  onSave: (item: LabReportItem) => void;
}

const LabReportWriter: React.FC<LabReportWriterProps> = ({ onSave }) => {
    const [code, setCode] = useState('');
    const [results, setResults] = useState('');
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const handleGenerate = async () => {
        if (!code.trim() && !results.trim()) {
            setError('Please provide some code or results to generate a report.');
            return;
        }
        setError('');
        setIsLoading(true);
        setReport('');
        setIsSaved(false);
        try {
            const result = await generateLabReport(code, results);
            setReport(result);
        } catch (e: any) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (report) {
            const newItem: LabReportItem = {
                id: new Date().toISOString(),
                type: 'labReport',
                content: report,
                sourceCode: code,
                sourceResults: results,
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
                    <FlaskConicalIcon className="w-6 h-6 mr-3 text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-800">Auto-Lab Report Writer</h2>
                </div>
                <p className="text-slate-500 mb-6">Input your source code and experimental results, and the AI will format and write a formal lab report.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your source code here..."
                        className="w-full h-48 p-3 bg-slate-900 text-slate-100 font-mono text-sm rounded-lg border border-slate-700 resize-y focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <textarea
                        value={results}
                        onChange={(e) => setResults(e.target.value)}
                        placeholder="Paste your experimental results, data, or observations here..."
                        className="w-full h-48 p-3 bg-slate-50 rounded-lg border border-slate-200 resize-y focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || (!code && !results)}
                    className="w-full sm:w-auto self-end flex justify-center items-center px-6 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all disabled:animate-none mb-4"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {isLoading ? 'Writing Report...' : 'Generate Report'}
                </button>

                {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}

                <div className="flex-grow bg-slate-50 rounded-lg p-4 border border-slate-200 overflow-y-auto min-h-[200px]">
                    {isLoading && (
                        <div className="flex flex-col justify-center items-center h-full">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-1"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-2"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-3"></div>
                            </div>
                            <p className="mt-4 text-slate-500">AI is writing your lab report...</p>
                        </div>
                    )}
                    {report && (
                        <div className="prose prose-sm max-w-none text-slate-700 animate-fade-in-slide-up" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(report) }} />
                    )}
                </div>
                
                {report && (
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className="mt-6 w-full px-6 py-3 animated-gradient-bg-green text-white font-bold rounded-lg shadow-md disabled:bg-green-400 disabled:cursor-not-allowed transition-all disabled:animate-none"
                    >
                        {isSaved ? 'Saved to History' : 'Save Report to History'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default LabReportWriter;