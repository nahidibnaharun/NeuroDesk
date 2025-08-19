import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, RotateCwIcon, SettingsIcon } from './Icon';

const FocusTimer: React.FC = () => {
    const [durationMinutes, setDurationMinutes] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        setIsRunning(false);
                        console.log("Time's up! Great focus session.");
                        // Reset to original duration
                        return durationMinutes * 60; 
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, durationMinutes]);

    const handleToggle = () => {
        if (timeLeft > 0) {
            setIsRunning(!isRunning);
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(durationMinutes * 60);
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newDuration = parseInt(e.target.value, 10);
        if (isNaN(newDuration) || newDuration < 1) {
            newDuration = 1;
        }
        setDurationMinutes(newDuration);
        if (!isRunning) {
            setTimeLeft(newDuration * 60);
        }
    };

    const minutesStr = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secondsStr = String(timeLeft % 60).padStart(2, '0');

    return (
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-lg p-4 text-center mt-4">
            <h3 className="font-semibold text-slate-700 mb-3">Focus Timer</h3>
            
            <div className="font-mono text-4xl font-bold text-slate-800 tracking-wider my-2 tabular-nums">
                <span key={`m1-${minutesStr[0]}`} className="digit-animation">{minutesStr[0]}</span>
                <span key={`m2-${minutesStr[1]}`} className="digit-animation">{minutesStr[1]}</span>
                <span className="mx-1 relative -top-1">:</span>
                <span key={`s1-${secondsStr[0]}`} className="digit-animation">{secondsStr[0]}</span>
                <span key={`s2-${secondsStr[1]}`} className="digit-animation">{secondsStr[1]}</span>
            </div>

            <div className="flex justify-center items-center gap-3 mt-4">
                <button onClick={handleReset} title="Reset" className="p-2 rounded-full text-slate-500 hover:bg-slate-200/80 hover:text-slate-700 transition-colors">
                    <RotateCwIcon className="w-5 h-5"/>
                </button>
                <button onClick={handleToggle} title={isRunning ? "Pause" : "Play"} className="p-3 rounded-full animated-gradient-bg text-white shadow-lg transition-all">
                    {isRunning ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                </button>
                <button onClick={() => setIsEditing(!isEditing)} title="Settings" className="p-2 rounded-full text-slate-500 hover:bg-slate-200/80 hover:text-slate-700 transition-colors">
                    <SettingsIcon className="w-5 h-5"/>
                </button>
            </div>
            
            {isEditing && (
                 <div className="mt-4 animate-fade-in-slide-up">
                    <label htmlFor="duration" className="block text-sm font-medium text-slate-600 mb-1">
                        Duration (minutes)
                    </label>
                    <input
                        id="duration"
                        type="number"
                        value={durationMinutes}
                        onChange={handleSettingsChange}
                        className="w-full p-2 text-center bg-white border border-slate-300 rounded-md"
                        min="1"
                    />
                </div>
            )}
        </div>
    );
};

export default FocusTimer;