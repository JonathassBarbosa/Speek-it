import React, { useMemo } from 'react';

interface DiffViewerProps {
  original: string;
  transcript: string;
}

enum DiffType {
  EQUAL,
  DELETED,
  INSERTED,
}

interface DiffResult {
  type: DiffType;
  value: string;
}

// Simple word-based diffing function
const createDiff = (original: string, transcript: string): DiffResult[] => {
  const originalWords = original.toLowerCase().replace(/[.,?!]/g, '').split(/\s+/);
  const transcriptWords = transcript.toLowerCase().replace(/[.,?!]/g, '').split(/\s+/);
  
  const dp = Array(transcriptWords.length + 1)
    .fill(null)
    .map(() => Array(originalWords.length + 1).fill(0));

  for (let i = 1; i <= transcriptWords.length; i++) {
    for (let j = 1; j <= originalWords.length; j++) {
      if (transcriptWords[i - 1] === originalWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const results: DiffResult[] = [];
  let i = transcriptWords.length;
  let j = originalWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && transcriptWords[i - 1] === originalWords[j - 1]) {
      results.unshift({ type: DiffType.EQUAL, value: transcriptWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      results.unshift({ type: DiffType.DELETED, value: originalWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      results.unshift({ type: DiffType.INSERTED, value: transcriptWords[i - 1] });
      i--;
    } else {
      break;
    }
  }

  return results;
};


export const DiffViewer: React.FC<DiffViewerProps> = ({ original, transcript }) => {
  const diff = useMemo(() => createDiff(original, transcript), [original, transcript]);

  return (
    <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md animate-slideIn break-inside-avoid">
        <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-4">Análise de Dicção</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            Aqui está uma comparação da sua fala com o roteiro.
            <span className="bg-red-500/20 text-red-800 dark:text-red-300 px-1 rounded-sm mx-1">Palavras omitidas</span> estão destacadas no roteiro original.
            <span className="bg-green-500/20 text-green-800 dark:text-green-300 px-1 rounded-sm mx-1">Palavras adicionadas</span> estão destacadas na sua transcrição.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold mb-2 text-light-text dark:text-dark-text border-b pb-2">Roteiro Original</h4>
                <div className="p-2 rounded-md bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text leading-loose">
                {diff.map((part, index) => {
                    if (part.type === DiffType.INSERTED) return null;
                    const style = part.type === DiffType.DELETED 
                        ? "bg-red-500/30 px-1 rounded-sm" 
                        : "opacity-80";
                    return <span key={index} className={style}>{part.value} </span>;
                })}
                </div>
            </div>
            <div>
                <h4 className="font-semibold mb-2 text-light-text dark:text-dark-text border-b pb-2">Sua Transcrição</h4>
                <div className="p-2 rounded-md bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text leading-loose">
                {diff.map((part, index) => {
                    if (part.type === DiffType.DELETED) return null;
                    const style = part.type === DiffType.INSERTED
                        ? "bg-green-500/30 px-1 rounded-sm"
                        : "opacity-80";
                    return <span key={index} className={style}>{part.value} </span>;
                })}
                </div>
            </div>
        </div>
    </div>
  );
};