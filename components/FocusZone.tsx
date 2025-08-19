import React, { useState } from 'react';
import { QuizHistoryItem, WeakAreaAnalysis } from '../types';
import { analyzeWeakAreas } from '../services/geminiService';
import { TargetIcon, SparklesIcon } from './Icon';

const FocusZone: React.FC<{
    history: QuizHistoryItem[];
    onStartPractice: (topic: string) => void;
    onShowReport: (analysis: WeakAreaAnalysis) => void;
}> = ({ history, onStartPractice, onShowReport }) => {
    const [analysis, setAnalysis] = useState<WeakAreaAnalysis | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleAnalyze = async () => {
        setStatus('loading');
        try {
            const result = await analyzeWeakAreas(history);
            setAnalysis(result);
            setStatus('success');
        } catch (error) {
            console.error("Failed to analyze weak areas:", error);
            setAnalysis({ weakAreas: [], message: "Could not analyze performance at this time." });
            setStatus('error');
        }
    };

    const renderInnerContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center text-slate-500 py-8">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full dot-1"></div>
                            <div className="w-3 h-3 bg-indigo-500 rounded-full dot-2"></div>
                            <div className="w-3 h-3 bg-indigo-500 rounded-full dot-3"></div>
                        </div>
                        <p className="mt-4">Analyzing your performance...</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center text-red-500 py-8">
                        <p>{analysis?.message || "Could not analyze performance at this time."}</p>
                        <button onClick={() => setStatus('idle')} className="mt-4 px-4 py-1 text-sm text-indigo-600 font-medium hover:bg-indigo-100 rounded-full">Try Again</button>
                    </div>
                );
            case 'success':
                if (!analysis) return null;
                return (
                    <div className="animate-fade-in-slide-up text-center">
                        <p className="text-slate-500 mb-4">{analysis.message}</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {analysis.weakAreas.length > 0 && analysis.weakAreas.map((topic, index) => (
                                <button
                                    key={index}
                                    onClick={() => onStartPractice(topic)}
                                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full hover:bg-indigo-200 transition-all hover:scale-105 active:scale-100"
                                >
                                    Practice: {topic}
                                </button>
                            ))}
                             <button
                                onClick={() => onShowReport(analysis)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full hover:bg-green-200 transition-all hover:scale-105 active:scale-100"
                            >
                                View Report Card
                            </button>
                        </div>
                    </div>
                );
            case 'idle':
            default:
                return (
                     <div className="text-center">
                        <p className="text-slate-500 mb-4">Get a personalized focus plan based on your quiz history.</p>
                        <button
                            onClick={handleAnalyze}
                            disabled={history.length === 0}
                            className="px-6 py-2 animated-gradient-bg text-white font-medium rounded-full transition-all disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none disabled:animate-none"
                        >
                            <SparklesIcon className="w-5 h-5 inline-block mr-2 -mt-1" />
                            Analyze My Performance
                        </button>
                         {history.length === 0 && <p className="text-xs text-slate-400 mt-2">Complete a quiz to enable analysis.</p>}
                    </div>
                );
        }
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 mb-6 animate-fade-in-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-center mb-4">
                <TargetIcon className="w-6 h-6 mr-3 text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-800">Focus Zone</h2>
            </div>
            {renderInnerContent()}
        </div>
    );
};

export default FocusZone;
