import React from 'react';
import { StudyMode, type ProgressData } from '../types';

interface HomeViewProps {
  progress: ProgressData;
  activeMaterial: boolean;
  onNavigate: (mode: StudyMode) => void;
  onGenerate: (type: 'tutor' | 'quiz') => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number, color: string }> = React.memo(({ icon, label, value, color }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-transparent hover:border-cyan-500/50 dark:border-slate-700 dark:hover:border-cyan-500/50 transition-all duration-300">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    </div>
));

const ActionCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void, disabled?: boolean }> = React.memo(({ icon, title, description, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-transparent hover:border-cyan-500 dark:border-slate-700 dark:hover:border-cyan-500 text-left w-full transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
        <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-cyan-500">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
        </div>
    </button>
));


export const HomeView: React.FC<HomeViewProps> = ({ progress, onNavigate, onGenerate, activeMaterial }) => {
    const today = new Date().toISOString().split('T')[0];
    const studyTimeToday = progress.studyTime?.[today] ? Math.round(progress.studyTime[today] / 60) : 0;
    
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">Good afternoon, Alex!</h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-1">Ready to start a productive study session?</p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M17.7 7.7a2.1 2.1 0 1 0 0-3 2.1 2.1 0 0 0 0 3z"/><path d="m14 14-2.5 2.5"/><path d="m19.5 19.5-2.5-2.5"/><path d="m6.5 6.5-2.5-2.5"/><path d="M4 4.5 7.5 8"/><path d="M2.3 21.7a2.1 2.1 0 0 0 3 0l12-12a2.1 2.1 0 0 0 0-3l-3-3a2.1 2.1 0 0 0-3 0l-12 12a2.1 2.1 0 0 0 0 3z"/></svg>}
                    label="Current Streak"
                    value={`${progress.streaks.current} days`}
                    color="bg-amber-500"
                />
                 <StatCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4l2 2"/></svg>}
                    label="Studied Today"
                    value={`${studyTimeToday} min`}
                    color="bg-sky-500"
                />
                 <StatCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M12 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/><path d="M12 15a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M12 15a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                    label="Badges Earned"
                    value={progress.badges.length}
                    color="bg-violet-500"
                />
            </section>
            
            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ActionCard 
                        title="Add New Material"
                        description="Upload or paste notes to get started."
                        onClick={() => onNavigate(StudyMode.Materials)}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>}
                    />
                    <ActionCard 
                        title="Review Progress"
                        description="Check your stats and topic mastery."
                        onClick={() => onNavigate(StudyMode.Progress)}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
                    />
                     <ActionCard 
                        title="Take a Quiz"
                        description="Test your knowledge on your active material."
                        onClick={() => onGenerate('quiz')}
                        disabled={!activeMaterial}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M17 5H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><path d="M7 17v-2"/><path d="M17 17v-2"/></svg>}
                    />
                     <ActionCard 
                        title="Focus with AI Tutor"
                        description="Ask questions about your active material."
                        onClick={() => onGenerate('tutor')}
                        disabled={!activeMaterial}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>}
                    />
                </div>
            </section>
        </div>
    );
};