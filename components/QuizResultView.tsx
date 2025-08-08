import React from 'react';
import type { QuizResult } from '../types';

export const QuizResultView: React.FC<{
  results: QuizResult[];
  onRestart: () => void;
  onNewTopic: () => void;
}> = ({ results, onRestart, onNewTopic }) => {
  const correctAnswers = results.filter(r => r.isCorrect).length;
  const totalQuestions = results.length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const getBorderColor = (isCorrect: boolean) => {
    return isCorrect ? 'border-green-500/50' : 'border-red-500/50';
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 flex items-center justify-center min-h-full">
      <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-2">Quiz Complete!</h2>
        <p className="text-center text-6xl font-extrabold text-cyan-600 dark:text-cyan-400 my-4">{score}<span className="text-4xl text-slate-400 dark:text-slate-500">%</span></p>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">You answered {correctAnswers} out of {totalQuestions} questions correctly.</p>

        <div className="space-y-4 max-h-80 overflow-y-auto p-1 pr-2 -mr-2">
          {results.map((result, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${getBorderColor(result.isCorrect)} bg-slate-50 dark:bg-slate-800/50`}>
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{index + 1}. {result.question.question}</p>
              <div className="text-sm space-y-1">
                <p className={`flex items-start ${result.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                   <span className="mr-2 mt-0.5 flex-shrink-0">
                       {result.isCorrect ? (
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                       ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                       )}
                   </span>
                   <span>Your answer: <span className="font-medium">{result.question.options[result.userAnswerIndex]}</span></span>
                </p>
                {!result.isCorrect && (
                  <p className="text-green-700 dark:text-green-400 flex items-start">
                    <span className="mr-2 mt-0.5 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
                    <span>Correct answer: <span className="font-medium">{result.question.options[result.question.correctAnswerIndex]}</span></span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={onRestart} className="px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors shadow-md transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
            Try Again
          </button>
          <button onClick={onNewTopic} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            Study New Material
          </button>
        </div>
      </div>
    </div>
  );
};