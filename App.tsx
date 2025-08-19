import React, { useState, useEffect, useCallback, ChangeEvent, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  HistoryItem,
  Question,
  QuestionType,
  QuizMode,
  QuizResult,
  OpenEnded,
  AnswerFeedback,
  QuizHistoryItem,
  ChatMessage,
  DiagramItem,
  WeakAreaAnalysis,
  RoadmapItem,
  ChatHistoryItem,
  AudioSummaryItem,
} from './types';
import {
  generateQuestions,
  gradeOpenEndedAnswer,
} from './services/geminiService';
import {
  APP_TITLE,
  QUIZ_CONFIG,
  QUIZ_DIFFICULTY,
  QUIZ_MODES,
  LOADING_MESSAGES
} from './constants';
import {
  NeuronIcon,
  BookOpenIcon,
  SparklesIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  HistoryIcon,
  UploadCloudIcon,
  NotebookIcon,
  LogOutIcon,
  TargetIcon,
  CodeIcon,
  RouteIcon,
  SitemapIcon,
  FlaskConicalIcon,
  MessageCircleIcon,
  MenuIcon,
  XIcon,
  SunIcon,
  MoonIcon,
  Volume2Icon,
} from './components/Icon';
import QuizRunner from './components/QuizRunner';
import Whiteboard from './components/Whiteboard';
import SummaryGenerator from './components/SummaryGenerator';
import DiagramMaker from './components/DiagramMaker';
import HistoryViewer from './components/HistoryViewer';
import CodeExplainer from './components/CodeExplainer';
import RoadmapGenerator from './components/RoadmapGenerator';
import CodeToFlowchart from './components/CodeToFlowchart';
import LabReportWriter from './components/LabReportWriter';
import FocusTimer from './components/FocusTimer';
import TeacherBot from './components/TeacherBot';
import AudioLab from './components/AudioLab';
import ReportCard from './components/ReportCard';
import AuthPage from './components/AuthPage';
import FocusZone from './components/FocusZone';
import { triggerConfetti } from './utils/effects';


// Set workerSrc for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs`;

type View = 'dashboard' | 'quiz' | 'whiteboard' | 'history' | 'results' | 'codeExplainer' | 'roadmap' | 'codeToFlowchart' | 'labReportWriter' | 'teacherBot' | 'audioLab';
type DashboardTool = 'quiz' | 'summary' | 'diagram';
type Theme = 'light' | 'dark';

// A simple debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const NavItem: React.FC<{
  targetView: View;
  icon: React.ReactNode;
  label: string;
  view: View;
  setView: (view: View) => void;
  setIsNavOpen: (isOpen: boolean) => void;
}> = ({ targetView, icon, label, view, setView, setIsNavOpen }) => (
  <button
    onClick={() => {
        setView(targetView);
        setIsNavOpen(false); // Close nav on item click for mobile
    }}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      view === targetView
        ? 'animated-gradient-bg text-white'
        : 'text-slate-600 hover:bg-slate-200/60'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);


