
import React, { useState, useEffect, useCallback } from 'react';

const WORK_MINUTES = 25 * 60;
const BREAK_MINUTES = 5 * 60;

export const PomodoroTimer: React.FC = () => {
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [timeLeft, setTimeLeft] = useState(WORK_MINUTES);
    const [isActive, setIsActive] = useState(false);

    const handleTimerEnd = useCallback(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Time for a ${mode === 'work' ? 'break' : 'session'}!`);
        }
        
        if (mode === 'work') {
            setMode('break');
            setTimeLeft(BREAK_MINUTES);
        } else {
            setMode('work');
            setTimeLeft(WORK_MINUTES);
        }
        setIsActive(false);
    }, [mode]);


    useEffect(() => {
        let interval: number | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            handleTimerEnd();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, handleTimerEnd]);
    
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('work');
        setTimeLeft(WORK_MINUTES);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const totalDuration = mode === 'work' ? WORK_MINUTES : BREAK_MINUTES;
    const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

    return (
         <div className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold uppercase ${mode === 'work' ? 'text-cyan-600 dark:text-cyan-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{mode}</span>
                    <span className="text-lg font-mono font-semibold text-slate-700 dark:text-slate-100">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTimer} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1" aria-label={isActive ? "Pause timer" : "Start timer"}>
                        {isActive ? 
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : 
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        }
                    </button>
                    <button onClick={resetTimer} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1" aria-label="Reset timer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
                    </button>
                </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1 mt-2">
                <div className={`h-1 rounded-full transition-all duration-500 ${mode === 'work' ? 'bg-cyan-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};
