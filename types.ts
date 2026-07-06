export type UserRole = 'dev' | 'supervisor' | 'user';
export type Sala = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sala: Sala;
}

export interface StoredText {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
  trainedCount: number;
}

export interface Recording {
  id: string;
  userId: string;
  textId: string;
  audioUrl: string;
  transcript: string;
  analysis: AnalysisReport | null;
  createdAt: number;
}

export interface AnalysisReport {
  diction: { score: number; feedback: string; errors: { expected: string; actual: string }[] };
  rhythm: { score: number; feedback: string };
  intonation: { score: number; feedback: string };
  pauses: { score: number; feedback: string };
  overallScore: number;
  suggestions: string[];
}

export type View = 
  | 'login' 
  | 'textManager' 
  | 'teleprompter' 
  | 'analysis' 
  | 'supervisorDashboard' 
  | 'userDashboard'
  | 'userDetailView'
  | 'adminDashboard';
