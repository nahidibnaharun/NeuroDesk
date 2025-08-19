import React, { useState } from 'react';
import { APP_TITLE } from '../constants';
import { NeuronIcon } from './Icon';

type AuthView = 'login' | 'signup';

const AuthPage: React.FC<{ setCurrentUser: (user: string) => void }> = ({ setCurrentUser }) => {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const users = JSON.parse(localStorage.getItem('studyBuddyUsers') || '{}');
      if (users[email] && users[email] === password) {
          setAuthError('');
          sessionStorage.setItem('currentUser', email);
          setCurrentUser(email);
      } else {
          setAuthError('Invalid email or password.');
      }
  };

  const handleSignUp = (e: React.FormEvent) => {
      e.preventDefault();
      if(!email || !password) {
          setAuthError("Email and password cannot be empty.");
          return;
      }
      const users = JSON.parse(localStorage.getItem('studyBuddyUsers') || '{}');
      if (users[email]) {
          setAuthError('An account with this email already exists.');
      } else {
          users[email] = password;
          localStorage.setItem('studyBuddyUsers', JSON.stringify(users));
          setAuthError('');
          sessionStorage.setItem('currentUser', email);
          setCurrentUser(email);
      }
  };

  return (
      <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
              <div className="text-center mb-8 animate-fade-in-slide-up">
                  <NeuronIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold text-slate-900">{APP_TITLE}</h1>
                  <p className="text-slate-500 mt-2">
                      {authView === 'login' ? 'Welcome back! Please sign in to continue.' : 'Create an account to get started.'}
                  </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-200 animate-fade-in-slide-up" style={{animationDelay: '100ms'}}>
                  <form onSubmit={authView === 'login' ? handleLogin : handleSignUp}>
                      {authError && <p className="text-red-500 text-sm text-center mb-4">{authError}</p>}
                      <div className="mb-4">
                          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                          <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="you@example.com" required />
                      </div>
                      <div className="mb-6">
                          <label htmlFor="password"
                                 className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border bg-white text-slate-900 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="••••••••" required />
                      </div>
                      <button
                          type="submit"
                          className="w-full px-8 py-3 animated-gradient-bg text-white font-bold rounded-lg shadow-md transition-all"
                      >
                         {authView === 'login' ? 'Sign In' : 'Create Account'}
                      </button>
                  </form>
                  <p className="text-center text-sm text-slate-500 mt-6">
                      {authView === 'login' ? "Don't have an account?" : "Already have an account?"}
                      <button onClick={() => { setAuthView(authView === 'login' ? 'signup' : 'login'); setAuthError(''); }} className="font-medium text-indigo-600 hover:underline ml-1">
                          {authView === 'login' ? 'Sign up' : 'Sign in'}
                      </button>
                  </p>
              </div>
          </div>
      </div>
  );
};

export default AuthPage;
