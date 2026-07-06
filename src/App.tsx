import { useState } from 'react'

interface AnalysisResult {
  score?: number
  suggestions?: string[]
  strengths?: string[]
  improvements?: string[]
  error?: string
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

export default function App() {
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const analyzePerformance = async () => {
    if (!text.trim()) {
      alert('Por favor, insira um texto para análise')
      return
    }

    if (!apiKey) {
      setAnalysis({
        error: 'Erro: VITE_GEMINI_API_KEY não configurada nos secrets do GitHub'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analise o seguinte texto de fala e forneça um relatório detalhado de desempenho:\n\n"${text}"\n\nForneça em formato JSON:\n{
  "score": (0-10),
  "suggestions": [lista de sugestões],
  "strengths": [lista de pontos fortes],
  "improvements": [lista de áreas de melhoria]
}`,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Erro da API: ${response.status}`)
      }

      const data = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (generatedText) {
        try {
          // Tenta extrair JSON da resposta
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
          const jsonData = jsonMatch ? JSON.parse(jsonMatch[0]) : null

          if (jsonData) {
            setAnalysis(jsonData)
          } else {
            setAnalysis({
              suggestions: [generatedText],
            })
          }
        } catch (e) {
          setAnalysis({
            suggestions: [generatedText],
          })
        }
      } else {
        setAnalysis({
          error: 'Nenhuma resposta recebida da API',
        })
      }
    } catch (error: any) {
      setAnalysis({
        error: `Erro na API: ${error?.message || 'Falha ao conectar com o Gemini'}`,
      })
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
                className="w-full h-64 p-4 rounded-lg border border-light-primary dark:border-dark-primary bg-white dark:bg-dark-primary text-light-text dark:text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
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
                {analysis ? (
                  <div>
                    {analysis.error && (
                      <div className="text-red-500">
                        <strong>Erro:</strong> {analysis.error}
                      </div>
                    )}
                    {analysis.score && (
                      <div className="mb-4">
                        <strong>Pontuação Geral:</strong> {analysis.score}/10
                      </div>
                    )}
                    {analysis.suggestions && analysis.suggestions.length > 0 && (
                      <div className="mb-4">
                        <strong>Sugestões Principais:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {analysis.suggestions.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.strengths && analysis.strengths.length > 0 && (
                      <div className="mb-4">
                        <strong>Pontos Fortes:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {analysis.strengths.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.improvements && analysis.improvements.length > 0 && (
                      <div>
                        <strong>Áreas para Melhoria:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {analysis.improvements.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  'O relatório aparecerá aqui...'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
