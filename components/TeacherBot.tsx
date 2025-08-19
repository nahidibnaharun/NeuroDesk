import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateTeacherResponse } from '../services/geminiService';
import { HistoryItem, ChatMessage, ChatHistoryItem } from '../types';
import { simpleMarkdownToHtml } from '../utils/formatters';
import { AiTeacherIcon, SparklesIcon, ArrowLeftIcon, ArrowRightIcon, PaperclipIcon, XIcon } from './Icon';
import HistoryPickerModal from './HistoryPickerModal';

interface TeacherMode {
    icon: string;
    title: string;
    description: string;
    greeting: string;
    systemInstruction: string;
}

const teacherModes: TeacherMode[] = [
  {
    icon: '📘',
    title: 'Explainer Mode',
    description: 'Explains topics step by step in simple language.',
    greeting: "Explainer Mode activated! What complex topic can I simplify for you today?",
    systemInstruction: 'You are an expert explainer. Your goal is to break down complex topics into simple, easy-to-understand steps. Use analogies and clear language. Avoid jargon where possible.'
  },
  {
    icon: '🧠',
    title: 'Quiz Master Mode',
    description: 'Asks you questions, evaluates answers, and gives hints.',
    greeting: "Welcome to the Quiz Zone! Tell me a topic, and I'll test your knowledge.",
    systemInstruction: "You are a quiz master. Your role is to test the user's knowledge on a topic. Ask questions, evaluate their answers, and provide constructive feedback and hints. Make it engaging."
  },
  {
    icon: '🧑‍🏫',
    title: 'Socratic Mode',
    description: 'Teaches by asking guiding questions instead of giving direct answers.',
    greeting: "Socratic Mode engaged. Let's explore your understanding together. What question is on your mind?",
    systemInstruction: 'You are a teacher using the Socratic method. Your goal is to guide the user to their own conclusions by asking thought-provoking questions. Do not give direct answers. Instead, respond to questions with more questions that lead them to the answer.'
  },
  {
    icon: '📚',
    title: 'Study Buddy Mode',
    description: 'Casual, supportive, helps with summaries, flashcards, or motivation.',
    greeting: "Hey there! Ready to tackle some studying together? I'm here to help with summaries, motivation, or anything else!",
    systemInstruction: "You are a friendly and supportive study buddy. Your tone is casual and encouraging. Help the user by summarizing content, creating flashcards, or just providing motivation. Be their partner in learning."
  },
  {
    icon: '💻',
    title: 'Code Mentor Mode',
    description: 'Explains programming concepts, fixes bugs, and suggests improvements.',
    greeting: "Code Mentor online. Show me your code, and let's make it shine. What are we working on?",
    systemInstruction: 'You are an expert code mentor. You help users understand programming concepts, debug their code, and suggest improvements for best practices, performance, and readability. Be clear and provide code examples.'
  },
  {
    icon: '📝',
    title: 'Assignment Helper Mode',
    description: 'Guides how to structure essays, reports, or lab work.',
    greeting: "Assignment Helper at your service. Let's plan out your work. What's the assignment about?",
    systemInstruction: 'You are an academic assignment helper. Your role is to guide users on how to structure their essays, reports, or lab work. Help them with outlines, thesis statements, and formatting, but do not write the assignment for them.'
  },
  {
    icon: '🎯',
    title: 'Focus Coach Mode',
    description: 'Helps plan study schedules, sets daily goals, and tracks progress.',
    greeting: "Focus Coach ready. Let's set some goals and build a productive study plan. What's our main objective for today?",
    systemInstruction: 'You are a focus and productivity coach. Your goal is to help the user plan their study schedule, set achievable daily goals, and track their progress. Provide tips on time management and staying focused.'
  },
  {
    icon: '🎮',
    title: 'Gamified Teacher Mode',
    description: 'Teaches with challenges, points, and levels (fun learning).',
    greeting: "Level 1: Start! Ready to earn some XP and level up your knowledge? What's our first quest?",
    systemInstruction: 'You are a gamified teacher. You make learning fun by creating challenges, awarding points, and using levels. Frame your explanations and questions in a game-like manner to keep the user engaged.'
  },
  {
    icon: '🎤',
    title: 'Interview Prep Mode',
    description: 'Acts like an interviewer, asking technical/HR questions.',
    greeting: "Interview Prep Mode initiated. Tell me the role you're practicing for, and we'll begin the mock interview.",
    systemInstruction: "You are an interviewer preparing a candidate for a job. You can act as a technical interviewer or an HR interviewer. Ask relevant questions based on the user's desired role and provide feedback on their answers."
  },
  {
    icon: '🔍',
    title: 'Research Guide Mode',
    description: 'Helps find, summarize, and simplify articles or research papers.',
    greeting: "Research Guide activated. Point me to your papers or topics, and I'll help you dissect the information.",
    systemInstruction: 'You are a research guide. Your purpose is to help users find, summarize, and simplify academic articles, research papers, and other scholarly sources. Help them understand complex studies and identify key findings.'
  },
];

