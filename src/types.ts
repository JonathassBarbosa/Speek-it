/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TextTemplate {
  id: string;
  title: string;
  content: string;
  category: string; // 'onboarding', 'vendas', 'motivacional', 'treino_rapido', etc.
  isFavorite: boolean;
  isTrained: boolean;
  estimatedDuration: number; // in seconds
  createdAt: number;
  isCustom: boolean;
}

export interface SpeechEvaluation {
  id: string;
  textId: string;
  textTitle: string;
  score: number; // 0-100
  diccaoScore: number; // 0-100
  diccaoFeedback: string;
  ritmoScore: number; // 0-100
  ritmoFeedback: string;
  entonacaoScore: number; // 0-100
  entonacaoFeedback: string;
  pausasScore: number; // 0-100
  pausasFeedback: string;
  mispronouncedWords: string[];
  suggestions: string[];
  audioBlobId?: string; // Reference to audio in IndexedDB
  duration: number; // Recording duration in seconds
  createdAt: number;
}

export interface AudioRecord {
  id: string;
  blob: Blob;
  createdAt: number;
}
