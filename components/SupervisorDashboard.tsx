import React from 'react';
import { User, Recording, StoredText, View } from '../types';
import { Icon } from './Icon';

interface SupervisorDashboardProps {
  currentUser: User;
  users: User[];
  recordings: Recording[];
  onSelectUser: (userId: string) => void;
  setView: (view: View) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ currentUser, users, recordings, onSelectUser, setView }) => {

  const teamMembers = users.filter(u => u.sala === currentUser.sala && u.id !== currentUser.id);

  const getUserStats = (userId: string) => {
    const userRecordings = recordings.filter(r => r.userId === userId && r.analysis);
    if (userRecordings.length === 0) {
      return {
        averageScore: 0,
        trainedCount: 0,
        lastTrained: 'N/A'
      };
    }
    const totalScore = userRecordings.reduce((acc, rec) => acc + (rec.analysis?.overallScore || 0), 0);
    const averageScore = Math.round(totalScore / userRecordings.length);
    const lastTrained = new Date(Math.max(...userRecordings.map(r => r.createdAt))).toLocaleDateString();

    return { averageScore, trainedCount: userRecordings.length, lastTrained };
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text">Painel do Supervisor</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">Visão Geral do Desempenho da Sala: <span className="font-semibold text-light-accent">{currentUser.sala}</span></p>
      </div>

      <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-light-primary/50 dark:bg-dark-primary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Membro da Equipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Treinos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pont. Média</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Último Treino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-primary dark:divide-dark-primary">
              {teamMembers.length > 0 ? teamMembers.map(user => {
                const stats = getUserStats(user.id);
                const scoreColor = stats.averageScore >= 80 ? 'text-green-500' : stats.averageScore >= 60 ? 'text-yellow-500' : 'text-red-500';
                return (
                  <tr key={user.id} onClick={() => onSelectUser(user.id)} className="hover:bg-light-primary/30 dark:hover:bg-dark-primary/30 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-light-text dark:text-dark-text">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text dark:text-dark-text">{stats.trainedCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span className={scoreColor}>{stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stats.lastTrained}</td>
                  </tr>
                );
              }) : (
                  <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                          Nenhum membro da equipe encontrado nesta sala.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
       <div className="mt-8">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-4">Sua área de treino pessoal</h3>
            <p className="text-gray-500 dark:text-gray-400">Você também pode usar o teleprompter para treinar seus próprios roteiros.</p>
             <button onClick={() => setView('textManager')} className="mt-4 bg-light-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">
                Ir para Meus Roteiros
            </button>
       </div>
    </div>
  );
};