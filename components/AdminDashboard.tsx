import React, { useState } from 'react';
import { User, Sala, Recording, View, UserRole } from '../types';
import { Icon } from './Icon';
import { DevAdmin } from './DevAdmin';

interface AdminDashboardProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  salas: Sala[];
  setSalas: React.Dispatch<React.SetStateAction<Sala[]>>;
  recordings: Recording[];
  setView: (view: View) => void;
  setMockPasswords: React.Dispatch<React.SetStateAction<{ [email: string]: string }>>;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
  <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md flex items-center gap-4">
    <div className="bg-light-accent/10 text-light-accent p-3 rounded-full">
      <Icon name={icon} className="w-8 h-8" />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-light-text dark:text-dark-text">{value}</p>
    </div>
  </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { users, salas, recordings } = props;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manage'>('dashboard');

  const getSalaStats = (sala: Sala) => {
    const salaUsers = users.filter(u => u.sala === sala);
    const salaUserIds = salaUsers.map(u => u.id);
    const salaRecordings = recordings.filter(r => salaUserIds.includes(r.userId) && r.analysis);

    if (salaRecordings.length === 0) {
      return { userCount: salaUsers.length, trainedCount: 0, averageScore: 0 };
    }
    const totalScore = salaRecordings.reduce((acc, rec) => acc + (rec.analysis?.overallScore || 0), 0);
    const averageScore = Math.round(totalScore / salaRecordings.length);
    return { userCount: salaUsers.length, trainedCount: salaRecordings.length, averageScore };
  };

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID_Gravacao,ID_Usuario,Nome_Usuario,Funcao_Usuario,Sala,ID_Texto,Data,Pontuacao_Geral\n";

    recordings.forEach(rec => {
        const user = users.find(u => u.id === rec.userId);
        if (!user || !rec.analysis) return;
        const row = [
            rec.id,
            user.id,
            `"${user.name}"`,
            user.role,
            user.sala,
            rec.textId,
            new Date(rec.createdAt).toISOString(),
            rec.analysis.overallScore
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `speek-it_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8">
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text mb-6">Painel Master de Administração</h2>
        
        <div className="flex border-b border-light-primary dark:border-dark-primary mb-6">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 font-semibold ${activeTab === 'dashboard' ? 'text-light-accent border-b-2 border-light-accent' : ''}`}>Painel</button>
            <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 font-semibold ${activeTab === 'manage' ? 'text-light-accent border-b-2 border-light-accent' : ''}`}>Gerenciar</button>
        </div>

        {activeTab === 'dashboard' && (
            <div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total de Usuários" value={users.length} icon="users" />
                    <StatCard title="Total de Salas" value={salas.length} icon="admin" />
                    <StatCard title="Total de Treinos" value={recordings.length} icon="check" />
                </div>
                <div className="flex justify-end mb-4">
                     <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors">
                        <Icon name="export" className="w-5 h-5"/> Exportar Todos os Dados (CSV)
                    </button>
                </div>
                <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-light-primary/50 dark:bg-dark-primary/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sala</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuários</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Treinos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pont. Média</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-primary dark:divide-dark-primary">
                        {salas.map(sala => {
                            const stats = getSalaStats(sala);
                            const scoreColor = stats.averageScore >= 80 ? 'text-green-500' : stats.averageScore >= 60 ? 'text-yellow-500' : 'text-red-500';
                            return (
                                <tr key={sala}>
                                    <td className="px-6 py-4 font-semibold">{sala}</td>
                                    <td className="px-6 py-4">{stats.userCount}</td>
                                    <td className="px-6 py-4">{stats.trainedCount}</td>
                                    <td className="px-6 py-4 font-bold"><span className={scoreColor}>{stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A'}</span></td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        
        {activeTab === 'manage' && <DevAdmin {...props} />}

    </div>
  );
};