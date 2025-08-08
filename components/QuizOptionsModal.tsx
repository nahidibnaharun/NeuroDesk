import React, { useState } from 'react';
import type { QuizDifficulty } from '../types';

interface QuizOptionsModalProps {
    onStartQuiz: (quizType: 'mcq' | 'short_answer', difficulty: QuizDifficulty) => void;
    defaultDifficulty: QuizDifficulty;
}

const RadioPill: React.FC<{
    value: string;
    name: string;
    checked: boolean;
    onChange: (value: any) => void;
    label: string;
}> = React.memo(({ value, name, checked, onChange, label }) => (
    <label className={`w-full text-center px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${checked ? 'bg-cyan-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
        <input type="radio" value={value} name={name} checked={checked} onChange={() => onChange(value)} className="sr-only" />
        {label}
    </label>
));


export const QuizOptionsModal: React.FC<QuizOptionsModalProps> = ({ onStartQuiz, defaultDifficulty }) => {
    const [quizType, setQuizType] = useState<'mcq' | 'short_answer'>('mcq');
    const [difficulty, setDifficulty] = useState<QuizDifficulty>(defaultDifficulty);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStartQuiz(quizType, difficulty);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Quiz Type</h3>
                <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                    <RadioPill value="mcq" name="quizType" checked={quizType === 'mcq'} onChange={setQuizType} label="Multiple Choice" />
                    <RadioPill value="short_answer" name="quizType" checked={quizType === 'short_answer'} onChange={setQuizType} label="Short Answer" />
                </div>
            </div>

            {quizType === 'mcq' && (
                <div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Difficulty</h3>
                    <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                        <RadioPill value="Easy" name="difficulty" checked={difficulty === 'Easy'} onChange={setDifficulty} label="Easy" />
                        <RadioPill value="Medium" name="difficulty" checked={difficulty === 'Medium'} onChange={setDifficulty} label="Medium" />
                        <RadioPill value="Hard" name="difficulty" checked={difficulty === 'Hard'} onChange={setDifficulty} label="Hard" />
                    </div>
                </div>
            )}
            
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors shadow-sm"
                >
                    Generate Quiz
                </button>
            </div>
        </form>
    );
};