import React from 'react';
import type { QuizDifficulty, ReminderSettings } from '../types';

interface SettingsViewProps {
  theme: string;
  setTheme: (theme: string) => void;
  defaultDifficulty: QuizDifficulty;
  setDefaultDifficulty: (difficulty: QuizDifficulty) => void;
  reminderSettings: ReminderSettings;
  setReminderSettings: (settings: ReminderSettings) => void;
}

const ThemeToggle: React.FC<{ theme: string; setTheme: (theme: string) => void }> = ({ theme, setTheme }) => {
    const options = [
        { value: 'light', label: 'Light', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> },
        { value: 'dark', label: 'Dark', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> },
        { value: 'system', label: 'System', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg> },
    ];
  return (
      <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
          {options.map(option => (
               <button 
                key={option.value}
                onClick={() => setTheme(option.value)} 
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${theme === option.value ? 'bg-white text-cyan-600 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600/50'}`}
               >
                   {option.icon}
                   {option.label}
              </button>
          ))}
      </div>
  );
};

const DifficultyToggle: React.FC<{ difficulty: QuizDifficulty, setDifficulty: (d: QuizDifficulty) => void }> = ({ difficulty, setDifficulty }) => {
    const options: QuizDifficulty[] = ['Easy', 'Medium', 'Hard'];
    return (
        <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
            {options.map(option => (
                 <button 
                  key={option}
                  onClick={() => setDifficulty(option)} 
                  className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${difficulty === option ? 'bg-white text-cyan-600 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600/50'}`}
                 >
                     {option}
                </button>
            ))}
        </div>
    );
};

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    theme, setTheme,
    defaultDifficulty, setDefaultDifficulty,
    reminderSettings, setReminderSettings
}) => {

    const handleReminderToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = e.target.checked;
        if (enabled && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        setReminderSettings({ ...reminderSettings, enabled });
    };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">Settings</h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-1">Customize your study experience.</p>
      </header>

      <div className="space-y-8">
        <section className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Appearance</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Choose how Study Buddy looks.</p>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </section>

        <section className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Daily Study Reminders</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Set a daily reminder to stay on track.</p>
           <div className="flex items-center justify-between gap-4">
               <div className="flex items-center">
                    <input 
                        type="checkbox"
                        id="reminder-enabled"
                        checked={reminderSettings.enabled}
                        onChange={handleReminderToggle}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label htmlFor="reminder-enabled" className="ml-3 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Enable notifications
                    </label>
               </div>
               <input 
                    type="time"
                    value={reminderSettings.time}
                    onChange={e => setReminderSettings({...reminderSettings, time: e.target.value})}
                    disabled={!reminderSettings.enabled}
                    className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition text-slate-900 dark:text-slate-100 disabled:opacity-50"
               />
           </div>
           {Notification.permission === 'denied' && reminderSettings.enabled && (
               <p className="text-xs text-red-500 mt-2">Notifications are blocked. Please enable them in your browser settings.</p>
           )}
        </section>

         <section className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Default Quiz Difficulty</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Adjust the default difficulty of generated quizzes.</p>
          <DifficultyToggle difficulty={defaultDifficulty} setDifficulty={setDefaultDifficulty} />
        </section>
      </div>
    </div>
  );
};