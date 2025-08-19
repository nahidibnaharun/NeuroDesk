import React, { useState } from 'react';
import { generateSummary } from '../services/geminiService';
import { SummaryItem } from '../types';
import { FileTextIcon, SparklesIcon } from './Icon';
import { simpleMarkdownToHtml } from '../utils/formatters';

interface SummaryGeneratorProps {
  onSave: (item: SummaryItem) => void;
  studyContent: string;
}

const SummaryGenerator: React.FC<SummaryGeneratorProps> = ({ onSave, studyContent }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateSummary = async () => {
    if (!studyContent.trim()) {
      setError('Please provide some text to summarize.');
      return;
    }
    setError('');
    setIsLoading(true);
    setSummary('');
    try {
      const result = await generateSummary(studyContent);
      setSummary(result);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (summary) {
      const newItem: SummaryItem = {
        id: new Date().toISOString(),
        type: 'summary',
        content: summary,
        sourceContent: studyContent,
        timestamp: new Date().toLocaleString(),
      };
      onSave(newItem);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 h-full flex flex-col">
      <div className="flex items-center mb-4">
        <FileTextIcon className="w-6 h-6 mr-3 text-indigo-500" />
        <h2 className="text-xl font-bold text-slate-800">Summary Generator</h2>
      </div>
      <p className="text-slate-500 mb-6">Get key points and structured notes from your study material instantly.</p>
      
      <button
        onClick={handleGenerateSummary}
        disabled={isLoading || !studyContent}
        className="w-full flex justify-center items-center px-6 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-100 disabled:animate-none"
      >
        <SparklesIcon className="w-5 h-5 mr-2" />
        {isLoading ? 'Summarizing...' : 'Generate Summary'}
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
            <p className="mt-4 text-slate-500">AI is summarizing your text...</p>
          </div>
        )}
        {summary ? (
          <div className="prose prose-sm max-w-none text-slate-700 animate-zoom-in-fade" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(summary) }} />
        ) : (
          !isLoading && <p className="text-slate-400 text-center mt-8">Your generated summary will appear here.</p>
        )}
      </div>

      {summary && (
        <button
          onClick={handleSave}
          className="mt-6 w-full px-6 py-3 animated-gradient-bg-green text-white font-bold rounded-lg shadow-md transition-all hover:scale-105 active:scale-100"
        >
          Save Summary to History
        </button>
      )}
    </div>
  );
};

export default SummaryGenerator;