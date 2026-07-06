import React from 'react';
import { User, Recording, StoredText, View } from '../types';
import { Icon } from './Icon';

interface UserDashboardProps {
  user: User;
  recordings: Recording[];
  texts: StoredText[];
  setView: (view: View) => void;
  onViewRecording: (recording: Recording) => void;
  onStartTraining: (text: StoredText) => void;
}

const ScoreChart: React.FC<{ recordings: Recording[] }> = ({ recordings }) => {
    const data = recordings
        .filter(r => r.analysis)
        .map(r => ({ date: r.createdAt, score: r.analysis!.overallScore }))
        .sort((a,b) => a.date - b.date)
        .slice(-10); // Show last 10 recordings

    if (data.length < 2) {
        return <div className="text-center text-gray-500 py-8">Ainda não há dados suficientes para um gráfico. Conclua mais treinamentos!</div>
    }

    const maxScore = 100;
    const chartHeight = 150;
    const barWidth = 20;
    const gap = 15;
    const chartWidth = data.length * (barWidth + gap);

    return (
        <div className="overflow-x-auto p-4">
            <svg width={chartWidth} height={chartHeight + 20}>
                <g>
                    {data.map((d, i) => {
                        const barHeight = (d.score / maxScore) * chartHeight;
                        const x = i * (barWidth + gap);
                        const y = chartHeight - barHeight;
                        const color = d.score >= 80 ? '#22c55e' : d.score >= 60 ? '#f59e0b' : '#ef4444';
                        return (
                            <g key={i}>
                                <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx="4" />
                                <text x={x + barWidth / 2} y={chartHeight + 15} textAnchor="middle" fontSize="12" className="fill-current text-gray-500">{d.score}</text>
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    )
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, recordings, texts, setView, onViewRecording, onStartTraining }) => {
  return (
    <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-light-text dark:text-dark-text">Meu Progresso</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400">Bem-vindo(a) de volta, {user.name}! Aqui está o resumo do seu treinamento.</p>
            </div>
            <button onClick={() => setView('textManager')} className="bg-light-accent text-white px-6 py-3 rounded-md font-semibold hover:bg-opacity-90 transition-colors self-start md:self-center">
                Ir para Meus Roteiros
            </button>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-4">Evolução da Pontuação (Últimos 10)</h3>
            <ScoreChart recordings={recordings} />
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text p-6 border-b border-light-primary dark:border-dark-primary">Histórico de Treinamento</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-light-primary/50 dark:bg-dark-primary/50 hidden md:table-header-group">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Título do Roteiro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pontuação Geral</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-primary dark:divide-dark-primary">
                        {recordings.length > 0 ? recordings.sort((a,b) => b.createdAt - a.createdAt).map(rec => {
                            const text = texts.find(t => t.id === rec.textId);
                            const score = rec.analysis?.overallScore || 0;
                            const scoreColor = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
                            return (
                                <tr key={rec.id} className="block md:table-row mb-4 md:mb-0 border md:border-none rounded-lg md:rounded-none">
                                    <td className="px-6 py-4 whitespace-nowrap block md:table-cell" data-label="Roteiro">{text?.title || "Roteiro Excluído"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 block md:table-cell" data-label="Data">{new Date(rec.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap block md:table-cell" data-label="Pontuação">
                                        <span className={`font-bold ${scoreColor}`}>{score}%</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium block md:table-cell" data-label="Ações">
                                        <div className="flex gap-2">
                                            <button onClick={() => onViewRecording(rec)} className="text-light-accent hover:underline">Ver Relatório</button>
                                            {text && <button onClick={() => onStartTraining(text)} className="text-blue-500 hover:underline">Tentar Novamente</button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    Você ainda não concluiu nenhuma sessão de treinamento.
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