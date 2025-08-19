import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { Question, QuizMode, QuestionType, MCQ, TrueFalse, FillInTheBlank, OpenEnded, QuizResult, AnswerFeedback } from '../types';
import Timer from './Timer';
import { CONFIDENCE_LEVELS, TEST_DURATION_SECONDS } from '../constants';
import { CheckCircleIcon, XCircleIcon, LightbulbIcon, ChevronLeftIcon, ScaleIcon, AiTeacherIcon } from './Icon';
import { gradeOpenEndedAnswer } from '../services/geminiService';
import { triggerConfetti } from '../utils/effects';

interface QuizRunnerProps {
  questions: Question[];
  mode: QuizMode;
  onFinish: (result: QuizResult) => void;
  onExit: () => void;
}

const QuizRunner: React.FC<QuizRunnerProps> = ({ questions, mode, onFinish, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | boolean | null)[]>(Array(questions.length).fill(null));
  const [confidenceLevels, setConfidenceLevels] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [allFeedback, setAllFeedback] = useState<(AnswerFeedback | null)[]>(Array(questions.length).fill(null));
  const [selectedConfidence, setSelectedConfidence] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(mode === QuizMode.Test);
  const [currentFeedback, setCurrentFeedback] = useState<AnswerFeedback | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [teacherMood, setTeacherMood] = useState<'neutral' | 'happy' | 'sad'>('neutral');
  
  // Lifelines state
  const [hint, setHint] = useState<string | null>(null);
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState(false);
  const [displayedOptions, setDisplayedOptions] = useState<string[]>([]);

  const flipperRef = useRef<HTMLDivElement>(null);
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const backFaceRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (currentQuestion.type === QuestionType.MultipleChoice) {
        setDisplayedOptions((currentQuestion as MCQ).options);
    }
    // Reset state for new question
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentFeedback(null);
    setIsGrading(false);
    setIsFlipped(false);
    setTeacherMood('neutral');
    setSelectedConfidence(null);
    setHint(null);
    setIsFiftyFiftyUsed(false);
  }, [currentQuestionIndex, questions]);

  useLayoutEffect(() => {
    if (!flipperRef.current || !frontFaceRef.current || !backFaceRef.current) return;
    
    requestAnimationFrame(() => {
      const frontHeight = frontFaceRef.current?.scrollHeight || 0;
      const backHeight = backFaceRef.current?.scrollHeight || 0;
      flipperRef.current!.style.height = `${Math.max(frontHeight, backHeight, 200)}px`;
    });
  }, [currentQuestion, currentFeedback, isGrading, selectedOption, hint, displayedOptions, selectedConfidence]);


  const handleNext = () => {
    const goToNext = () => {
       if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
       } else {
          finishQuiz(userAnswers, confidenceLevels, allFeedback);
       }
    };

    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(goToNext, 400); // Wait for card to flip back
    } else {
      goToNext();
    }
  };

  const handleAnswerSubmit = async () => {
    if (selectedOption === null || (mode === QuizMode.Practice && currentQuestion.type !== QuestionType.OpenEnded && selectedConfidence === null)) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newAnswers);

    const newConfidenceLevels = [...confidenceLevels];
    newConfidenceLevels[currentQuestionIndex] = selectedConfidence;
    setConfidenceLevels(newConfidenceLevels);
    
    setIsAnswered(true);

    // If it's practice mode AND NOT an open-ended question, grade immediately.
    if (mode === QuizMode.Practice && currentQuestion.type !== QuestionType.OpenEnded) {
        const isCorrect = (currentQuestion as Exclude<Question, OpenEnded>).answer === selectedOption;
        const feedbackResult = {
          isCorrect,
          feedbackText: currentQuestion.explanation || (isCorrect ? "Correct!" : `The correct answer is ${String((currentQuestion as Exclude<Question, OpenEnded>).answer)}.`)
        };
      
      const newAllFeedback = [...allFeedback];
      newAllFeedback[currentQuestionIndex] = feedbackResult;
      setAllFeedback(newAllFeedback);
      setCurrentFeedback(feedbackResult);

      setTeacherMood(feedbackResult.isCorrect ? 'happy' : 'sad');
      if (feedbackResult.isCorrect) triggerConfetti();
      setIsFlipped(true);
    } else { // For Test Mode, or for Open-Ended questions in Practice Mode, just go to the next question.
      handleNext();
    }
  };
  
  const finishQuiz = (finalAnswers: (string | boolean | null)[], finalConfidence: (number | null)[], finalFeedback: (AnswerFeedback | null)[]) => {
     setIsTimerRunning(false);
     onFinish({
         score: 0, // Score will be calculated in App.tsx after grading all questions
         total: questions.length,
         mode,
         questions,
         userAnswers: finalAnswers,
         confidenceLevels: finalConfidence,
         feedback: finalFeedback
     });
  }

  const handleTimeUp = () => {
      finishQuiz(userAnswers, confidenceLevels, allFeedback);
  };
  
  const handleGetHint = () => {
    setHint(currentQuestion.hint || "Sorry, no hint is available for this question.");
  };

  const handleUseFiftyFifty = () => {
    if (currentQuestion.type !== QuestionType.MultipleChoice || isFiftyFiftyUsed) return;
    
    const mcq = currentQuestion as MCQ;
    const correctAnswer = mcq.answer;
    const incorrectOptions = mcq.options.filter(opt => opt !== correctAnswer);
    
    const randomIncorrect = incorrectOptions.sort(() => 0.5 - Math.random())[0];
    
    const newOptions = [correctAnswer, randomIncorrect].sort(() => 0.5 - Math.random());
    setDisplayedOptions(newOptions);
    setIsFiftyFiftyUsed(true);
  };

  const renderFeedback = () => {
    const q = currentQuestion;
    
    // This function is now only called for non-OpenEnded questions in practice mode.
    // The card flip logic ensures this.
    if (!currentFeedback) return null;

    const { isCorrect } = currentFeedback;
    return (
        <div className={`p-4 rounded-lg text-sm ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="font-bold flex items-center">
                {isCorrect ? <CheckCircleIcon className="w-5 h-5 mr-2"/> : <XCircleIcon className="w-5 h-5 mr-2"/>}
                {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            {!isCorrect && <p className="mt-1">Correct Answer: <strong>{String((q as Exclude<Question, OpenEnded>).answer)}</strong></p>}
            {q.explanation && 
                <div className="mt-2 pt-2 border-t border-current/30">
                    <p className="flex items-start"><LightbulbIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" /> <span>{q.explanation}</span></p>
                </div>
            }
        </div>
    );
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case QuestionType.MultipleChoice:
        return (
          <div className="space-y-3">
            {displayedOptions.map((option, index) => {
              const isSelected = selectedOption === option;
              let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ";
              buttonClass += isSelected ? 'bg-indigo-100 border-indigo-500' : 'bg-white hover:bg-slate-50 border-slate-300';
              
              return (
                <button key={index} onClick={() => !isAnswered && setSelectedOption(option)} disabled={isAnswered} className={buttonClass}>
                  {option}
                </button>
              );
            })}
          </div>
        );
      case QuestionType.TrueFalse:
         return (
            <div className="flex space-x-4">
                {[true, false].map((option, index) => {
                     const isSelected = selectedOption === option;
                     let buttonClass = "w-full p-4 rounded-lg border-2 font-bold text-lg transition-all duration-200 ";
                     buttonClass += isSelected ? 'bg-indigo-100 border-indigo-500' : 'bg-white hover:bg-slate-50 border-slate-300';
                    return (
                         <button key={index} onClick={() => !isAnswered && setSelectedOption(option)} disabled={isAnswered} className={buttonClass}>
                             {option ? 'TRUE' : 'FALSE'}
                         </button>
                    );
                })}
            </div>
         );
      case QuestionType.FillInTheBlank:
        return (
          <input
            type="text"
            className="w-full p-3 rounded-lg border-2 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={typeof selectedOption === 'string' ? selectedOption : ''}
            onChange={(e) => !isAnswered && setSelectedOption(e.target.value)}
            disabled={isAnswered}
            placeholder="Type your answer here"
          />
        );
      case QuestionType.OpenEnded:
        return (
          <textarea
              className="w-full p-3 h-32 rounded-lg border-2 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={typeof selectedOption === 'string' ? selectedOption : ''}
              onChange={(e) => !isAnswered && setSelectedOption(e.target.value)}
              disabled={isAnswered || isGrading}
              placeholder="Type your detailed answer here..."
          />
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };
  
  const ConfidenceMeter = () => (
    <div className="my-6">
        <p className="text-center text-sm font-medium text-slate-600 mb-2">How confident are you?</p>
        <div className="flex justify-center gap-2 sm:gap-4">
            {Object.entries(CONFIDENCE_LEVELS).map(([level, label]) => (
                <button
                    key={level}
                    onClick={() => setSelectedConfidence(Number(level))}
                    disabled={isAnswered}
                    className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all duration-200 w-24
                    ${selectedConfidence === Number(level)
                        ? 'bg-indigo-500 border-indigo-500 text-white scale-110'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    </div>
  );

  const progress = useMemo(() => ((currentQuestionIndex + 1) / questions.length) * 100, [currentQuestionIndex, questions.length]);
  
  const submitButtonText = (mode === QuizMode.Practice && currentQuestion.type !== QuestionType.OpenEnded)
      ? 'Check Answer'
      : (currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz');
      
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
       <button onClick={onExit} className="flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4">
            <ChevronLeftIcon className="w-4 h-4 mr-1"/> Back to Setup
       </button>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 border border-slate-200">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
                <AiTeacherIcon mood={teacherMood} className="w-16 h-16 hidden sm:block" />
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                        {mode === QuizMode.Practice ? 'Practice Session' : 'Test Time!'}
                    </h2>
                    <p className="text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>
            </div>
            {mode === QuizMode.Test && <Timer duration={TEST_DURATION_SECONDS} onTimeUp={handleTimeUp} isRunning={isTimerRunning} />}
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6">
            <div className="animated-gradient-bg h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
        
        <div className="perspective w-full">
            <div ref={flipperRef} className={`card-flipper ${isFlipped && mode === QuizMode.Practice ? 'is-flipped' : ''}`}>
                <div ref={frontFaceRef} className="card-face card-front">
                    <div className="mb-6">
                        <p className="text-lg sm:text-xl text-slate-700 font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQuestion.question.replace(/_____/g, '<span class="inline-block w-24 h-6 bg-slate-200 rounded align-middle"></span>') }} />
                    </div>
                    {renderQuestion()}
                    {mode === QuizMode.Practice && !isAnswered && currentQuestion.type !== QuestionType.OpenEnded && <ConfidenceMeter />}
                </div>
                <div ref={backFaceRef} className="card-face card-back p-4 bg-white/80 rounded-lg flex items-center justify-center">
                    {isAnswered && mode === QuizMode.Practice && renderFeedback()}
                </div>
            </div>
        </div>
        
        {/* Lifelines and Hint Section */}
        {mode === QuizMode.Practice && !isAnswered && (
             <div className="mt-4 pt-4 border-t border-slate-200">
                {hint && <div className="bg-amber-100 text-amber-800 p-3 rounded-lg text-sm mb-4 animate-fade-in-slide-up">{hint}</div>}
                 <div className="flex items-center justify-end gap-3">
                     <button onClick={handleGetHint} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-50 transition-colors">
                        <LightbulbIcon className="w-5 h-5" />
                        Hint
                     </button>
                     {currentQuestion.type === QuestionType.MultipleChoice && (
                        <button onClick={handleUseFiftyFifty} disabled={isFiftyFiftyUsed} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-50 transition-colors">
                            <ScaleIcon className="w-5 h-5"/>
                            50/50
                        </button>
                     )}
                 </div>
             </div>
        )}

        <div className="mt-6 text-right">
          {isAnswered && mode === QuizMode.Practice && currentQuestion.type !== QuestionType.OpenEnded ? (
             <button
                onClick={handleNext}
                className="px-8 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md transition-all"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          ) : (
            <button
                onClick={handleAnswerSubmit}
                disabled={selectedOption === null || isAnswered || isGrading || (mode === QuizMode.Practice && currentQuestion.type !== QuestionType.OpenEnded && selectedConfidence === null)}
                className="px-8 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed transition-all disabled:animate-none"
            >
                {submitButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizRunner;