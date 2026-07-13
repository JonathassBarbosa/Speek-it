/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextTemplate, SpeechEvaluation } from '../types';

const DB_NAME = 'TeleprompterInteligenteDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function initDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null; // Reset on error so we can retry if needed
      reject(request.error);
    };
    
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains('texts')) {
        db.createObjectStore('texts', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('evaluations')) {
        db.createObjectStore('evaluations', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('audio')) {
        db.createObjectStore('audio', { keyPath: 'id' });
      }
    };
  });

  return dbPromise;
}

const PRESET_TEXTS: TextTemplate[] = [
  {
    id: 'preset-onboarding',
    title: 'Boas-vindas ao Time!',
    content: 'Olá! É uma grande satisfação dar as boas-vindas a você no nosso time. A partir de hoje, você faz parte de um grupo obstinado por excelência e inovação. Nosso foco inicial é garantir que você se sinta em casa, entenda nossa cultura de colaboração e tenha todas as ferramentas necessárias para brilhar. Explore os materiais, converse com os seus colegas e, acima de tudo, nunca hesite em trazer novas ideias. Estamos muito felizes por ter você conosco!',
    category: 'onboarding',
    isFavorite: false,
    isTrained: false,
    estimatedDuration: 45,
    createdAt: 1717200000000,
    isCustom: false,
  },
  {
    id: 'preset-sales',
    title: 'Apresentação da Solução',
    content: 'Você já parou para pensar em quanto tempo sua equipe perde diariamente com tarefas manuais e repetitivas? Nossa plataforma inteligente automatiza esses processos em um único clique, reduzindo custos operacionais em até quarenta por cento e liberando seu time para focar no que realmente importa: a estratégia do negócio. Nós não vendemos apenas um software, nós entregamos eficiência, previsibilidade e crescimento acelerado. Que tal agendarmos uma demonstração rápida de cinco minutos amanhã?',
    category: 'vendas',
    isFavorite: false,
    isTrained: false,
    estimatedDuration: 40,
    createdAt: 1717200001000,
    isCustom: false,
  },
  {
    id: 'preset-motivational',
    title: 'O Poder da Consistência',
    content: 'O sucesso não é fruto de um único golpe de sorte ou de um esforço isolado. Ele é construído dia após dia, no silêncio da persistência e no compromisso com o que é pequeno, mas constante. Muitas vezes, a diferença entre o extraordinário e o comum não é o talento, mas a coragem de continuar quando todos os outros decidem parar. Acredite no processo, mantenha o foco na sua visão e lembre-se de que cada passo dado hoje, por menor que pareça, está pavimentando a estrada para a sua maior conquista.',
    category: 'motivacional',
    isFavorite: false,
    isTrained: false,
    estimatedDuration: 50,
    createdAt: 1717200002000,
    isCustom: false,
  },
  {
    id: 'preset-reels',
    title: 'Modo Reels: Foco e Energia',
    content: 'Quer dobrar seu foco hoje? Use a técnica dos três blocos! Primeiro: defina apenas uma grande tarefa prioritária para o seu dia. Segundo: desligue todas as notificações do celular por cinquenta minutos. Terceiro: tire dez minutos de descanso absoluto. Repita isso e veja sua energia disparar! Me conta aqui nos comentários: qual é o seu maior ladrão de foco?',
    category: 'treino_rapido',
    isFavorite: false,
    isTrained: false,
    estimatedDuration: 25,
    createdAt: 1717200003000,
    isCustom: false,
  },
  {
    id: 'preset-pitch',
    title: 'Pitch Elevador: Teleprompter IA',
    content: 'Nós desenvolvemos uma tecnologia que ajuda profissionais de comunicação a dominarem a oratória usando feedback em tempo real com inteligência artificial. Com apenas dois minutos de treino por dia, nossos usuários reduzem a ansiedade de falar em público pela metade e aumentam o engajamento de suas apresentações. Quer saber como transformar sua próxima palestra de vendas?',
    category: 'treino_rapido',
    isFavorite: false,
    isTrained: false,
    estimatedDuration: 28,
    createdAt: 1717200004000,
    isCustom: false,
  }
];

export async function getTexts(): Promise<TextTemplate[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('texts', 'readonly');
    const store = transaction.objectStore('texts');
    const request = store.getAll();

    request.onsuccess = async () => {
      let texts = request.result;
      if (texts.length === 0) {
        // Populate preset texts on first run
        await populatePresetTexts();
        resolve(PRESET_TEXTS);
      } else {
        resolve(texts);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

async function populatePresetTexts(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('texts', 'readwrite');
    const store = transaction.objectStore('texts');
    PRESET_TEXTS.forEach((text) => store.put(text));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveText(text: TextTemplate): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('texts', 'readwrite');
    const store = transaction.objectStore('texts');
    const request = store.put(text);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteText(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('texts', 'readwrite');
    const store = transaction.objectStore('texts');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getEvaluations(): Promise<SpeechEvaluation[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('evaluations', 'readonly');
    const store = transaction.objectStore('evaluations');
    const request = store.getAll();

    request.onsuccess = () => {
      const evals = request.result;
      // Sort evaluations newest first
      evals.sort((a, b) => b.createdAt - a.createdAt);
      resolve(evals);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveEvaluation(evaluation: SpeechEvaluation): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('evaluations', 'readwrite');
    const store = transaction.objectStore('evaluations');
    const request = store.put(evaluation);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteEvaluation(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('evaluations', 'readwrite');
    const store = transaction.objectStore('evaluations');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAudio(id: string): Promise<Blob | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('audio', 'readonly');
    const store = transaction.objectStore('audio');
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result ? request.result.blob : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudio(id: string, blob: Blob): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('audio', 'readwrite');
    const store = transaction.objectStore('audio');
    const request = store.put({ id, blob, createdAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('audio', 'readwrite');
    const store = transaction.objectStore('audio');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
