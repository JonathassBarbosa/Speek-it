import React, { useState } from 'react';
import { Sala, UserRole } from '../types';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  onRegister: (name: string, email: string, pass: string, sala: Sala, role: UserRole) => void;
  salas: Sala[];
  error: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister, salas, error }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regSala, setRegSala] = useState<Sala>(salas[0] || '');
  const [regRole, setRegRole] = useState<UserRole>('user');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginEmail, loginPass);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(regName, regEmail, regPass, regSala, regRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-light-text dark:text-dark-text">Speek It</h1>
        <div className="flex justify-center mb-6 border-b border-light-primary dark:border-dark-primary">
          <button onClick={() => setIsLoginView(true)} className={`px-6 py-2 font-semibold ${isLoginView ? 'text-light-accent border-b-2 border-light-accent' : 'text-gray-500'}`}>
            Entrar
          </button>
          <button onClick={() => setIsLoginView(false)} className={`px-6 py-2 font-semibold ${!isLoginView ? 'text-light-accent border-b-2 border-light-accent' : 'text-gray-500'}`}>
            Cadastrar
          </button>
        </div>
        
        {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-md mb-4 text-center">{error}</div>}

        {isLoginView ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <input type="email" placeholder="E-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-primary dark:border-dark-primary text-light-text dark:text-dark-text"/>
            <input type="password" placeholder="Senha" value={loginPass} onChange={e => setLoginPass(e.target.value)} required className="w-full bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-primary dark:border-dark-primary text-light-text dark:text-dark-text"/>
            <button type="submit" className="w-full bg-light-accent text-white p-3 rounded-md font-semibold hover:bg-opacity-90 transition-colors">Entrar</button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <input type="text" placeholder="Nome Completo" value={regName} onChange={e => setRegName(e.target.value)} required className="w-full bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-primary dark:border-dark-primary text-light-text dark:text-dark-text"/>
            <input type="email" placeholder="E-mail" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-primary dark:border-dark-primary text-light-text dark:text-dark-text"/>
            <input type="password" placeholder="Senha" value={regPass} onChange={e => setRegPass(e.target.value)} required className="w-full bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-primary dark:border-dark-primary text-light-text dark:text-dark-text"/>
            <select value={regSala} onChange={e => setRegSala(e.target.value)} className="w-full bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-primary dark:border-dark-primary text-light-text dark:text-dark-text">
                {salas.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
             <select value={regRole} onChange={e => setRegRole(e.target.value as UserRole)} className="w-full bg-light-bg dark:bg-dark-bg p-3 rounded-md border border-light-primary dark:border-dark-primary text-light-text dark:text-dark-text">
                <option value="user">Recepcionista</option>
                <option value="supervisor">Supervisor</option>
            </select>
            <button type="submit" className="w-full bg-light-accent text-white p-3 rounded-md font-semibold hover:bg-opacity-90 transition-colors">Cadastrar</button>
          </form>
        )}
      </div>
    </div>
  );
};