export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  
  const [studyContent, setStudyContent] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [quizSettings, setQuizSettings] = useState({
      type: QuestionType.MultipleChoice,
      difficulty: 'Medium',
      mode: QuizMode.Practice,
      topic: '',
  });
  const [activeDashboardTool, setActiveDashboardTool] = useState<DashboardTool>('quiz');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [initialChat, setInitialChat] = useState<ChatHistoryItem | null>(null);
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapItem | null>(null);
  const [reportToShow, setReportToShow] = useState<WeakAreaAnalysis | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  const quizHistory = useMemo(() => history.filter(h => h.type === 'quiz') as QuizHistoryItem[], [history]);

  const debouncedStudyContent = useDebounce(studyContent, 500);
  const debouncedHistory = useDebounce(history, 500);

  // Theme management
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Particle effect
  useEffect(() => {
    const container = document.getElementById('particle-container');
    if (!container) return;
    // prevent adding particles multiple times
    if(container.childElementCount > 0) return;
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 5 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${Math.random() * 15 + 15}s`;
        container.appendChild(particle);
    }
  }, []);

  // Load user session
  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('currentUser');
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
    }
  }, []);

  // Load user-specific data
  useEffect(() => {
    if (currentUser) {
      const allUserData = JSON.parse(localStorage.getItem('studyBuddyData') || '{}');
      const userData = allUserData[currentUser] || { studyContent: '', history: [] };
      setStudyContent(userData.studyContent);
      setHistory(userData.history);
    } else {
      setStudyContent('');
      setHistory([]);
    }
  }, [currentUser]);
  
  // Debounced save user-specific data
  useEffect(() => {
    if (currentUser) {
      const allUserData = JSON.parse(localStorage.getItem('studyBuddyData') || '{}');
      allUserData[currentUser] = { studyContent: debouncedStudyContent, history: debouncedHistory };
      localStorage.setItem('studyBuddyData', JSON.stringify(allUserData));
    }
  }, [debouncedStudyContent, debouncedHistory, currentUser]);


  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleLogout = () => {
      sessionStorage.removeItem('currentUser');
      setCurrentUser(null);
      setView('dashboard');
  }

  const addToHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
        // If item exists, update it. Otherwise, add it.
        const existingIndex = prev.findIndex(h => h.id === item.id);
        if (existingIndex > -1) {
            const newHistory = [...prev];
            newHistory[existingIndex] = item;
            return newHistory;
        }
        return [...prev, item];
    });
}, []);
  
  const deleteHistoryItems = useCallback((idsToDelete: string[]) => {
      setHistory(prev => prev.filter(item => !idsToDelete.includes(item.id)));
  }, []);

  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage("Reading your file...");
    setError('');
    
    try {
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map((item: any) => item.str).join(' ');
                    }
                    setStudyContent(text);
                } catch (pdfError) {
                    setError("Failed to parse the PDF file. It might be corrupted or protected.");
                } finally {
                    setIsLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } else { // Assume text file
            const text = await file.text();
            setStudyContent(text);
            setIsLoading(false);
        }
    } catch (err) {
        setError("Failed to read the file. Please ensure it's a valid PDF or TXT file.");
        setIsLoading(false);
    }
  }, []);

  const handleStartQuiz = useCallback(async () => {
    if (!studyContent.trim()) {
      setError('Please add your study material first!');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
        const questions = await generateQuestions(
            studyContent,
            quizSettings.type,
            quizSettings.difficulty,
            5,
            quizSettings.topic
        );
        if (questions && questions.length > 0) {
            setCurrentQuestions(questions);
            setView('quiz');
        } else {
            setError("Couldn't generate questions. Try different settings or content.");
        }
    } catch (e: any) {
        setError(e.message || "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  }, [studyContent, quizSettings]);

  const handleFocusPractice = useCallback((topic: string) => {
    setQuizSettings(prev => ({
        ...prev,
        mode: QuizMode.Practice,
        topic: topic,
    }));
    setActiveDashboardTool('quiz');
    setView('dashboard');
  }, []);

  const handleFinishQuiz = useCallback(async (result: QuizResult) => {
      setIsLoading(true);
      setLoadingMessage("Grading your quiz...");
      
      let score = 0;
      // Start with feedback from QuizRunner (contains non-OE practice mode answers)
      let finalFeedback: (AnswerFeedback | null)[] = [...result.feedback];

      // Grade any questions that don't have feedback yet.
      const gradedFeedbackPromises = result.questions.map(async (question, i) => {
          // If feedback already exists, use it.
          if (finalFeedback[i]) {
              return finalFeedback[i];
          }

          // Otherwise, grade it now.
          const userAnswer = result.userAnswers[i];
          if (userAnswer === null) {
              return { isCorrect: false, feedbackText: "No answer provided." };
          }
          if (question.type === QuestionType.OpenEnded) {
              return await gradeOpenEndedAnswer(question as OpenEnded, userAnswer as string);
          }
          // This part handles non-OE questions for Test mode
          const q = question as Exclude<Question, OpenEnded>;
          const isCorrect = q.answer === userAnswer;
          return { isCorrect, feedbackText: q.explanation || (isCorrect ? "Correct!" : `The correct answer is ${String(q.answer)}.`) };
      });

      finalFeedback = await Promise.all(gradedFeedbackPromises);
      
      score = finalFeedback.reduce((acc, fb) => (fb?.isCorrect ? acc + 1 : acc), 0);
      const finalResult = { ...result, score, feedback: finalFeedback };

      setLastResult(finalResult);
      
      addToHistory({
          id: new Date().toISOString(),
          type: 'quiz',
          result: finalResult,
          timestamp: new Date().toLocaleString(),
          sourceContent: studyContent,
      });
      
      setIsLoading(false);
      setView('results');
      triggerConfetti(100);
  }, [studyContent, addToHistory]);
  
  const clearHistory = useCallback(() => {
    if(window.confirm("Are you sure you want to clear all your study history? This cannot be undone.")) {
      setHistory([]);
    }
  }, []);

  const handleContinueChat = useCallback((item: ChatHistoryItem) => {
    setInitialChat(item);
    setView('teacherBot');
  }, []);

  const handleContinueRoadmap = useCallback((item: RoadmapItem) => {
    setCurrentRoadmap(item);
    setStudyContent(item.sourceContent); // Ensure context is loaded
    setView('roadmap');
  }, []);

  const handleDownloadHistory = useCallback(() => {
    if (history.length === 0) {
        alert("There is no history to download.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "neurodesk_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [history]);

  const handleUploadHistory = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                throw new Error("File could not be read as text.");
            }
            const uploadedHistory = JSON.parse(text);
            if (!Array.isArray(uploadedHistory)) {
                throw new Error("Invalid format: Uploaded file is not a history array.");
            }
            // Basic validation
            const isValid = uploadedHistory.every(item => item.id && item.type);
            if (!isValid) {
                throw new Error("Invalid format: Some items are missing 'id' or 'type'.");
            }
            
            // Merge logic: Add new items, skip existing ones by ID
            setHistory(prevHistory => {
                const existingIds = new Set(prevHistory.map(item => item.id));
                const newItems = uploadedHistory.filter(item => !existingIds.has(item.id));
                alert(`${newItems.length} new item(s) have been added to your history.`);
                return [...prevHistory, ...newItems];
            });

        } catch (error) {
            console.error("Error uploading history:", error);
            alert(`Failed to upload history: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };
    reader.readAsText(file);
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  }, []);

  const renderContent = () => {
    if (isLoading && (view !== 'dashboard')) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-indigo-500 rounded-full dot-1"></div>
                <div className="w-4 h-4 bg-indigo-500 rounded-full dot-2"></div>
                <div className="w-4 h-4 bg-indigo-500 rounded-full dot-3"></div>
              </div>
              <p className="text-slate-600 font-semibold text-lg mt-4">{loadingMessage}</p>
          </div>
      );
    }
    if (view === 'quiz') {
      return <QuizRunner questions={currentQuestions} mode={quizSettings.mode} onFinish={handleFinishQuiz} onExit={() => setView('dashboard')} />;
    }
    if (view === 'results') {
      return (
          <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 text-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-slate-200">
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
                  <p className="text-slate-500 mb-6">Here's how you did in {lastResult?.mode} Mode.</p>
                  <div className="bg-indigo-50 p-6 rounded-lg mb-8">
                      <p className="text-slate-600 text-lg">Your Score</p>
                      <p className="text-6xl font-extrabold text-indigo-700 my-2">{lastResult?.score} <span className="text-4xl text-slate-500">/ {lastResult?.total}</span></p>
                  </div>
                  <button onClick={() => setView('dashboard')} className="w-full py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md transition-all">
                      Back to Dashboard
                  </button>
                  <button onClick={() => setView('history')} className="mt-3 w-full py-2 text-indigo-600 font-medium hover:bg-indigo-100 rounded-lg transition-all">
                      Review in History
                  </button>
              </div>
          </div>
      );
    }

    const MainContentArea: React.FC<{children: React.ReactNode}> = ({children}) => (
      <div className="h-screen overflow-y-auto">
          {children}
      </div>
    );
    
    switch (view) {
        case 'whiteboard': return <MainContentArea><Whiteboard onSave={addToHistory as (item: DiagramItem) => void} history={history} /></MainContentArea>;
        case 'history': return <MainContentArea><HistoryViewer history={history} clearHistory={clearHistory} deleteItems={deleteHistoryItems} onContinueChat={handleContinueChat} onContinueRoadmap={handleContinueRoadmap} onDownloadHistory={handleDownloadHistory} onUploadHistory={handleUploadHistory} /></MainContentArea>;
        case 'codeExplainer': return <MainContentArea><CodeExplainer onSave={addToHistory} /></MainContentArea>;
        case 'roadmap': return <MainContentArea><RoadmapGenerator studyContent={studyContent} onSave={addToHistory} initialRoadmap={currentRoadmap} onSessionEnd={() => setCurrentRoadmap(null)} /></MainContentArea>;
        case 'codeToFlowchart': return <MainContentArea><CodeToFlowchart onSave={addToHistory} /></MainContentArea>;
        case 'labReportWriter': return <MainContentArea><LabReportWriter onSave={addToHistory} /></MainContentArea>;
        case 'teacherBot': return <MainContentArea><TeacherBot history={history} onSave={addToHistory} initialChat={initialChat} onChatEnd={() => setInitialChat(null)} /></MainContentArea>;
        case 'audioLab': return <MainContentArea><AudioLab studyContent={studyContent} onSave={addToHistory as (item: AudioSummaryItem) => void} /></MainContentArea>;
        default: // dashboard
          const TabButton: React.FC<{
              tool: DashboardTool;
              icon: React.ReactNode;
              label: string;
            }> = ({ tool, icon, label }) => (
              <button
                onClick={() => setActiveDashboardTool(tool)}
                className={`flex items-center px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeDashboardTool === tool
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {icon}
                <span className="ml-2">{label}</span>
              </button>
          );
          return (
              <div className="p-4 sm:p-6 md:p-8 h-screen overflow-y-auto">
                  <FocusZone
                      history={quizHistory}
                      onStartPractice={handleFocusPractice}
                      onShowReport={setReportToShow}
                  />
                  <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 mb-6 animate-fade-in-slide-up">
                    <div className="flex items-center mb-4">
                      <BookOpenIcon className="w-6 h-6 mr-3 text-indigo-500" />
                      <h2 className="text-xl font-bold text-slate-800">Your Study Material</h2>
                    </div>
                    <p className="text-slate-500 mb-4">Paste text, or upload a .txt or .pdf file. Use this for quizzes, summaries, and roadmaps.</p>
                    {error && <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                    <div className="flex items-center justify-center w-full mb-4">
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloudIcon className="w-8 h-8 mb-2 text-slate-500" />
                                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-slate-500">PDF or TXT</p>
                            </div>
                            <input id="file-upload" type="file" className="hidden" accept=".pdf,.txt,text/plain" onChange={handleFileUpload} />
                        </label>
                    </div>
                    <textarea
                      value={studyContent}
                      onChange={(e) => setStudyContent(e.target.value)}
                      placeholder="...or paste your content here."
                      className="w-full h-40 p-3 bg-slate-50 rounded-lg border border-slate-200 resize-y focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                    />
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg animate-fade-in-slide-up" style={{animationDelay: '150ms'}}>
                    <div className="border-b border-slate-200">
                      <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
                          <TabButton tool="quiz" label="Create Quiz" icon={<SparklesIcon className="w-5 h-5"/>} />
                          <TabButton tool="summary" label="Generate Summary" icon={<FileTextIcon className="w-5 h-5"/>} />
                          <TabButton tool="diagram" label="Create Diagram" icon={<NeuronIcon className="w-5 h-5"/>} />
                      </nav>
                    </div>
                    <div className="p-6">
                      {activeDashboardTool === 'quiz' && (
                          <div>
                            <p className="text-slate-500 mb-6">Configure and start a new quiz based on your material.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-600 mb-1">Question Type</label>
                                  <select value={quizSettings.type} onChange={e => setQuizSettings({...quizSettings, type: e.target.value as QuestionType})} className="w-full p-2 bg-white border border-slate-300 rounded-md">
                                      {Object.entries(QUIZ_CONFIG).map(([key, {label}]) => <option key={key} value={key}>{label}</option>)}
                                  </select>
                              </div>
                               <div>
                                  <label className="block text-sm font-medium text-slate-600 mb-1">Difficulty</label>
                                  <select value={quizSettings.difficulty} onChange={e => setQuizSettings({...quizSettings, difficulty: e.target.value})} className="w-full p-2 bg-white border border-slate-300 rounded-md">
                                      {Object.entries(QUIZ_DIFFICULTY).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                  </select>
                              </div>
                            </div>
                            <div className="mb-4">
                              <label htmlFor="topic" className="block text-sm font-medium text-slate-600 mb-1">Topic/Keyword (Optional)</label>
                              <input id="topic" type="text" value={quizSettings.topic} onChange={e => setQuizSettings({...quizSettings, topic: e.target.value})} className="w-full p-2 bg-white border border-slate-300 rounded-md" placeholder="e.g., Photosynthesis"/>
                            </div>
                             <div className="mb-6">
                              <label className="block text-sm font-medium text-slate-600 mb-2">Learning Mode</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {Object.entries(QUIZ_MODES).map(([key, {label, description}]) => (
                                      <button key={key} onClick={() => setQuizSettings({...quizSettings, mode: key as QuizMode})} className={`p-3 rounded-lg border-2 text-left transition-colors ${quizSettings.mode === key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
                                          <p className="font-semibold">{label}</p>
                                          <p className="text-xs text-slate-500">{description}</p>
                                      </button>
                                  ))}
                              </div>
                             </div>
                            <button onClick={handleStartQuiz} disabled={!studyContent || isLoading} className="w-full py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all disabled:animate-none">
                              {isLoading ? 'Generating...' : `Start ${quizSettings.mode} Quiz`}
                            </button>
                          </div>
                      )}
                      {activeDashboardTool === 'summary' && <SummaryGenerator onSave={addToHistory} studyContent={studyContent} />}
                      {activeDashboardTool === 'diagram' && <DiagramMaker onSave={addToHistory} />}
                    </div>
                  </div>
              </div>
          );
    }
  };

  if (!currentUser) {
    return <AuthPage setCurrentUser={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
        <div id="particle-container"></div>
        
        {reportToShow && (
            <ReportCard 
                analysis={reportToShow}
                quizHistory={quizHistory}
                currentUser={currentUser}
                onClose={() => setReportToShow(null)}
            />
        )}

        {/* Mobile Nav Overlay */}
        <div
            className={`fixed inset-0 bg-black/40 z-40 transition-opacity lg:hidden ${
                isNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsNavOpen(false)}
        ></div>

        {/* Navigation Sidebar */}
        <nav className={`absolute top-0 left-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex flex-col p-4 z-50 transition-transform lg:translate-x-0 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center">
                <NeuronIcon className="h-8 w-8 text-indigo-600" />
                <h1 className="ml-2 text-xl font-bold">{APP_TITLE}</h1>
              </div>
              <button onClick={() => setIsNavOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-800">
                  <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2 flex-grow overflow-y-auto">
              <NavItem targetView="dashboard" icon={<LayoutDashboardIcon className="h-5 w-5" />} label="Dashboard" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
              <NavItem targetView="whiteboard" icon={<NotebookIcon className="h-5 w-5" />} label="Whiteboard" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
              <NavItem targetView="history" icon={<HistoryIcon className="h-5 w-5" />} label="History" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
              <div className="pt-2 mt-2 border-t border-slate-200/80">
                <span className="px-4 text-xs font-semibold text-slate-400 uppercase">AI Tools</span>
              </div>
              <NavItem targetView="teacherBot" icon={<MessageCircleIcon className="h-5 w-5" />} label="AI Teacher" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
              <NavItem targetView="codeExplainer" icon={<CodeIcon className="h-5 w-5" />} label="Code Explainer" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
              <NavItem targetView="roadmap" icon={<RouteIcon className="h-5 w-5" />} label="Roadmap" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
              <NavItem targetView="codeToFlowchart" icon={<SitemapIcon className="h-5 w-5" />} label="Code-to-Flowchart" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
              <NavItem targetView="labReportWriter" icon={<FlaskConicalIcon className="h-5 w-5" />} label="Lab Report Writer" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
              <NavItem targetView="audioLab" icon={<Volume2Icon className="h-5 w-5" />} label="Audio Lab" view={view} setView={setView} setIsNavOpen={setIsNavOpen} />
            </div>

            <FocusTimer />
            
            <div className="space-y-2 p-2 border-t border-slate-200/80 mt-2">
                <div className="text-xs text-slate-400 truncate px-2" title={currentUser}>
                    Signed in as: <span className="font-medium text-slate-500">{currentUser}</span>
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={handleLogout} className="flex-1 flex items-center p-2 rounded-lg text-slate-500 hover:bg-slate-200/60">
                        <LogOutIcon className="h-5 w-5"/>
                        <span className="ml-3 text-sm">Logout</span>
                    </button>
                    <button onClick={toggleTheme} title="Toggle Theme" className="p-2 ml-2 rounded-lg text-slate-500 hover:bg-slate-200/60">
                        {theme === 'light' ? <MoonIcon className="h-5 w-5"/> : <SunIcon className="h-5 w-5"/>}
                    </button>
                </div>
            </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-1 bg-transparent overflow-hidden lg:ml-64 relative">
             <button onClick={() => setIsNavOpen(true)} className="lg:hidden absolute top-4 left-4 z-30 p-2 bg-white/50 backdrop-blur-sm rounded-full text-slate-600 shadow-md">
                <MenuIcon className="w-6 h-6" />
            </button>
            <div key={view} className="h-full w-full animate-slide-in">{renderContent()}</div>
        </main>
    </div>
  );
};

export default App;