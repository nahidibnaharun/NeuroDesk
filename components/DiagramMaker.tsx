import React, { useState } from 'react';
import { generateDiagram } from '../services/geminiService';
import { DiagramItem } from '../types';
import { NeuronIcon, SparklesIcon } from './Icon';

interface DiagramMakerProps {
  onSave: (item: DiagramItem) => void;
}

const DiagramMaker: React.FC<DiagramMakerProps> = ({ onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerateDiagram = async () => {
    if (!prompt.trim()) {
      setError('Please describe the diagram you want to create.');
      return;
    }
    setError('');
    setIsLoading(true);
    setImageUrl('');
    setIsSaved(false);
    try {
      const result = await generateDiagram(prompt);
      setImageUrl(result);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (imageUrl) {
      const newItem: DiagramItem = {
        id: new Date().toISOString(),
        type: 'diagram',
        prompt: prompt,
        imageUrl: imageUrl,
        timestamp: new Date().toLocaleString(),
      };
      onSave(newItem);
      setIsSaved(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 h-full flex flex-col">
      <div className="flex items-center mb-4">
        <NeuronIcon className="w-6 h-6 mr-3 text-indigo-500" />
        <h2 className="text-xl font-bold text-slate-800">AI Diagram Maker</h2>
      </div>
      <p className="text-slate-500 mb-4">Turn text into flowcharts, mind maps, and more. Describe your concept below.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., a mind map of the water cycle"
          className="flex-grow p-3 rounded-lg border-2 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
          disabled={isLoading}
        />
        <button
          onClick={handleGenerateDiagram}
          disabled={isLoading || !prompt}
          className="flex justify-center items-center px-6 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-100 disabled:animate-none"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          {isLoading ? 'Visualizing...' : 'Generate'}
        </button>
      </div>

      {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}

      <div className="flex-grow bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center p-4 min-h-[200px]">
        {isLoading ? (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-1"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-2"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-3"></div>
            </div>
            <p className="mt-4 text-slate-500">Generating your diagram... this may take a moment.</p>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={prompt} className="max-w-full max-h-full object-contain rounded-md bg-white animate-zoom-in-fade" />
        ) : (
          <p className="text-slate-400 text-center">Your generated diagram will appear here.</p>
        )}
      </div>

      {imageUrl && (
        <button
          onClick={handleSave}
          disabled={isSaved}
          className="mt-6 w-full px-6 py-3 animated-gradient-bg-green text-white font-bold rounded-lg shadow-md disabled:bg-green-400 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-100 disabled:animate-none"
        >
          {isSaved ? 'Saved to History' : 'Save Diagram to History'}
        </button>
      )}
    </div>
  );
};

export default DiagramMaker;