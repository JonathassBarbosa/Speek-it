import React, { useRef } from 'react';
import { AnalysisReport, StoredText } from '../types';
import { Icon } from './Icon';
import { DiffViewer } from './DiffViewer';

// Declaração para o TypeScript reconhecer a biblioteca html2canvas injetada no HTML
declare const html2canvas: any;

interface AnalysisReportProps {
  report: AnalysisReport;
  text: StoredText;
  transcript: string;
  audioUrl: string;
  onTryAgain: () => void;
  onBack: () => void;
}

const ScoreCircle: React.FC<{ score: number, label: string }> = ({ score, label }) => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;
    const colorClass = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-light-primary dark:text-dark-primary" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle
                        className={`${colorClass} transition-all duration-1000`}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="50" className={`font-bold text-2xl ${colorClass}`} textAnchor="middle" dy=".3em">{score}</text>
                </svg>
            </div>
            <p className="mt-2 font-semibold text-light-text dark:text-dark-text">{label}</p>
        </div>
    );
};


const ReportCard: React.FC<{ title: string, score: number, feedback: string, children?: React.ReactNode }> = ({ title, score, feedback, children }) => (
    <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md animate-slideIn break-inside-avoid">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text">{title}</h3>
            <span className={`font-bold text-lg ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{score}/100</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300">{feedback}</p>
        {children}
    </div>
);

export const AnalysisReportComponent: React.FC<AnalysisReportProps> = ({ report, text, transcript, audioUrl, onTryAgain, onBack }) => {
  
  const reportRef = useRef<HTMLDivElement>(null);
  
  const handleExportPNG = () => {
    if (reportRef.current) {
        html2canvas(reportRef.current, { 
          scale: 2, 
          backgroundColor: document.documentElement.classList.contains('dark') ? '#1a1a1a' : '#f5f5f5'
        }).then((canvas: HTMLCanvasElement) => {
            const link = document.createElement('a');
            link.download = `speek-it-relatorio-${text.title.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  return (
    <>
      <style>
        {`
          @media print {
            body {
              background-color: #fff;
              color: #000;
            }
            .print-hidden {
              display: none;
            }
            .print-container {
              padding: 0;
              margin: 0;
              box-shadow: none;
              max-width: 100%;
            }
            .dark .print-light-text {
                color: #1a1a1a !important;
            }
            .dark .print-light-surface {
                background-color: #ffffff !important;
            }
          }
        `}
      </style>
      <div className="max-w-5xl mx-auto">
        <div ref={reportRef} className="p-4 md:p-8 text-light-text dark:text-dark-text print-container bg-light-bg dark:bg-dark-bg">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 print-light-text dark:text-dark-text">Relatório de Desempenho para "{text.title}"</h2>
                <p className="text-gray-500 dark:text-gray-400">Aqui está um detalhamento do seu desempenho de fala.</p>
            </div>

            <div className="bg-light-surface dark:bg-dark-surface p-8 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row items-center justify-center gap-8 print-light-surface">
                <ScoreCircle score={report.overallScore} label="Pontuação Geral" />
                <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4 print-light-text dark:text-dark-text">Sugestões Principais</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                        {report.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-center print-light-text dark:text-dark-text">Sua Gravação</h3>
                <audio controls src={audioUrl} className="w-full print-hidden">
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            </div>
          
            <DiffViewer original={text.content} transcript={transcript} />
        
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <ReportCard title="🎙️ Dicção" score={report.diction.score} feedback={report.diction.feedback} />
                <ReportCard title="🕒 Ritmo" score={report.rhythm.score} feedback={report.rhythm.feedback} />
                <ReportCard title="🎭 Entonação" score={report.intonation.score} feedback={report.intonation.feedback} />
                <ReportCard title="🧘‍♂️ Pausas" score={report.pauses.score} feedback={report.pauses.feedback} />
            </div>
        </div>
        
        <div className="flex justify-center gap-4 my-8 print-hidden">
            <button onClick={onBack} className="px-6 py-3 rounded-md bg-light-primary dark:bg-dark-primary font-semibold hover:opacity-80">Voltar</button>
            <button onClick={handleExportPNG} className="flex items-center gap-2 px-6 py-3 rounded-md bg-gray-500 text-white font-semibold hover:bg-opacity-90">
              <Icon name="export" className="w-5 h-5"/> Exportar PNG
            </button>
            <button onClick={onTryAgain} className="px-6 py-3 rounded-md bg-light-accent text-white font-semibold hover:bg-opacity-90">Tentar Novamente</button>
        </div>
      </div>
    </>
  );
};