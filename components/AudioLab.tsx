import React, { useState, useEffect, useRef } from 'react';
import { generateSpokenSummary } from '../services/geminiService';
import { AudioSummaryItem } from '../types';
import { Volume2Icon, SparklesIcon, SaveIcon, PlayIcon, PauseIcon, RotateCwIcon } from './Icon';

interface AudioLabProps {
    studyContent: string;
    onSave: (item: AudioSummaryItem) => void;
}

const AudioLab: React.FC<AudioLabProps> = ({ studyContent, onSave }) => {
    const [mode, setMode] = useState<'summary' | 'fullText'>('summary');
    const [textToRead, setTextToRead] = useState('');
    const [sentences, setSentences] = useState<string[]>([]);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
    
    const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
                // Set a default voice if none is selected
                if (!selectedVoiceURI && availableVoices.length > 0) {
                    const defaultVoice = availableVoices.find(v => v.lang.startsWith('en') && v.default) || availableVoices[0];
                    setSelectedVoiceURI(defaultVoice.voiceURI);
                }
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.cancel(); // Stop any speech on component unmount
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);
    
    useEffect(() => {
        // Stop speech when text changes
        window.speechSynthesis.cancel();
        setSpeechState('idle');
        setCurrentSentenceIndex(-1);
        if (textToRead) {
            // Simple sentence splitting
            const splitSentences = textToRead.match(/[^.!?]+[.!?]+\s*/g) || [textToRead];
            setSentences(splitSentences);
        } else {
            setSentences([]);
        }
    }, [textToRead]);

    const handleGenerateSummary = async () => {
        if (!studyContent.trim()) {
            setError('Please add study material on the Dashboard first.');
            return;
        }
        setError('');
        setIsLoading(true);
        setTextToRead('');
        setIsSaved(false);
        try {
            const result = await generateSpokenSummary(studyContent);
            setTextToRead(result);
            setMode('summary');
        } catch (e: any) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReadFullText = () => {
        if (!studyContent.trim()) {
            setError('Please add study material on the Dashboard first.');
            return;
        }
        setError('');
        setTextToRead(studyContent);
        setIsSaved(true); // Cannot save "full text" as a new item
        setMode('fullText');
    };

    const handlePlay = () => {
        if (!textToRead || voices.length === 0) return;

        if (speechState === 'paused') {
            window.speechSynthesis.resume();
            setSpeechState('playing');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(textToRead);
        const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
            setSpeechState('playing');
        };

        utterance.onpause = () => {
            setSpeechState('paused');
        };
        
        utterance.onresume = () => {
            setSpeechState('playing');
        }

        utterance.onend = () => {
            setSpeechState('idle');
            setCurrentSentenceIndex(-1);
            utteranceRef.current = null;
        };
        
        utterance.onboundary = (event) => {
            if (event.name === 'sentence') {
                const charIndex = event.charIndex;
                let sentenceIdx = -1;
                let accumulatedLength = 0;
                for (let i = 0; i < sentences.length; i++) {
                    if (charIndex < accumulatedLength + sentences[i].length) {
                        sentenceIdx = i;
                        break;
                    }
                    accumulatedLength += sentences[i].length;
                }
                setCurrentSentenceIndex(sentenceIdx);
            }
        };
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const handlePause = () => {
        window.speechSynthesis.pause();
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setSpeechState('idle');
        setCurrentSentenceIndex(-1);
    };
    
    const handleSave = () => {
        if (textToRead && mode === 'summary') {
            const newItem: AudioSummaryItem = {
                id: new Date().toISOString(),
                type: 'audioSummary',
                content: textToRead,
                sourceContent: studyContent,
                timestamp: new Date().toLocaleString(),
            };
            onSave(newItem);
            setIsSaved(true);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 h-full flex flex-col">
                <div className="flex items-center mb-4">
                    <Volume2Icon className="w-6 h-6 mr-3 text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-800">Audio Lab</h2>
                </div>
                <p className="text-slate-500 mb-6">Generate audio summaries or have your full study text read aloud. Perfect for auditory learning or studying on the go.</p>

                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <button onClick={handleGenerateSummary} disabled={isLoading || !studyContent} className="flex-1 flex justify-center items-center px-6 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed transition-all disabled:animate-none">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Summarizing...' : 'Generate Audio Summary'}
                    </button>
                    <button onClick={handleReadFullText} disabled={isLoading || !studyContent} className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors">
                        Read Full Text
                    </button>
                </div>
                
                {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</div>}

                <div className="flex-grow bg-slate-50 rounded-lg p-4 border border-slate-200 overflow-y-auto min-h-[200px] text-slate-700 leading-relaxed">
                    {isLoading ? (
                         <div className="flex flex-col justify-center items-center h-full">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-1"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-2"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full dot-3"></div>
                            </div>
                            <p className="mt-4 text-slate-500">AI is creating your audio summary...</p>
                        </div>
                    ) : sentences.length > 0 ? (
                        <p>
                            {sentences.map((sentence, index) => (
                                <span key={index} className={index === currentSentenceIndex ? 'speaking-highlight' : ''}>
                                    {sentence}
                                </span>
                            ))}
                        </p>
                    ) : (
                         <p className="text-slate-400 text-center mt-8">Your text will appear here. Generate a summary or select "Read Full Text" to begin.</p>
                    )}
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm border-t border-slate-200 -mx-6 -mb-8 mt-4 px-6 py-4 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <select
                        value={selectedVoiceURI}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        className="w-full sm:w-auto sm:max-w-xs text-sm p-2 bg-white border border-slate-300 rounded-md"
                        disabled={voices.length === 0}
                    >
                        {voices.map(voice => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                                {voice.name} ({voice.lang})
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center gap-3">
                        <button onClick={handleStop} title="Stop" className="p-2 rounded-full text-slate-500 hover:bg-slate-200/80 hover:text-slate-700 transition-colors" disabled={speechState === 'idle'}>
                            <RotateCwIcon className="w-5 h-5"/>
                        </button>
                        {speechState !== 'playing' ? (
                            <button onClick={handlePlay} title="Play" className="p-3 rounded-full animated-gradient-bg text-white shadow-lg transition-all" disabled={!textToRead || voices.length === 0}>
                                <PlayIcon className="w-6 h-6"/>
                            </button>
                        ) : (
                            <button onClick={handlePause} title="Pause" className="p-3 rounded-full animated-gradient-bg text-white shadow-lg transition-all">
                                <PauseIcon className="w-6 h-6"/>
                            </button>
                        )}
                    </div>
                     {mode === 'summary' && textToRead && (
                        <button onClick={handleSave} disabled={isSaved} className="px-4 py-2 text-sm font-medium rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-green-100 disabled:text-green-500 bg-green-100 text-green-700 hover:bg-green-200">
                           <SaveIcon className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                           {isSaved ? 'Saved' : 'Save Summary'}
                        </button>
                     )}
                </div>
            </div>
        </div>
    );
};

export default AudioLab;
