import React from 'react';
import { WeakAreaAnalysis, QuizHistoryItem } from '../types';
import { NeuronIcon, PrinterIcon, XIcon, TargetIcon, SparklesIcon, BookOpenIcon } from './Icon';

interface ReportCardProps {
    analysis: WeakAreaAnalysis;
    quizHistory: QuizHistoryItem[];
    currentUser: string;
    onClose: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ analysis, quizHistory, currentUser, onClose }) => {
    
    const handlePrint = () => {
        window.print();
    };

    const recentQuizzes = quizHistory.slice(-5).reverse();

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in-slide-up">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div id="report-card-printable" className="p-8 overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                             <NeuronIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                             <div>
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Study Performance Report Card</h1>
                                <p className="text-slate-500 dark:text-slate-400">for {currentUser}</p>
                             </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Generated on: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        {/* Left Column */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Key Focus Areas */}
                            <div>
                                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
                                    <TargetIcon className="w-5 h-5 text-indigo-500" />
                                    Key Focus Areas
                                </h2>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {analysis.weakAreas.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                                            {analysis.weakAreas.map((area, index) => (
                                                <li key={index} className="font-medium">{area}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-slate-500 dark:text-slate-400">No specific weak areas were identified. Keep up the great work!</p>
                                    )}
                                </div>
                            </div>
                             {/* AI Coach's Notes */}
                            <div>
                                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
                                    <SparklesIcon className="w-5 h-5 text-indigo-500" />
                                    AI Coach's Notes
                                </h2>
                                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <p className="text-slate-600 dark:text-slate-300 italic">"{analysis.message}"</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="md:col-span-1">
                             <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
                                <BookOpenIcon className="w-5 h-5 text-indigo-500" />
                                Recent Quiz Performance
                            </h2>
                            <div className="space-y-3">
                                {recentQuizzes.length > 0 ? (
                                    recentQuizzes.map(item => (
                                        <div key={item.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.result.mode} Mode</span>
                                                <span className={`text-sm font-bold ${item.result.score / item.result.total > 0.7 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    {item.result.score} / {item.result.total}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.timestamp}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">No recent quizzes to display.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex justify-end items-center gap-4 p-4 border-t border-slate-200 dark:border-slate-700 no-print">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 animated-gradient-bg text-white font-bold rounded-lg shadow-md transition-all"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Print / Save as PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportCard;
