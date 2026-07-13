/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, MouseEvent } from 'react';
import { TextTemplate } from '../types';
import { Search, Plus, Star, CheckCircle, Clock, Trash2, BookOpen, AlertCircle, FileText } from 'lucide-react';

interface TextBankProps {
  texts: TextTemplate[];
  onSelectText: (text: TextTemplate) => void;
  onSaveText: (text: TextTemplate) => void;
  onDeleteText: (id: string) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'onboarding', name: 'Onboarding' },
  { id: 'vendas', name: 'Vendas' },
  { id: 'motivacional', name: 'Motivacional' },
  { id: 'treino_rapido', name: 'Treino Rápido (30s)' },
];

export default function TextBank({ texts, onSelectText, onSaveText, onDeleteText }: TextBankProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingText, setIsAddingText] = useState(false);

  // Form states for a new text template
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('onboarding');

  const handleCreateText = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    // Calculate reading duration: average speech rate is ~130-150 words per minute
    const wordCount = newContent.trim().split(/\s+/).length;
    const estimatedSecs = Math.max(10, Math.round((wordCount / 140) * 60));

    const newText: TextTemplate = {
      id: 'custom-' + Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      isFavorite: false,
      isTrained: false,
      estimatedDuration: estimatedSecs,
      createdAt: Date.now(),
      isCustom: true,
    };

    onSaveText(newText);
    setNewTitle('');
    setNewContent('');
    setIsAddingText(false);
  };

  const toggleFavorite = (text: TextTemplate, e: MouseEvent) => {
    e.stopPropagation();
    onSaveText({
      ...text,
      isFavorite: !text.isFavorite,
    });
  };

  const filteredTexts = texts.filter((text) => {
    const matchesCategory = selectedCategory === 'all' || text.category === selectedCategory;
    const matchesSearch =
      text.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      text.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'onboarding':
        return 'Onboarding';
      case 'vendas':
        return 'Vendas & Pitch';
      case 'motivacional':
        return 'Motivacional';
      case 'treino_rapido':
        return 'Treino Rápido';
      default:
        return 'Geral';
    }
  };

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'onboarding':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-100 dark:border-blue-900/50';
      case 'vendas':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50';
      case 'motivacional':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-100 dark:border-purple-900/50';
      case 'treino_rapido':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-100 dark:border-amber-900/50';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-100 dark:border-gray-700';
    }
  };

  return (
    <div id="text-bank-container" className="space-y-6">
      {/* Header with Search and Create CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Banco de Textos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecione um texto de treino pronto ou adicione os seus próprios discursos.
          </p>
        </div>

        <button
          id="btn-add-text"
          onClick={() => setIsAddingText(!isAddingText)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          {isAddingText ? 'Ver Banco' : 'Novo Texto'}
        </button>
      </div>

      {isAddingText ? (
        /* Form to Add New Text */
        <form id="form-add-text" onSubmit={handleCreateText} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold font-display text-gray-900 dark:text-white">Criar Novo Texto de Treino</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Título do Texto</label>
              <input
                id="input-text-title"
                type="text"
                placeholder="Ex: Pitch de Vendas da Startup X"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Categoria</label>
              <select
                id="select-text-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              >
                <option value="onboarding">Onboarding</option>
                <option value="vendas">Vendas & Pitch</option>
                <option value="motivacional">Motivacional</option>
                <option value="treino_rapido">Treino Rápido (≤ 30s)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Conteúdo do Texto</label>
            <textarea
              id="textarea-text-content"
              rows={6}
              placeholder="Digite ou cole aqui o roteiro que você deseja ler no teleprompter..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none font-sans leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="btn-cancel-add-text"
              type="button"
              onClick={() => setIsAddingText(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-new-text"
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow cursor-pointer"
            >
              Salvar Texto
            </button>
          </div>
        </form>
      ) : (
        /* Filters + Texts grid */
        <div className="space-y-6">
          {/* Search and Category Tabs */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            {/* Category Tabs */}
            <div id="category-tabs" className="flex flex-wrap gap-1.5 p-1 bg-gray-100 dark:bg-gray-950 rounded-xl self-start">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600" />
              <input
                id="search-texts-input"
                type="text"
                placeholder="Buscar textos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Texts Grid */}
          {filteredTexts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-950 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <AlertCircle className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Nenhum texto encontrado</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Experimente buscar por outros termos ou crie um novo texto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTexts.map((text) => (
                <div
                  key={text.id}
                  id={`text-card-${text.id}`}
                  onClick={() => onSelectText(text)}
                  className="group bg-white dark:bg-gray-900 hover:bg-gray-50/30 dark:hover:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80 hover:border-indigo-200 dark:hover:border-indigo-900/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px]"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border uppercase ${getCategoryStyle(text.category)}`}>
                        {getCategoryLabel(text.category)}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleFavorite(text, e)}
                          className="p-1 rounded-lg text-gray-400 hover:text-amber-500 dark:text-gray-600 dark:hover:text-amber-400 transition-colors"
                          title={text.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                        >
                          <Star className={`w-4 h-4 ${text.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>

                        {text.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Tem certeza de que deseja deletar este texto?')) {
                                onDeleteText(text.id);
                              }
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Deletar texto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-semibold text-base text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {text.title}
                    </h4>

                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 leading-relaxed font-sans">
                      {text.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800/60 pt-3 mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      ~{text.estimatedDuration} seg
                    </span>

                    {text.isTrained ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Já Treinado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                        <FileText className="w-3.5 h-3.5" />
                        Não Treinado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
