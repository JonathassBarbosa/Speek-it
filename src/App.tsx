import { useState } from 'react'
import { GoogleGenerativeAI } from '@google/genai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

export default function App() {
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const analyzePerformance = async () => {
    if (!text.trim()) {
      alert('Por favor, insira um texto para análise')
      return
    }

    if (!apiKey) {
      setAnalysis('Erro: GEMINI_API_KEY não configurada')
      return
    }

    setLoading(true)
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

      const prompt = `Analise o seguinte texto de fala e forneça um relatório detalhado de desempenho:\n\n"${text}"\n\nForneça:
1. Pontuação Geral (0-10)
2. Principais Sugestões
3. Pontos Fortes
4. Áreas para Melhoria`

      const result = await model.generateContent(prompt)
      const response = await result.response
      setAnalysis(response.text())
    } catch (error: any) {
      setAnalysis(
        `Erro na API: ${error?.message || 'Falha ao conectar com o Gemini. Verifique sua API Key.'}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-light-text dark:text-dark-text">Speek It</h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-light-text dark:text-dark-text hover:opacity-80 transition"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">
                Sua Fala
              </h2>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite ou cole aqui o texto da sua fala..."
                className="w-full h-64 p-4 rounded-lg border border-light-primary dark:border-dark-primary bg-white dark:bg-dark-primary text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
              />
              <button
                onClick={analyzePerformance}
                disabled={loading}
                className="w-full mt-4 px-6 py-3 bg-light-accent dark:bg-dark-accent text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Analisando...' : 'Analisar Desempenho'}
              </button>
            </div>

            {/* Analysis Section */}
            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">
                Relatório de Desempenho
              </h2>
              <div className="h-64 overflow-y-auto p-4 bg-white dark:bg-dark-primary rounded-lg text-light-text dark:text-dark-text whitespace-pre-wrap text-sm">
                {analysis || 'O relatório aparecerá aqui...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
