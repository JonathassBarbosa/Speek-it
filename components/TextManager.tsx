import React, { useState } from 'react';
import { StoredText } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface TextManagerProps {
  texts: StoredText[];
  setTexts: React.Dispatch<React.SetStateAction<StoredText[]>>;
  onStartTraining: (text: StoredText) => void;
  userId: string;
}

const TextCard: React.FC<{
  text: StoredText;
  onStart: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}> = ({ text, onStart, onToggleFavorite, onDelete }) => (
  <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md flex flex-col justify-between animate-slideIn">
    <div>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">{text.title}</h3>
        <button onClick={onToggleFavorite} className="text-yellow-400 hover:text-yellow-500">
          <Icon name="star" className={`w-5 h-5 ${text.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 capitalize">{text.category}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{text.content}</p>
    </div>
    <div className="mt-4 flex justify-between items-center">
      <span className="text-xs text-gray-500">Treinado: {text.trainedCount} vezes</span>
      <div className="flex gap-2">
        <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
          <Icon name="trash" className="w-5 h-5" />
        </button>
        <button onClick={onStart} className="bg-light-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">
          Treinar
        </button>
      </div>
    </div>
  </div>
);

const TextForm: React.FC<{
    onSave: (text: Omit<StoredText, 'id' | 'isFavorite' | 'trainedCount' | 'userId'>) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title || !content || !category) return;
      onSave({ title, content, category });
      onClose();
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Vendas, Onboarding, Pitch" className="mt-1 block w-full bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conteúdo</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="mt-1 block w-full bg-light-bg dark:bg-dark-bg border border-light-primary dark:border-dark-primary rounded-md shadow-sm py-2 px-3 text-light-text dark:text-dark-text" required/>
        </div>
        <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-light-primary dark:bg-dark-primary text-light-text dark:text-dark-text hover:opacity-80">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-light-accent text-white font-semibold hover:bg-opacity-90">Salvar Texto</button>
        </div>
      </form>
    );
};

export const TextManager: React.FC<TextManagerProps> = ({ texts, setTexts, onStartTraining, userId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveText = (newTextData: Omit<StoredText, 'id' | 'isFavorite' | 'trainedCount' | 'userId'>) => {
    const newText: StoredText = {
      ...newTextData,
      id: Date.now().toString(),
      userId: userId,
      isFavorite: false,
      trainedCount: 0,
    };
    setTexts(prev => [...prev, newText]);
  };

  const handleToggleFavorite = (id: string) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza de que deseja excluir este texto?")) {
        setTexts(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Meus Roteiros</h2>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-light-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors">
          <Icon name="plus" className="w-5 h-5" />
          Adicionar Texto
        </button>
      </div>

      {texts.length === 0 ? (
        <div className="text-center py-16 bg-light-surface dark:bg-dark-surface rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Sua biblioteca de roteiros está vazia.</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Clique em "Adicionar Texto" para começar!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {texts.map(text => (
            <TextCard
                key={text.id}
                text={text}
                onStart={() => onStartTraining(text)}
                onToggleFavorite={() => handleToggleFavorite(text.id)}
                onDelete={() => handleDelete(text.id)}
            />
            ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Novo Texto">
        <TextForm onSave={handleSaveText} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};