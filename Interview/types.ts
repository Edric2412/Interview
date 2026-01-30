export enum AppStep {
  UPLOAD = 'UPLOAD',
  SELECT_SKILLS = 'SELECT_SKILLS',
  INTERVIEW = 'INTERVIEW',
  SUMMARY = 'SUMMARY'
}

export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'other';
  selected: boolean;
}

export interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  feedback?: string; // Only for user messages evaluated by AI
  score?: number; // 1-10
}

export interface InterviewState {
  currentQuestionIndex: number;
  totalQuestions: number;
  isProcessing: boolean;
  isPlayingAudio: boolean;
}