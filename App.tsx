

import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { StudyMaterialsView } from './components/StudyMaterialsView';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { WhiteboardView } from './components/WhiteboardView';
import { QuizView } from './components/QuizView';
import { ShortAnswerQuizView } from './components/ShortAnswerQuizView';
import { QuizResultView } from './components/QuizResultView';
import { Loader } from './components/Loader';
import { Modal } from './components/Modal';
import { SummaryView } from './components/SummaryView';
import { TutorView } from './components/TutorView';
import { DiagramView } from './components/DiagramView';
import { QuizOptionsModal } from './components/QuizOptionsModal';
import { generateSummary, generateQuiz, generateShortAnswerQuiz, generateDiagram } from './services/geminiService';
import type { StudyMaterial, QuizQuestion, ProgressData, QuizResult, ShortAnswerQuestion, QuizDifficulty, ShortAnswerResult, ReminderSettings } from './types';
import { StudyMode } from './types';

const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const root = window.document.documentElement;

        const applyTheme = () => {
            const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
            // Use toggle for a more robust way to add/remove the class.
            root.classList.toggle('dark', isDark);
        };
        
        // Apply the theme immediately and when the OS preference changes.
        applyTheme();
        mediaQuery.addEventListener('change', applyTheme);

        // Cleanup the event listener.
        return () => {
            mediaQuery.removeEventListener('change', applyTheme);
        };
    }, [theme]); // Rerun this effect when the user's theme choice changes.

    return [theme, setTheme];
};

