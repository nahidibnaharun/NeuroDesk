import React, { useState } from 'react';
import type { ShortAnswerQuestion, ShortAnswerResult } from '../types';
import { verifyShortAnswer } from '../services/geminiService';
import { Loader } from './Loader';

interface ShortAnswerQuizViewProps {
  questions: ShortAnswerQuestion[];
  onComplete: (results: ShortAnswerResult[]) => void;
}

export const ShortAnswerQuizView: React.FC<ShortAnswerQuizViewProps> = ({ questions, onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(questions.length).fill(''));
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isGrading, setIsGrading] = useState(false);
    const [results, setResults] = useState<ShortAnswerResult[]>([]);
    
    const currentQuestion = questions[currentQuestionIndex];
    
    const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = e.target.value;
        setUserAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsGrading(true);
        try {
            const verificationPromises = questions.map((q, i) => 
                verifyShortAnswer(q.question, q.correctAnswer, userAnswers[i])
            );
            const gradedResults = await Promise.all(verificationPromises);
            
            const finalResults: ShortAnswerResult[] = questions.map((q, i) => ({
                question: q,
                userAnswer: userAnswers[i],
                isCorrect: gradedResults[i].isCorrect,
                feedback: gradedResults[i].feedback,
            }));

            setResults(finalResults);
        } catch (error) {
             console.error("Error during AI grading:", error);
             alert("An error occurred during AI grading. Please try again.");
             // Potentially add a fallback to simple grading here
        } finally {
            setIsGrading(false);
            setIsSubmitted(true);
        }
    };
    
    if (isGrading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader message="AI is grading your answers..." />
            </div>
        );
    }
    
    if (isSubmitted) {
        return (
            <div className="w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-full">
                <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">Results</h2>
                <div className="w-full space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {results.map((result, index) => (
                        <div key={index} className={`p-4 rounded-lg border-l-4 ${result.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                            <p className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{index + 1}. {result.question.question}</p>
                            <p className={`text-sm ${result.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                Your answer: <span className="font-medium">{result.userAnswer || '(No answer)'}</span>
                            </p>
                            {!result.isCorrect && (
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Correct answer: <span className="font-medium">{result.question.correctAnswer}</span>
                                </p>
                            )}
                             {result.feedback && (
                                <p className="text-sm mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold">Feedback:</span> {result.feedback}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={() => onComplete(results)} className="mt-8 px-8 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors shadow-md">Done</button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-full">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white mb-2 text-center">Short Answer Quiz</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-center">Type your answer for each question.</p>
            
            <div className="w-full bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-1">Question {currentQuestionIndex + 1}/{questions.length}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Topic: {currentQuestion.topic}</p>

                <h3 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-white my-6">
                    {currentQuestion.question}
                </h3>
                <input
                    type="text"
                    value={userAnswers[currentQuestionIndex]}
                    onChange={handleAnswerChange}
                    placeholder="Your answer..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition text-slate-900 dark:text-slate-100"
                />
            </div>

            <div className="w-full max-w-3xl mt-6 flex justify-between items-center">
                <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                {currentQuestionIndex === questions.length - 1 ? (
                    <button onClick={handleSubmit} className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors shadow-md">Submit</button>
                ) : (
                    <button onClick={handleNext} className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors shadow-md">Next</button>
                )}
            </div>
        </div>
    );
};