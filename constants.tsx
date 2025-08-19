import { QuestionType, QuizMode } from './types';

export const APP_TITLE = "NeuroDesk";

export const QUIZ_CONFIG = {
  [QuestionType.MultipleChoice]: { label: 'Multiple Choice' },
  [QuestionType.TrueFalse]: { label: 'True / False' },
  [QuestionType.FillInTheBlank]: { label: 'Fill in the Blank' },
  [QuestionType.OpenEnded]: { label: 'Open-Ended' },
};

export const QUIZ_DIFFICULTY = {
  Easy: 'Easy',
  Medium: 'Medium',
  Hard: 'Hard',
};

export const QUIZ_MODES = {
  [QuizMode.Practice]: { label: 'Practice Mode', description: 'Get instant feedback after each question. No timer.' },
  [QuizMode.Test]: { label: 'Test Mode', description: 'Answer all questions under a time limit. See score at the end.' },
};

export const TEST_DURATION_SECONDS = 300; // 5 minutes

export const LOADING_MESSAGES = [
  "Brewing up some questions...",
  "Analyzing your study material...",
  "Consulting the AI professor...",
  "Getting the knowledge bits ready...",
  "Sharpening our virtual pencils...",
  "Grading your open-ended answers...",
  "Analyzing your weak spots...",
  "Preparing your focus plan...",
  "Almost there, stay focused!",
];

export const CONFIDENCE_LEVELS: { [key: number]: string } = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
};
