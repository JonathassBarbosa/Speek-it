import React from 'react';
import { User, Recording, StoredText } from '../types';

interface UserDetailViewProps {
  user: User;
  recordings: Recording[];
  texts: StoredText[];
  onViewRecording: (recording: Recording) => void;
}

export const UserDetailView: React.FC<UserDetailViewProps> = ({ user, recordings, texts, onViewRecording }) => {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text">Histórico de Desempenho: {user.name}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">{user.email} - Sala: {user.sala}</p>
      </div>

      <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-light-text dark:text-dark-text p-6 border-b border-light-primary dark:border-dark-primary">Histórico de Treinamento</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-light-primary/50 dark:bg-dark-primary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Título do Roteiro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pontuação Geral</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-primary dark:divide-dark-primary">
              {recordings.length > 0 ? recordings.sort((a, b) => b.createdAt - a.createdAt).map(rec => {
                const text = texts.find(t => t.id === rec.textId);
                const score = rec.analysis?.overallScore || 0;
                const scoreColor = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
                return (
                  <tr key={rec.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{text?.title || "Roteiro Excluído"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{new Date(rec.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${scoreColor}`}>{score}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => onViewRecording(rec)} className="text-light-accent hover:underline">Ver Relatório</button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    Este usuário ainda não concluiu nenhuma sessão de treinamento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};