import React, { useState, useEffect, useRef } from 'react';
import { startTutorChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import type { Chat } from '@google/genai';

interface TutorViewProps {
  sourceText: string;
}

const TypingIndicator = () => (
    <div className="flex items-center space-x-1.5 p-4">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
    </div>
);


export const TutorView: React.FC<TutorViewProps> = ({ sourceText }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newChat = startTutorChat(sourceText);
        setChat(newChat);
        setMessages([{
            role: 'model',
            parts: [{ text: "Hello! I'm your AI tutor. Ask me anything about your study material." }]
        }]);
    }, [sourceText]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading) return;

        const text = userInput.trim();
        setUserInput('');
        const userMessage: ChatMessage = { role: 'user', parts: [{ text }] };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        
        try {
            const stream = await chat.sendMessageStream({ message: text });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: modelResponse }] };
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-[70vh] flex flex-col">
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0 text-white shadow">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M12 9a3 3 0 0 0-3 3v2.89A5.02 5.02 0 0 0 8.4 20.9a5 5 0 0 0 7.2 0 5.02 5.02 0 0 0-1.6-6.01V12a3 3 0 0 0-3-3Z"/></svg>
                            </div>
                        )}
                        <div className={`max-w-lg p-3 rounded-2xl prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed break-words ${
                            msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-lg shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-lg shadow'
                        }`}>
                            {msg.parts[0].text}
                        </div>
                         {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0 text-slate-800 dark:text-slate-100 shadow">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && <div className="flex items-start gap-3"><div className="w-8 h-8"></div><TypingIndicator/></div> }
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 mt-auto">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:bg-cyan-400 dark:disabled:bg-slate-600 transition-all duration-200 shadow hover:shadow-lg transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};