import React from 'react';
import type { ProgressData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProgressViewProps {
  progress: ProgressData;
}

const Badge: React.FC<{ name: string, icon: React.ReactNode, earned: boolean }> = React.memo(({ name, icon, earned }) => (
    <div className={`flex flex-col items-center text-center p-4 rounded-lg transition-opacity ${earned ? 'bg-slate-100 dark:bg-slate-700/60 opacity-100' : 'bg-slate-50 dark:bg-slate-800/50 opacity-40'}`}>
        <div className={`mb-2 ${earned ? 'text-amber-500' : 'text-slate-500'}`}>{icon}</div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{name}</span>
    </div>
));

const allBadges: { [key: string]: { name: string, icon: React.ReactNode } } = {
    'first_quiz': { name: 'First Quiz', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z"/><path d="m9 12 2 2 4-4"/></svg> },
    'streak_3': { name: '3-Day Streak', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.1 2.1 0 1 0 0-3 2.1 2.1 0 0 0 0 3z"/><path d="m14 14-2.5 2.5"/><path d="m19.5 19.5-2.5-2.5"/><path d="m6.5 6.5-2.5-2.5"/><path d="M4 4.5 7.5 8"/><path d="M2.3 21.7a2.1 2.1 0 0 0 3 0l12-12a2.1 2.1 0 0 0 0-3l-3-3a2.1 2.1 0 0 0-3 0l-12 12a2.1 2.1 0 0 0 0 3z"/></svg> },
    'topic_master': { name: 'Topic Master', icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21v-2"/><path d="M12 15v-2"/><path d="M12 9V7"/><path d="m15 12-2-3-2 3"/><path d="m16.5 10.5-2-3-2 3"/><path d="M3.28 11.45a12.16 12.16 0 0 1 .08-1.45l-2.07-.6c-.23-.07-.38-.26-.4-.5a1.82 1.82 0 0 1 .11-1.35l1-1.73a.5.5 0 0 1 .4-.25l2.2.35c.1-.18.2-.35.32-.52l-.63-2.08a.5.5 0 0 1 .25-.6l-1.73-1a.5.5 0 0 1-.58-.07l-1.6 1.38c-.21-.1.42-.18.64-.25l.35-2.2a.5.5 0 0 1 .5-.4h2a.5.5 0 0 1 .5.4l.35 2.2c.22.07.43.15.64.25l1.6-1.38a.5.5 0 0 1 .58-.07l1.73 1a.5.5 0 0 1 .25.6l-.63 2.08c.12.17.22.34.32.52l2.2-.35a.5.5 0 0 1 .4.25l1 1.73c.1.28.05.6-.11 1.35a1.82 1.82 0 0 1-.4.5l-2.07.6c.02.48.02.97-.08 1.45l2.07.6c.23.07.38.26.4.5a1.82 1.82 0 0 1-.11 1.35l-1-1.73a.5.5 0 0 1-.4.25l-2.2-.35c-.1.18-.2.35-.32-.52l.63 2.08a.5.5 0 0 1-.25.6l-1.73 1a.5.5 0 0 1-.58-.07l-1.6-1.38c-.21.1-.42.18-.64-.25l-.35 2.2a.5.5 0 0 1-.5.4h-2a.5.5 0 0 1-.5-.4l-.35-2.2c-.22-.07-.43-.15-.64-.25l-1.6 1.38a.5.5 0 0 1-.58-.07l-1.73-1a.5.5 0 0 1-.25-.6l.63-2.08c-.12-.17-.22-.34-.32-.52l-2.2.35a.5.5 0 0 1-.4-.25l-1-1.73c-.1-.28-.05-.6.11-1.35.15-.24.25-.41.4-.5Z"/></svg> },
};

export const ProgressView: React.FC<ProgressViewProps> = ({ progress }) => {
  const chartData = Object.entries(progress.scoresByTopic).map(([name, data]) => ({
    name,
    Accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    correct: data.correct,
    total: data.total,
  }));

  const totalQuestions = chartData.reduce((acc, item) => acc + item.total, 0);
  const totalCorrect = chartData.reduce((acc, item) => acc + item.correct, 0);
  const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0';

  return (
    <div className="p-4 sm:p-6 md:p-8">
        <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">Your Progress</h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-1">Track your performance and achievements.</p>
        </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
            <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Overall Accuracy</h3>
            <p className="text-5xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{overallAccuracy}%</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
            <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Current Streak</h3>
            <p className="text-5xl font-bold text-amber-500 dark:text-amber-400 mt-2">{progress.streaks.current}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
            <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">Questions Answered</h3>
            <p className="text-5xl font-bold text-violet-600 dark:text-violet-400 mt-2">{totalQuestions}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Performance by Topic</h3>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--recharts-text-fill-color)' }} dy={10} />
                        <YAxis unit="%" tick={{ fontSize: 12, fill: 'var(--recharts-text-fill-color)' }}/>
                        <Tooltip 
                            cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                            contentStyle={{ 
                                backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                                borderColor: 'rgb(51 65 85)',
                                borderRadius: '0.75rem',
                                color: '#fff'
                            }}
                        />
                        <Bar dataKey="Accuracy" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">
                    <p>Take a quiz to see your performance!</p>
                </div>
            )}
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
                {Object.entries(allBadges).map(([key, badge]) => (
                    <Badge key={key} name={badge.name} icon={badge.icon} earned={progress.badges.includes(key)} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};