const App: React.FC = () => {
    const [theme, setTheme] = useTheme() as [string, (theme: string) => void];
    const [studyMode, setStudyMode] = useState<StudyMode>(StudyMode.Home);
    const [isLoading, setIsLoading] = useState(false);
    const [loaderMessage, setLoaderMessage] = useState('');
    
    const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>(() => {
        const saved = localStorage.getItem('studyMaterials');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeMaterialId, setActiveMaterialId] = useState<string | null>(() => {
        return localStorage.getItem('activeMaterialId');
    });

    const [summary, setSummary] = useState('');
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [shortAnswerQuestions, setShortAnswerQuestions] = useState<ShortAnswerQuestion[]>([]);
    const [diagram, setDiagram] = useState('');
    
    const [lastQuizResults, setLastQuizResults] = useState<QuizResult[]>([]);
    const [activeQuizType, setActiveQuizType] = useState<'mcq' | 'short_answer' | null>(null);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    
    const [modalContent, setModalContent] = useState<'summary' | 'tutor' | 'diagram' | 'quiz_options' | null>(null);

    const [progress, setProgress] = useState<ProgressData>(() => {
        const saved = localStorage.getItem('studyProgress');
        return saved ? JSON.parse(saved) : { scoresByTopic: {}, streaks: { current: 0, longest: 0 }, badges: [], studyTime: {} };
    });

    // --- Start of Settings State ---
    const [defaultDifficulty, setDefaultDifficulty] = useState<QuizDifficulty>(() => {
        return (localStorage.getItem('defaultDifficulty') as QuizDifficulty) || 'Medium';
    });
    const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
        const saved = localStorage.getItem('reminderSettings');
        return saved ? JSON.parse(saved) : { enabled: false, time: '17:00' };
    });
    
    useEffect(() => { localStorage.setItem('defaultDifficulty', defaultDifficulty); }, [defaultDifficulty]);
    useEffect(() => { localStorage.setItem('reminderSettings', JSON.stringify(reminderSettings)); }, [reminderSettings]);

    // Reminder notification logic
    useEffect(() => {
        let reminderInterval: number | null = null;
        if (reminderSettings.enabled) {
            const checkReminder = () => {
                const now = new Date();
                const [hours, minutes] = reminderSettings.time.split(':').map(Number);
                if (now.getHours() === hours && now.getMinutes() === minutes) {
                    if (Notification.permission === 'granted') {
                        new Notification('Time to study!', {
                            body: 'Your daily study session is waiting for you.',
                            icon: '/vite.svg'
                        });
                    }
                }
            };
            
            // Check every minute
            reminderInterval = setInterval(checkReminder, 60000);
        }
        return () => {
            if (reminderInterval) clearInterval(reminderInterval);
        };
    }, [reminderSettings]);
    // --- End of Settings State ---
    
    const activeMaterial = studyMaterials.find(m => m.id === activeMaterialId);

    useEffect(() => { localStorage.setItem('studyProgress', JSON.stringify(progress)); }, [progress]);
    useEffect(() => { localStorage.setItem('studyMaterials', JSON.stringify(studyMaterials)); }, [studyMaterials]);
    useEffect(() => { if (activeMaterialId) localStorage.setItem('activeMaterialId', activeMaterialId); else localStorage.removeItem('activeMaterialId'); }, [activeMaterialId]);

    const handleGenerate = useCallback(async (type: 'summary' | 'tutor' | 'diagram' | 'quiz') => {
        if (!activeMaterial) {
            alert("Please select a study material first!");
            return;
        }

        if (type === 'quiz') {
            setModalContent('quiz_options');
            return;
        }

        setIsLoading(true);
        try {
            if (type === 'summary') {
                setLoaderMessage('Generating your summary...');
                const result = await generateSummary(activeMaterial.content);
                setSummary(result);
                setModalContent('summary');
            } else if (type === 'tutor') {
                setModalContent('tutor');
            } else if (type === 'diagram') {
                setLoaderMessage('Creating your diagram...');
                const result = await generateDiagram(activeMaterial.content);
                setDiagram(result);
                setModalContent('diagram');
            }
        } catch (error) {
            console.error(`Error generating ${type}:`, error);
            alert(`An error occurred while generating your ${type}. The service might be temporarily unavailable. Please try again in a moment.`);
        } finally {
            setIsLoading(false);
        }
    }, [activeMaterial]);

    const handleStartQuiz = async (quizType: 'mcq' | 'short_answer', difficulty: QuizDifficulty) => {
        if (!activeMaterial) return;

        setModalContent(null);
        setIsLoading(true);

        try {
            if (quizType === 'mcq') {
                setLoaderMessage('Building your quiz...');
                 const weakTopics = Object.entries(progress.scoresByTopic)
                    .filter(([, data]) => (data.total > 0 && (data.correct / data.total) < 0.6))
                    .map(([topic]) => topic);
                const result = await generateQuiz(activeMaterial.content, difficulty, weakTopics);
                setQuizQuestions(result);
                if (result.length > 0) {
                    setActiveQuizType('mcq');
                    setIsQuizCompleted(false);
                    setStudyMode(StudyMode.Quiz);
                } else {
                     alert("Sorry, we couldn't generate a quiz. Please try with different content.");
                }
            } else if (quizType === 'short_answer') {
                 setLoaderMessage('Building your short answer quiz...');
                 const result = await generateShortAnswerQuiz(activeMaterial.content);
                 setShortAnswerQuestions(result);
                 if (result.length > 0) {
                    setActiveQuizType('short_answer');
                    setIsQuizCompleted(false); // Re-using this flag
                    setStudyMode(StudyMode.Quiz);
                 } else {
                    alert("Sorry, we couldn't generate a short answer quiz. Please try with different content.");
                 }
            }
        } catch (error) {
            console.error(`Error generating quiz:`, error);
            alert(`An error occurred while generating your quiz. The service might be temporarily unavailable. Please try again in a moment.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const updateProgressWithResults = useCallback((results: (QuizResult | ShortAnswerResult)[]) => {
        setProgress(prev => {
            const newScores = { ...prev.scoresByTopic };
            results.forEach(result => {
                const topic = result.question.topic || 'General';
                if (!newScores[topic]) newScores[topic] = { correct: 0, total: 0 };
                newScores[topic].total += 1;
                if (result.isCorrect) newScores[topic].correct += 1;
            });

            const newBadges = [...prev.badges];
            if (!newBadges.includes('first_quiz')) newBadges.push('first_quiz');
            if (Object.values(newScores).some(s => s.total >= 10 && (s.correct / s.total) >= 0.9) && !newBadges.includes('topic_master')) {
                newBadges.push('topic_master');
            }
            
            return { ...prev, scoresByTopic: newScores, badges: newBadges };
        });
    }, []);
    
    const handleQuizComplete = useCallback((results: QuizResult[]) => {
        updateProgressWithResults(results);
        setLastQuizResults(results);
        setIsQuizCompleted(true);
    }, [updateProgressWithResults]);
    
    const handleShortAnswerQuizComplete = useCallback((results: ShortAnswerResult[]) => {
        updateProgressWithResults(results);
        // Navigate away from quiz view after completion.
        // For short answer, results are shown inside, so we can just go back.
        setStudyMode(StudyMode.Materials);
    }, [updateProgressWithResults]);

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 },
    };

    const pageTransition: Transition = {
        type: 'tween',
        ease: 'anticipate',
        duration: 0.4,
    };
    
    const renderContent = () => {
        if (isLoading) return <div className="flex-grow flex items-center justify-center"><Loader message={loaderMessage} /></div>;
        
        const key = isQuizCompleted ? `${studyMode}-results` : studyMode;

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={key}
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="h-full"
                >
                    {(() => {
                        switch (studyMode) {
                            case StudyMode.Home:
                                return <HomeView progress={progress} onNavigate={setStudyMode} onGenerate={handleGenerate} activeMaterial={!!activeMaterial} />;
                            case StudyMode.Materials:
                                return <StudyMaterialsView 
                                            materials={studyMaterials}
                                            setMaterials={setStudyMaterials}
                                            activeMaterialId={activeMaterialId}
                                            setActiveMaterialId={setActiveMaterialId}
                                            onGenerate={handleGenerate} 
                                        />;
                            case StudyMode.Quiz:
                                if (isQuizCompleted) {
                                    return <QuizResultView results={lastQuizResults} onRestart={() => setIsQuizCompleted(false)} onNewTopic={() => setStudyMode(StudyMode.Materials)} />;
                                }
                                if (activeQuizType === 'mcq' && quizQuestions.length > 0) {
                                    return <QuizView questions={quizQuestions} onQuizComplete={handleQuizComplete} />;
                                }
                                if (activeQuizType === 'short_answer' && shortAnswerQuestions.length > 0) {
                                    return <ShortAnswerQuizView questions={shortAnswerQuestions} onComplete={handleShortAnswerQuizComplete} />;
                                }
                                return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Select a material from the 'Materials' tab and generate a quiz to start.</div>;
                            case StudyMode.Whiteboard:
                                return <WhiteboardView />;
                            case StudyMode.Progress:
                                return <ProgressView progress={progress} />;
                            case StudyMode.Settings:
                                return <SettingsView 
                                            theme={theme} 
                                            setTheme={setTheme} 
                                            defaultDifficulty={defaultDifficulty}
                                            setDefaultDifficulty={setDefaultDifficulty}
                                            reminderSettings={reminderSettings}
                                            setReminderSettings={setReminderSettings}
                                        />;
                            default:
                                return <HomeView progress={progress} onNavigate={setStudyMode} onGenerate={handleGenerate} activeMaterial={!!activeMaterial} />;
                        }
                    })()}
                </motion.div>
            </AnimatePresence>
        );
    };
    
    return (
        <div className="min-h-screen font-sans flex bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <Sidebar currentMode={studyMode} onNavigate={setStudyMode} />
            <main className="flex-grow flex flex-col h-screen">
              <div className="flex-grow overflow-y-auto relative">
                {renderContent()}
              </div>
            </main>
            
            <AnimatePresence>
            {modalContent && (
                 <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} title={
                     modalContent === 'summary' ? "Generated Summary" :
                     modalContent === 'tutor' ? "AI Tutor" :
                     modalContent === 'diagram' ? "Generated Diagram" :
                     modalContent === 'quiz_options' ? "Create a Quiz" : ""
                 }>
                    {modalContent === 'summary' && <SummaryView summary={summary} />}
                    {modalContent === 'tutor' && activeMaterial && <TutorView sourceText={activeMaterial.content} />}
                    {modalContent === 'diagram' && <DiagramView diagramCode={diagram} theme={theme} />}
                    {modalContent === 'quiz_options' && <QuizOptionsModal onStartQuiz={handleStartQuiz} defaultDifficulty={defaultDifficulty} />}
                </Modal>
            )}
            </AnimatePresence>
        </div>
    );
};

export default App;