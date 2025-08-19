export enum QuestionType {
  MultipleChoice = 'MultipleChoice',
  TrueFalse = 'TrueFalse',
  FillInTheBlank = 'FillInTheBlank',
  OpenEnded = 'OpenEnded',
}

export interface MCQ {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  hint?: string;
}

export interface TrueFalse {
  question: string;
  answer: boolean;
  explanation: string;
  hint?: string;
}

export interface FillInTheBlank {
  question: string;
  answer: string;
  explanation: string;
  hint?: string;
}

export interface OpenEnded {
  question: string;
  idealAnswer: string; // Used by AI for grading
  explanation: string;
  hint?: string;
}

export type Question = (MCQ | TrueFalse | FillInTheBlank | OpenEnded) & { type: QuestionType };

export enum QuizMode {
  Practice = 'Practice',
  Test = 'Test',
}

export interface AnswerFeedback {
  isCorrect: boolean;
  feedbackText: string;
}

export interface QuizResult {
  score: number;
  total: number;
  mode: QuizMode;
  questions: Question[];
  userAnswers: (string | boolean | null)[];
  confidenceLevels: (number | null)[];
  feedback?: (AnswerFeedback | null)[]; // Optional feedback for graded questions
}

export interface WeakAreaAnalysis {
  weakAreas: string[];
  message: string;
}

export interface SummaryItem {
  type: 'summary';
  id: string;
  content: string;
  sourceContent: string;
  timestamp: string;
}

export interface DiagramItem {
  type: 'diagram';
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: string;
}

export interface QuizHistoryItem {
  type: 'quiz';
  id: string;
  result: QuizResult;
  timestamp: string;
  sourceContent: string;
}

export interface LabReportItem {
  type: 'labReport';
  id: string;
  content: string; // The generated report
  sourceCode: string;
  sourceResults: string;
  timestamp: string;
}

export interface CodeExplanationItem {
    type: 'codeExplanation';
    id: string;
    content: string;
    sourceCode: string;
    timestamp: string;
}

export enum NodeStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
}

// This is what the AI generates
export interface AIGeneratedRoadmapNode {
  title: string;
  description: string;
  resources: string[];
  subNodes?: AIGeneratedRoadmapNode[];
}

// This is what the app uses, with state
export interface RoadmapNode extends AIGeneratedRoadmapNode {
  id: string;
  status: NodeStatus;
  notes: string;
  isExpanded: boolean;
  subNodes: RoadmapNode[]; // Override to use the stateful version
}

export interface RoadmapItem {
    type: 'roadmap';
    id: string;
    nodes: RoadmapNode[]; // The root nodes
    sourceContent: string;
    timestamp: string;
}

export enum FlowchartNodeType {
    Start = 'start',
    End = 'end',
    Process = 'process',
    Decision = 'decision',
    InputOutput = 'io',
}

export interface FlowchartNode {
    id: string;
    type: FlowchartNodeType;
    content: string;
    // For process/io/start, one connection. For decision, two. For end, zero.
    connections: { targetId: string; label?: string; }[];
}

export interface CodeFlowchartItem {
    type: 'codeFlowchart';
    id: string;
    flowchartData: FlowchartNode[];
    sourceCode: string;
    timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatHistoryItem {
  type: 'chat';
  id: string;
  messages: ChatMessage[];
  timestamp: string;
  modeTitle?: string;
}

export interface AudioSummaryItem {
  type: 'audioSummary';
  id: string;
  content: string; // The generated summary text
  sourceContent: string;
  timestamp: string;
}


export type HistoryItem = SummaryItem | DiagramItem | QuizHistoryItem | LabReportItem | CodeExplanationItem | RoadmapItem | CodeFlowchartItem | ChatHistoryItem | AudioSummaryItem;