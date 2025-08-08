import React from 'react';
import { StudyMode } from '../types';
import { PomodoroTimer } from './PomodoroTimer';

interface SidebarProps {
  currentMode: StudyMode;
  onNavigate: (mode: StudyMode) => void;
}

const NavItem: React.FC<{
  mode: StudyMode;
  currentMode: StudyMode;
  onNavigate: (mode: StudyMode) => void;
  icon: React.ReactNode;
  label: string;
}> = React.memo(({ mode, currentMode, onNavigate, icon, label }) => {
  const isActive = currentMode === mode;
  return (
    <button
      onClick={() => onNavigate(mode)}
      className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group ${
        isActive
          ? 'bg-cyan-500 text-white'
          : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'
      }`}
    >
      <span className={`w-6 h-6 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-white'}`}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
});

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, onNavigate }) => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex flex-col p-4 flex-shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="bg-cyan-500 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Study Buddy</h1>
      </div>

      <nav className="flex-grow space-y-1.5">
        <NavItem
          mode={StudyMode.Home}
          currentMode={currentMode}
          onNavigate={onNavigate}
          label="Home"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        />
        <NavItem
          mode={StudyMode.Materials}
          currentMode={currentMode}
          onNavigate={onNavigate}
          label="Materials"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M14 2v6h6"/><path d="M2 17h.01"/></svg>}
        />
        <NavItem
          mode={StudyMode.Quiz}
          currentMode={currentMode}
          onNavigate={onNavigate}
          label="Quizzes"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M17 5H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><path d="M7 17v-2"/><path d="M17 17v-2"/></svg>}
        />
        <NavItem
          mode={StudyMode.Whiteboard}
          currentMode={currentMode}
          onNavigate={onNavigate}
          label="Whiteboard"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.4 2H6.6a2 2 0 0 0-2 2v4.5a2 2 0 0 1-2 2v3a2 2 0 0 1 2 2V20a2 2 0 0 0 2 2h6.8a2 2 0 0 0 2-2v-4.5a2 2 0 0 1 2-2v-3a2 2 0 0 1-2-2V4a2 2 0 0 0-2-2Z"/><path d="m17 14 3-3-3-3"/><path d="m14 3 3 3-3 3"/></svg>}
        />
        <NavItem
          mode={StudyMode.Progress}
          currentMode={currentMode}
          onNavigate={onNavigate}
          label="Progress"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
        />
      </nav>
      
      <div className="mt-auto space-y-2">
         <NavItem
          mode={StudyMode.Settings}
          currentMode={currentMode}
          onNavigate={onNavigate}
          label="Settings"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>}
        />
        <PomodoroTimer />
      </div>

    </aside>
  );
};