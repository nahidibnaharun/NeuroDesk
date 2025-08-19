import React, { useState, useEffect } from 'react';

interface TimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isRunning: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, isRunning }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp, isRunning]);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md text-center border">
      <div className="text-slate-500 text-sm font-medium">Time Remaining</div>
      <div className={`text-4xl font-bold tracking-tight text-slate-700 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : ''}`}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
};

export default Timer;