export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  topic: string;
}

export interface ShortAnswerQuestion {
  question: string;
  correctAnswer: string;
  topic: string;
}

export interface QuizResult {
  question: QuizQuestion;
  userAnswerIndex: number;
  isCorrect: boolean;
}

export interface ShortAnswerResult {
  question: ShortAnswerQuestion;
  userAnswer: string;
  isCorrect: boolean;
  feedback?: string;
}


export interface ProgressData {
  scoresByTopic: { [key: string]: { correct: number; total: number } };
  streaks: {
    current: number;
    longest: number;
  };
  badges: string[];
  studyTime: { [date: string]: number }; // seconds
}

export enum StudyMode {
  Home = 'home',
  Materials = 'materials',
  Quiz = 'quiz',
  Whiteboard = 'whiteboard',
  Progress = 'progress',
  Settings = 'settings',
}

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface StudyMaterial {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string date
}


export interface ChatMessage {
    role: 'user' | 'model';
    parts: [{ text: string }];
}

export interface ReminderSettings {
    enabled: boolean;
    time: string; // HH:mm format
}