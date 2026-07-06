import React from 'react';
import { User, View } from '../types';
import { Icon } from './Icon';

interface HeaderProps {
  currentUser: User | null;
  view: View;
  setView: (view: View) => void;
  onLogout: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  getHomeView: () => View;
  getPreviousView?: () => View;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, view, setView, onLogout, toggleTheme, isDarkMode, getHomeView, getPreviousView }) => {
  if (!currentUser) return null;

  const showBackButton = view !== 'login' && view !== getHomeView();

  const handleBack = () => {
    if (getPreviousView) {
        setView(getPreviousView());
    } else {
        setView(getHomeView());
    }
  }

  return (
    <header className="bg-light-surface dark:bg-dark-surface p-4 shadow-md flex justify-between items-center print-hidden">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary">
            <Icon name="back" className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">Speek It</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-light-text dark:text-dark-text">Bem-vindo(a), {currentUser.name}!</span>
        
        {currentUser.role === 'dev' && view !== 'adminDashboard' && (
             <button onClick={() => setView('adminDashboard')} title="Painel Admin" className="p-2 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary">
                <Icon name="admin" className="w-6 h-6"/>
            </button>
        )}
        {currentUser.role === 'supervisor' && view !== 'supervisorDashboard' && (
             <button onClick={() => setView('supervisorDashboard')} title="Painel Supervisor" className="p-2 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary">
                <Icon name="dashboard" className="w-6 h-6"/>
            </button>
        )}
         {currentUser.role === 'user' && view !== 'userDashboard' && (
             <button onClick={() => setView('userDashboard')} title="Meu Progresso" className="p-2 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary">
                <Icon name="dashboard" className="w-6 h-6"/>
            </button>
        )}

        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary">
          <Icon name={isDarkMode ? 'sun' : 'moon'} className="w-6 h-6" />
        </button>
        <button onClick={onLogout} title="Sair" className="p-2 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary">
          <Icon name="logout" className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};