/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with a large limit for base64 audio uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Shared Gemini Client Utility
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

// Speech evaluation API endpoint
app.post('/api/evaluate', async (req, res) => {
  try {
    const { audio, mimeType, targetText, duration, textId, textTitle } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Nenhum áudio foi enviado para análise.' });
    }
    if (!targetText) {
      return res.status(400).json({ error: 'O texto original para comparação é obrigatório.' });
    }

    // Attempt to initialize Gemini client
    let geminiClient;
    try {
      geminiClient = getGeminiClient();
    } catch (err: any) {
      console.log('Gemini key check:', err.message);
      return res.status(503).json({
        error: 'Erro de Configuração do Sistema',
        message: 'A chave de API do Gemini (GEMINI_API_KEY) não foi encontrada ou não está configurada no painel de Secrets da plataforma.',
        details: err.message
      });
    }

    console.log(`Analyzing audio with Gemini (type: ${mimeType}, length: ${audio.length} chars)`);

    // Call Gemini to analyze speech
    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Você é um avaliador e fonoaudiólogo especialista em oratória e comunicação de alta performance.
Analise a gravação de áudio em anexo, onde o usuário lê em voz alta o seguinte texto de referência:

"${targetText}"

Gere um relatório completo de oratória analisando os seguintes critérios:
1. Dicção (pronúncia correta, clareza das sílabas, detecção de termos mal pronunciados ou omitidos)
2. Ritmo (velocidade de fala, dinamismo, se está rápido demais, lento ou monótono)
3. Entonação (expressividade vocal, modulação da voz, prevenção de tons planos/robóticos)
4. Pausas (uso adequado de pausas naturais para respirar e enfatizar pontos chaves, fluidez geral)

Instruções críticas:
- Se o áudio estiver vazio, contiver apenas ruído estático, ou não contiver fala perceptível em português que se alinhe remotamente ao texto, atribua uma nota baixa e indique que a gravação não foi clara no feedback de Dicção.
- O feedback DEVE ser redigido em português amigável, direto, construtivo e profissional.
- Retorne obrigatoriamente um objeto JSON com o formato exato especificado no esquema. Não inclua Markdown, blocos de código adicionais ou texto explicativo fora do JSON.
`
            },
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audio
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: 'Nota de desempenho geral calculada de 0 a 100 baseado na média ponderada de todos os fatores.'
            },
            diccaoScore: {
              type: Type.INTEGER,
              description: 'Nota de dicção de 0 a 100.'
            },
            diccaoFeedback: {
              type: Type.STRING,
              description: 'Feedback textual sobre a clareza, articulação de palavras e pronúncia geral.'
            },
            ritmoScore: {
              type: Type.INTEGER,
              description: 'Nota de ritmo de 0 a 100.'
            },
            ritmoFeedback: {
              type: Type.STRING,
              description: 'Feedback textual sobre a velocidade e constância da oratória.'
            },
            entonacaoScore: {
              type: Type.INTEGER,
              description: 'Nota de entonação de 0 a 100.'
            },
            entonacaoFeedback: {
              type: Type.STRING,
              description: 'Feedback textual sobre o tom de voz, carisma e expressividade.'
            },
            pausasScore: {
              type: Type.INTEGER,
              description: 'Nota de pausas de 0 a 100.'
            },
            pausasFeedback: {
              type: Type.STRING,
              description: 'Feedback textual sobre o uso de silêncios estratégicos, respiração e fluidez.'
            },
            mispronouncedWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de palavras mal pronunciadas ou puladas na leitura.'
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'De 2 a 4 sugestões acionáveis para melhorar na próxima tentativa.'
            }
          },
          required: [
            'score',
            'diccaoScore',
            'diccaoFeedback',
            'ritmoScore',
            'ritmoFeedback',
            'entonacaoScore',
            'entonacaoFeedback',
            'pausasScore',
            'pausasFeedback',
            'mispronouncedWords',
            'suggestions'
          ]
        }
      }
    });

    if (!response.text) {
      throw new Error('O modelo não retornou um resultado de análise válido.');
    }

    const report = JSON.parse(response.text.trim());
    return res.json(report);

  } catch (error: any) {
    const errString = (() => {
      try {
        return typeof error === 'object' && error !== null ? (error.message || JSON.stringify(error)) : String(error);
      } catch (e) {
        return String(error);
      }
    })();
    
    const isLeakedKey = 
      errString.toLowerCase().includes('leaked') || 
      errString.toLowerCase().includes('leak') || 
      errString.includes('403') || 
      errString.includes('PERMISSION_DENIED') ||
      (error && (error.status === 403 || error.code === 403 || error.statusCode === 403));
    
    if (isLeakedKey) {
      return res.status(503).json({
        error: 'CONFIG_ERROR',
        message: 'Sua chave de API do Gemini (GEMINI_API_KEY) foi reportada como vazada ou inválida. Por segurança, o Google desativou esta credencial.',
        details: errString
      });
    }

    console.log('Speech processing status:', errString);

    return res.status(500).json({
      error: 'Falha na análise do áudio',
      message: error.message || 'Ocorreu um erro desconhecido durante o processamento da gravação.',
    });
  }
});

// Configure Vite or production static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Teleprompter Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
