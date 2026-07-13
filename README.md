# 🎙️ Vocalise Pro — Teleprompter Inteligente com IA

Sistema de teleprompter com análise de oratória em tempo real usando **Gemini AI**. Grave sua leitura, receba notas de **dicção, ritmo, entonação e pausas** e acompanhe sua evolução no histórico.

## ✨ Funcionalidades

- **Teleprompter** com rolagem automática ajustável e linha de foco
- **Gravação de voz** com visualizador de espectro de áudio
- **Análise por IA** (Gemini 2.0 Flash) com notas detalhadas de oratória
- **Análise local inteligente** como fallback quando sem API key
- **Banco de textos** com categorias: Onboarding, Vendas, Motivacional e Treino Rápido
- **Histórico de treinos** com playback de áudio e exportação de relatório (.txt)
- **Modo claro/escuro** com tema dark imersivo por padrão
- **Armazenamento local** via IndexedDB (sem servidor necessário para uso básico)

## 🚀 Como rodar localmente

**Pré-requisitos:** Node.js 20+

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/teleprompter-inteligente.git
cd teleprompter-inteligente

# 2. Instale as dependências
npm install

# 3. Configure a variável de ambiente
cp .env.example .env.local
# Edite .env.local e adicione sua GEMINI_API_KEY
# Obtenha em: https://aistudio.google.com/app/apikey

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em: [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy no GitHub Pages

O projeto usa **Vite** para build estático e **gh-pages** para deploy.

> ⚠️ O GitHub Pages serve arquivos estáticos. A análise por IA real requer um servidor com a `GEMINI_API_KEY`. No GitHub Pages, o app funciona com **análise local inteligente** como fallback.

```bash
# Antes do deploy, edite "homepage" no package.json com sua URL real:
# "homepage": "https://SEU_USUARIO.github.io/teleprompter-inteligente"

npm run deploy
```

## 🔑 Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave da API do Google Gemini (obrigatória para análise por IA real) |

## 🛠️ Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento (Vite + Express) |
| `npm run build` | Gera build de produção em `/dist` |
| `npm run deploy` | Faz deploy no GitHub Pages |
| `npm run lint` | Verifica tipos TypeScript |

## 🏗️ Tecnologias

- **React 19** + **TypeScript**
- **Tailwind CSS v4** (via Vite plugin)
- **Vite 6**
- **Google Gemini 2.0 Flash** (`@google/genai`)
- **Express** (servidor de API)
- **IndexedDB** (armazenamento local de textos, avaliações e áudios)
- **Web Speech API** (transcrição em tempo real)
- **MediaRecorder API** (gravação de áudio)

## 📁 Estrutura do Projeto

```
teleprompter-inteligente/
├── src/
│   ├── App.tsx              # Componente principal e lógica central
│   ├── main.tsx             # Entry point
│   ├── index.css            # Estilos globais + Tailwind
│   ├── types.ts             # Interfaces TypeScript
│   ├── components/
│   │   ├── TextBank.tsx     # Gerenciamento de roteiros
│   │   └── ThemeToggle.tsx  # Alternador de tema
│   └── lib/
│       └── db.ts            # IndexedDB (textos, avaliações, áudio)
├── server.ts                # Servidor Express + integração Gemini
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 📄 Licença

Apache-2.0 — veja [LICENSE](LICENSE) para detalhes.
