export type Page = 'home' | 'game' | 'tutor' | 'progress' | 'lab';

export enum Difficulty {
  BEGINNER = 'מתחיל',
  INTERMEDIATE = 'מתקדם',
  ADVANCED = 'אלוף'
}

export enum Topic {
  ADDITION = 'חיבור',
  SUBTRACTION = 'חיסור',
  MULTIPLICATION = 'כפל',
  DIVISION = 'חילוק',
  FRACTIONS = 'שברים'
}

export type GameMode = 'quiz' | 'speed' | 'tower';

export interface TopicStats {
  correct: number;
  total: number;
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  coins: number;
  gamesPlayed: number;
  correctAnswers: number;
  topicPerformance: Record<Topic, TopicStats>;
  lastAnalysisDate?: string;
}

export interface MathProblem {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: Topic;
  difficulty: Difficulty;
  isChallenge?: boolean; // New field for AI bonus questions
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}