interface TeacherBotProps {
    history: HistoryItem[];
    onSave: (item: HistoryItem) => void;
    initialChat: ChatHistoryItem | null;
    onChatEnd: () => void;
}

const ChatInterface: React.FC<{
    mode: TeacherMode;
    initialMessages: ChatMessage[];
    historyContext: HistoryItem[]; // Can be full history or selected items
    isSavedInitially: boolean;
    onSave: (messages: ChatMessage[], modeTitle: string) => void;
    onExit: () => void;
}> = ({ mode, initialMessages, historyContext, isSavedInitially, onSave, onExit }) => {
    const [userInput, setUserInput] = useState('');
    const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>(initialMessages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(isSavedInitially);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [currentMessages]);
    
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            setIsSaved(false);
        }
    }, [currentMessages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newMessages: ChatMessage[] = [...currentMessages, { role: 'user', content: userInput }];
        setCurrentMessages(newMessages);
        setUserInput('');
        setIsLoading(true);
        setError('');

        try {
            const response = await generateTeacherResponse(newMessages, historyContext, mode.systemInstruction);
            setCurrentMessages(prev => [...prev, { role: 'model', content: response }]);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if(currentMessages.length > 1) { 
            onSave(currentMessages, mode.title);
            setIsSaved(true);
        }
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center">
                    <span className="text-3xl mr-3">{mode.icon}</span>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{mode.title}</h2>
                        <button onClick={onExit} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                            &larr; Change Mode
                        </button>
                    </div>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaved}
                    className="px-4 py-2 text-sm font-medium rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-green-100 disabled:text-green-500 bg-green-100 text-green-700 hover:bg-green-200"
                >
                    {isSaved ? 'Saved ✓' : 'Save Chat'}
                </button>
            </div>

            <div ref={chatContainerRef} className="flex-grow bg-slate-50 rounded-lg p-4 border border-slate-200 overflow-y-auto mb-4 space-y-4">
                {currentMessages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 animate-fade-in-slide-up ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'model' && <AiTeacherIcon mood="neutral" className="w-10 h-10 flex-shrink-0" />}
                        <div className={`max-w-xl rounded-lg px-4 py-2 text-sm shadow-sm ${message.role === 'model' ? 'bg-white text-slate-800 border border-slate-200' : 'bg-indigo-500 text-white'}`}>
                            <div className="prose prose-sm max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(message.content) }} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3 animate-fade-in-slide-up">
                        <AiTeacherIcon mood="neutral" className="w-10 h-10 flex-shrink-0" />
                         <div className="max-w-xl rounded-lg px-4 py-2 text-sm shadow-sm bg-white text-slate-800 border border-slate-200">
                            <div className="flex items-center justify-center space-x-1 p-2">
                                <div className="w-2 h-2 bg-slate-500 rounded-full dot-1"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full dot-2"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full dot-3"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
             {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}
             <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask your question here..."
                    className="flex-grow p-3 rounded-lg border-2 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !userInput.trim()} className="flex justify-center items-center px-6 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all disabled:animate-none">
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {isLoading ? 'Thinking...' : 'Send'}
                </button>
            </form>
        </div>
    );
};


