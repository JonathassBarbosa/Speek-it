// Fix: This file was empty. Added the implementation for the DevAdmin component to manage users and salas.
import React, { useState } from 'react';
import { User, Sala, UserRole } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface DevAdminProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  salas: Sala[];
  setSalas: React.Dispatch<React.SetStateAction<Sala[]>>;
  setMockPasswords: React.Dispatch<React.SetStateAction<{ [email: string]: string }>>;
}

const UserForm: React.FC<{
    user?: User;
    salas: Sala[];
    onSave: (user: User, pass?: string) => void;
    onClose: () => void;
}> = ({ user, salas, onSave, onClose }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(user?.role || 'user');
    const [sala, setSala] = useState<Sala>(user?.sala || (salas.length > 0 ? salas[0] : ''));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !email || !sala || (!user && !password)){
            alert('Por favor, preencha todos os campos. A senha é obrigatória para novos usuários.');
            return;
        }
        const updatedUser: User = {
            id: user?.id || `user-${Date.now()}`,
            name,
            email: email.toLowerCase(),
            role,
            sala,
        };
        onSave(updatedUser, password || undefined);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text" required/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text" required/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                <input type="password" placeholder={user ? "Deixe em branco para manter a atual" : "Obrigatório"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text" required={!user} />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Função</label>
                <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 block w-full bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text">
                    <option value="user">Recepcionista</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="dev">Dev Admin</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sala</label>
                 <select value={sala} onChange={e => setSala(e.target.value)} className="mt-1 block w-full bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text">
                    {salas.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-light-primary dark:bg-dark-primary text-light-text dark:text-dark-text hover:opacity-80">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-light-accent text-white font-semibold hover:bg-opacity-90">Salvar Usuário</button>
            </div>
        </form>
    );
}

export const DevAdmin: React.FC<DevAdminProps> = ({ users, setUsers, salas, setSalas, setMockPasswords }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [newSala, setNewSala] = useState('');

    const openUserModal = (user?: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const closeUserModal = () => {
        setEditingUser(undefined);
        setIsUserModalOpen(false);
    }
    
    const handleSaveUser = (user: User, password?: string) => {
        setUsers(prev => {
            const existingIndex = prev.findIndex(u => u.id === user.id);
            if (existingIndex > -1) {
                const updatedUsers = [...prev];
                updatedUsers[existingIndex] = user;
                return updatedUsers;
            }
            return [...prev, user];
        });
        if (password) {
            setMockPasswords(prev => ({ ...prev, [user.email]: password }));
        }
        closeUserModal();
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm('Tem certeza de que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            const userToDelete = users.find(u => u.id === userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            if (userToDelete) {
                setMockPasswords(prev => {
                    const newPasswords = { ...prev };
                    delete newPasswords[userToDelete.email];
                    return newPasswords;
                });
            }
        }
    };

    const handleAddSala = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedSala = newSala.trim().toUpperCase();
        if (trimmedSala && !salas.includes(trimmedSala)) {
            setSalas(prev => [...prev, trimmedSala].sort());
            setNewSala('');
        }
    };

    const handleDeleteSala = (sala: Sala) => {
        if (users.some(u => u.sala === sala)) {
            alert('Não é possível excluir uma sala que possui usuários atribuídos a ela.');
            return;
        }
        if (window.confirm(`Tem certeza de que deseja excluir a sala "${sala}"?`)) {
            setSalas(prev => prev.filter(s => s !== sala));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-light-text dark:text-dark-text">Gerenciar Usuários</h3>
                    <button onClick={() => openUserModal()} className="flex items-center gap-2 bg-light-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90">
                        <Icon name="plus" className="w-5 h-5" /> Adicionar Usuário
                    </button>
                </div>
                <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                             <thead className="bg-light-primary/50 dark:bg-dark-primary/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuário</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Função</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sala</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-light-primary dark:divide-dark-primary">
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 capitalize">{user.role}</td>
                                        <td className="px-6 py-4">{user.sala}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => openUserModal(user)} className="p-2 text-blue-500 hover:text-blue-700"><Icon name="edit" className="w-5 h-5"/></button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-500 hover:text-red-700"><Icon name="trash" className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-4">Gerenciar Salas</h3>
                <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-md p-4">
                    <form onSubmit={handleAddSala} className="flex gap-2 mb-4">
                        <input type="text" value={newSala} onChange={e => setNewSala(e.target.value)} placeholder="Nome da Nova Sala" className="flex-grow bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text" />
                        <button type="submit" className="bg-light-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90"><Icon name="plus" className="w-5 h-5"/></button>
                    </form>
                     <ul className="divide-y divide-light-primary dark:divide-dark-primary max-h-96 overflow-y-auto">
                        {salas.map(sala => (
                            <li key={sala} className="flex justify-between items-center py-2">
                                <span>{sala}</span>
                                <button onClick={() => handleDeleteSala(sala)} className="p-1 text-red-500 hover:text-red-700"><Icon name="trash" className="w-4 h-4"/></button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Modal isOpen={isUserModalOpen} onClose={closeUserModal} title={editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}>
                <UserForm 
                    user={editingUser}
                    salas={salas}
                    onSave={handleSaveUser}
                    onClose={closeUserModal}
                />
            </Modal>
        </div>
    );
};