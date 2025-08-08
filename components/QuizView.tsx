import React, { useState } from 'react';
import type { QuizQuestion, QuizResult } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
  onQuizComplete: (results: QuizResult[]) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    const isCorrect = answerIndex === currentQuestion.correctAnswerIndex;
    setResults(prev => [...prev, {
      question: currentQuestion,
      userAnswerIndex: answerIndex,
      isCorrect,
    }]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      onQuizComplete(results);
    }
  };

  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-cyan-500";
    }
    if (index === currentQuestion.correctAnswerIndex) {
      return "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-300 transform scale-105";
    }
    if (index === selectedAnswer) {
      return "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-300";
    }
    return "bg-white dark:bg-slate-800 opacity-60 cursor-not-allowed";
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-full">
       <div className="w-full mb-8">
         <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white mb-2 text-center">Quiz Time!</h2>
         <p className="text-slate-600 dark:text-slate-400 text-center">Test your knowledge and master your topics.</p>
       </div>
       <div className="w-full bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">Question {currentQuestionIndex + 1}/{questions.length}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Topic: {currentQuestion.topic}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-cyan-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
          
          <h3 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-white my-6">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
                className={`w-full text-left p-4 rounded-lg border-2 dark:border-slate-600 transition-all duration-300 text-slate-800 dark:text-slate-100 flex items-center group ${getButtonClass(index)}`}
              >
                <span className={`w-6 h-6 mr-4 rounded-md flex-shrink-0 flex items-center justify-center font-bold text-sm ${isAnswered && index === currentQuestion.correctAnswerIndex ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-600 group-hover:bg-cyan-500 group-hover:text-white'}`}>{String.fromCharCode(65 + index)}</span>
                <span className="flex-1">{option}</span>
              </button>
            ))}
          </div>

          {isAnswered && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            </div>
          )}
        </div>
    </div>
  );
};