const TeacherBot: React.FC<TeacherBotProps> = ({ history, onSave, initialChat, onChatEnd }) => {
    const [selectedMode, setSelectedMode] = useState<TeacherMode | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatId, setChatId] = useState<string | null>(null);
    const [contextItems, setContextItems] = useState<HistoryItem[]>([]);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const sliderRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollButtons = useCallback(() => {
        if (sliderRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
            setCanScrollLeft(scrollLeft > 5);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
        }
    }, []);

    useEffect(() => {
        if (initialChat) {
            const mode = teacherModes.find(m => m.title === initialChat.modeTitle) || teacherModes[3];
            setSelectedMode(mode);
            setMessages(initialChat.messages);
            setChatId(initialChat.id);
        }
        return () => onChatEnd();
    }, [initialChat, onChatEnd]);

    useEffect(() => {
        const timer = setTimeout(checkScrollButtons, 100);
        window.addEventListener('resize', checkScrollButtons);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [checkScrollButtons]);

    const handleSelectMode = (mode: TeacherMode) => {
        setSelectedMode(mode);
        let greeting = mode.greeting;
        if (contextItems.length > 0) {
            greeting = `I see you've added context from ${contextItems.length} item(s) from your history. ${mode.greeting}`;
        }
        setMessages([{ role: 'model', content: greeting }]);
        setChatId(new Date().toISOString());
    };
    
    const handleSaveChat = (updatedMessages: ChatMessage[], modeTitle: string) => {
        if (!chatId) return;
        const newItem: ChatHistoryItem = {
            id: chatId,
            type: 'chat',
            messages: updatedMessages,
            timestamp: new Date().toLocaleString(),
            modeTitle: modeTitle
        };
        onSave(newItem);
    };

    const handleExitChat = () => {
        setSelectedMode(null);
        setMessages([]);
        setChatId(null);
        setContextItems([]); // Also clear context on exit
    };

    const handleConfirmContextSelection = (selectedItems: HistoryItem[]) => {
        setContextItems(selectedItems);
        setIsPickerOpen(false);
    };

    const scroll = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const scrollAmount = sliderRef.current.clientWidth * 0.8;
            sliderRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };
    
    if (selectedMode) {
        const isAlreadySaved = initialChat ? history.some(h => h.id === initialChat.id) : false;
        // If continuing chat, context is the full history. If starting new, it's the selected items.
        const historyForContext = initialChat ? history : contextItems;

        return (
            <div className="p-4 sm:p-6 md:p-8 h-full">
                <ChatInterface 
                    mode={selectedMode}
                    initialMessages={messages}
                    historyContext={historyForContext}
                    isSavedInitially={isAlreadySaved}
                    onSave={handleSaveChat}
                    onExit={handleExitChat}
                />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col justify-center items-center">
            <div className="text-center mb-6 animate-fade-in-slide-up">
                <h1 className="text-4xl font-bold text-slate-800">Choose your AI Teacher</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">Select a mode below, or add context from your history to start a specialized conversation.</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-lg p-3 mb-6 flex items-center justify-center gap-4 animate-fade-in-slide-up" style={{ animationDelay: '100ms' }}>
                 <button onClick={() => setIsPickerOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors">
                    <PaperclipIcon className="w-4 h-4" />
                    Add Context from History
                </button>
                {contextItems.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                        <span>{contextItems.length} item(s) selected</span>
                        <button onClick={() => setContextItems([])} className="p-0.5 rounded-full hover:bg-slate-300">
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            <div className="w-full max-w-7xl relative">
                 {canScrollLeft && (
                    <button onClick={() => scroll('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border hover:bg-slate-100 transition-all">
                        <ArrowLeftIcon className="w-6 h-6 text-slate-600"/>
                    </button>
                 )}
                <div ref={sliderRef} onScroll={checkScrollButtons} className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6" style={{ scrollbarWidth: 'none' }}>
                    {teacherModes.map((mode, index) => (
                        <div key={mode.title} className="snap-center flex-shrink-0 w-[80%] sm:w-[45%] md:w-[30%] animate-fade-in-slide-up" style={{ animationDelay: `${index * 75}ms` }}>
                            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 h-full flex flex-col justify-between hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                                <div>
                                    <span className="text-5xl">{mode.icon}</span>
                                    <h3 className="text-xl font-bold text-slate-800 mt-4">{mode.title}</h3>
                                    <p className="text-slate-500 mt-2 text-sm h-16">{mode.description}</p>
                                </div>
                                <button onClick={() => handleSelectMode(mode)} className="mt-6 w-full px-4 py-2 animated-gradient-bg text-white font-semibold rounded-lg shadow-md hover:scale-105 transition-transform">
                                    Start Chat
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {canScrollRight && (
                    <button onClick={() => scroll('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border hover:bg-slate-100 transition-all">
                        <ArrowRightIcon className="w-6 h-6 text-slate-600"/>
                    </button>
                )}
            </div>
            <HistoryPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onConfirmSelection={handleConfirmContextSelection}
                history={history}
                selectionMode="multiple"
                confirmButtonText="Add Context"
            />
        </div>
    );
};

export default TeacherBot;