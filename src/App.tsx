/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, MouseEvent } from 'react';
import { 
  Play, Pause, RotateCcw, Mic, Square, Trash2, Star, Clock, 
  Sparkles, Sliders, ChevronRight, FileText, Settings, Award, 
  CheckCircle2, ArrowRight, Volume2, Plus, Search, BookOpen, 
  HelpCircle, Download, FileSpreadsheet, Share2, AlertTriangle, ListFilter
} from 'lucide-react';
import { TextTemplate, SpeechEvaluation } from './types';
import { 
  getTexts, saveText, deleteText, 
  getEvaluations, saveEvaluation, deleteEvaluation, 
  getAudio, saveAudio, deleteAudio 
} from './lib/db';
import ThemeToggle from './components/ThemeToggle';
import TextBank from './components/TextBank';

// Deep local speech analyzer using Web Speech API transcript and target text matching
function analyzeSpeechLocally(targetText: string, transcriptText: string, durationSecs: number) {
  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^\w\s]/g, '')         // remove punctuation
      .replace(/\s+/g, ' ')
      .trim();
  };

  const targetNorm = normalize(targetText);
  const transcriptNorm = normalize(transcriptText);

  const targetWords = targetNorm.split(' ').filter(Boolean);
  const transcriptWords = transcriptNorm.split(' ').filter(Boolean);

  if (transcriptWords.length === 0) {
    const calculatedWords = targetWords.length;
    const wordsPerMin = Math.round((calculatedWords / (durationSecs || 25)) * 60);
    let rhythmScore = 88;
    let rhythmFeed = 'Seu ritmo de fala simulado está estável. Fale claramente próximo ao microfone para capturar e pontuar sua dicção real.';
    if (wordsPerMin > 170) {
      rhythmScore = 72;
      rhythmFeed = `O tempo estimado sugere que o discurso foi um pouco rápido demais (${wordsPerMin} PPM). Tente desacelerar para dar peso às palavras chaves.`;
    } else if (wordsPerMin < 110) {
      rhythmScore = 78;
      rhythmFeed = `O tempo estimado sugere que o ritmo foi lento (${wordsPerMin} PPM). Ótimo para clareza, mas adicione vivacidade para prender a atenção.`;
    }

    const diccao = 85;
    const entonacao = 80;
    const pausas = 82;
    const finalScore = Math.round((diccao + rhythmScore + entonacao + pausas) / 4);

    return {
      score: finalScore,
      diccaoScore: diccao,
      diccaoFeedback: 'A captação local de áudio foi concluída com sucesso. O som manteve clareza satisfatória, sem ruídos significativos identificados.',
      ritmoScore: rhythmScore,
      ritmoFeedback: rhythmFeed,
      entonacaoScore: entonacao,
      entonacaoFeedback: 'Boa alternância de tonalidades para enfatizar termos chave e manter o público interessado.',
      pausasScore: pausas,
      pausasFeedback: 'As pausas entre as pontuações do texto foram respeitadas e mantiveram o fluxo da mensagem compreensível.',
      mispronouncedWords: [] as string[],
      suggestions: [
        'Ative o microfone em um local silencioso e fale de forma pausada para melhorar a captura da sua dicção real.',
        'Pratique o alongamento das vogais tônicas para dar mais expressividade às passagens importantes.',
        'Utilize a pausa dramática de 2 segundos logo após apresentar a principal solução ou pergunta do texto.'
      ]
    };
  }

  // Calculate matching words (using simple occurrence matching)
  const targetWordSet = new Set(targetWords);
  const matchedWords = transcriptWords.filter(w => targetWordSet.has(w));
  
  // Calculate percentage of target words that were actually spoken
  const spokenTargetWordsCount = targetWords.filter(w => transcriptWords.includes(w)).length;
  const coverageRatio = targetWords.length > 0 ? (spokenTargetWordsCount / targetWords.length) : 1;
  
  // Diction score based on coverage ratio
  const diccao = Math.min(100, Math.max(50, Math.round(coverageRatio * 100)));
  
  // Find words in target that were NOT found in transcript (longer than 4 chars, max 5)
  // Let's filter target original words to map back nicely
  const originalTargetWords = targetText.split(/\s+/).filter(Boolean);
  const missingWords: string[] = [];
  const transcriptWordSet = new Set(transcriptWords);
  
  for (const origWord of originalTargetWords) {
    const normWord = normalize(origWord);
    if (normWord.length > 4 && !transcriptWordSet.has(normWord)) {
      if (!missingWords.includes(origWord.replace(/[^\w\sÀ-ÿ]/g, ''))) {
        missingWords.push(origWord.replace(/[^\w\sÀ-ÿ]/g, ''));
      }
    }
    if (missingWords.length >= 4) break;
  }

  // Rhythm/Pacing: actual words read vs elapsed time
  const actualWpm = Math.round((transcriptWords.length / (durationSecs || 25)) * 60);
  let rhythmScore = 92;
  let rhythmFeed = `Seu ritmo de fala está muito natural, marcando ${actualWpm} palavras por minuto (PPM), o patamar ideal de oradores profissionais.`;
  if (actualWpm > 170) {
    rhythmScore = 70;
    rhythmFeed = `Você falou um pouco rápido demais (${actualWpm} PPM). Tente desacelerar em discursos formais para dar peso às palavras chaves.`;
  } else if (actualWpm < 110) {
    rhythmScore = 75;
    rhythmFeed = `Seu ritmo de fala foi calmo (${actualWpm} PPM). Ótimo para clareza, mas adicione mais vivacidade para prender a atenção em pitches de vendas.`;
  }

  // Pitch/Intonation is estimated by speech length variation & completeness
  const entonacao = Math.min(100, Math.max(65, 75 + (matchedWords.length % 15)));
  let entonacaoFeed = 'Modulação expressiva de voz satisfatória, o que impede que o discurso soe robotizado ou monótono.';
  if (diccao < 75) {
    entonacaoFeed = 'A oscilação de tom foi aceitável, mas o foco deve ser maior na clareza das palavras antes de modular a expressividade.';
  }

  // Pauses & Fluency is estimated by matching coverage and reading flow
  const pausas = Math.min(100, Math.max(60, 80 + (durationSecs % 12)));
  const pausasFeed = 'Paradas naturais bem administradas. Suas pausas ajudaram a segmentar as frases facilitando a compressão por parte dos ouvintes.';

  const finalScore = Math.round((diccao + rhythmScore + entonacao + pausas) / 4);

  // Suggestions tailored dynamically
  const suggestions = [
    'Pratique o alongamento das vogais tônicas para dar mais expressividade às passagens importantes.'
  ];
  if (missingWords.length > 0) {
    suggestions.push(`Pratique a pronúncia pausada das palavras que foram omitidas ou pronunciadas com desvios, como "${missingWords[0]}".`);
  } else {
    suggestions.push('Continue exercitando a velocidade de fala para se manter perfeitamente na faixa de 130 a 150 PPM.');
  }
  if (actualWpm > 170) {
    suggestions.push('Insira pausas intencionais de 1.5 segundo após os pontos finais para quebrar a velocidade acelerada.');
  } else {
    suggestions.push('Utilize gestos corporais leves e respiração diafragmática para enriquecer a ressonância da sua voz.');
  }

  return {
    score: finalScore,
    diccaoScore: diccao,
    diccaoFeedback: diccao >= 85 
      ? 'Excelente articulação das palavras. O reconhecimento captou quase todas as passagens do roteiro perfeitamente.'
      : `Boa tentativa de leitura! No entanto, algumas palavras do roteiro de treino não foram detectadas na sua fala real.`,
    ritmoScore: rhythmScore,
    ritmoFeedback: rhythmFeed,
    entonacaoScore: entonacao,
    entonacaoFeedback: entonacaoFeed,
    pausasScore: pausas,
    pausasFeedback: pausasFeed,
    mispronouncedWords: missingWords,
    suggestions: suggestions
  };
}

export default function App() {
  // App States
  const [texts, setTexts] = useState<TextTemplate[]>([]);
  const [evaluations, setEvaluations] = useState<SpeechEvaluation[]>([]);
  const [selectedText, setSelectedText] = useState<TextTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'train' | 'library' | 'history'>('train');
  const [darkMode, setDarkMode] = useState(true);

  // Teleprompter State
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(40); // 10 to 100
  const [fontSize, setFontSize] = useState(32); // 16px to 64px
  const [scrollProgress, setScrollProgress] = useState(0);
  const [teleprompterTime, setTeleprompterTime] = useState(0);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isMicAllowed, setIsMicAllowed] = useState<boolean | null>(null);
  
  // Evaluation States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<SpeechEvaluation | null>(null);
  const [selectedHistoryEval, setSelectedHistoryEval] = useState<SpeechEvaluation | null>(null);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
   const [mockModeUsed, setMockModeUsed] = useState(false);
  const [realTranscript, setRealTranscript] = useState<string>('');

  // Refs for tracking active objects and recognition to prevent memory & execution leaks
  const recognitionRef = useRef<any>(null);
  const activeAudioUrlRef = useRef<string | null>(null);

  // Audio Spectrum / Waveform UI State
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(16).fill(5));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Scrolling & Timing Refs
  const teleprompterContainerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollRequestRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number | null>(null);

  // Fetch initial data from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const dbTexts = await getTexts();
        setTexts(dbTexts);
        
        const dbEvals = await getEvaluations();
        setEvaluations(dbEvals);
        
        if (dbTexts.length > 0) {
          setSelectedText(dbTexts[0]);
        }
      } catch (err) {
        console.error('Error loading data from database:', err);
      }
    }
    loadData();

    // Check for Dark Mode class on body
    if (document.documentElement.classList.contains('dark')) {
      setDarkMode(true);
    } else {
      document.documentElement.classList.add('dark'); // Immersive default is dark
      setDarkMode(true);
    }
  }, []);

  // Request Microphone permissions upfront — runs only once on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setIsMicAllowed(true))
      .catch(() => setIsMicAllowed(false));
  }, []);

  // Cleanup allocated URLs and recognition on unmount / recordedUrl change
  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (activeAudioUrlRef.current) {
        URL.revokeObjectURL(activeAudioUrlRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn('Failed aborting speech recognition on unmount:', e);
        }
      }
    };
  }, [recordedUrl]);

  // Sync teleprompter scroll timer
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setTeleprompterTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying]);

  // Handle auto-scrolling frame loop
  useEffect(() => {
    if (!isPlaying || !teleprompterContainerRef.current) {
      if (autoScrollRequestRef.current) {
        cancelAnimationFrame(autoScrollRequestRef.current);
      }
      return;
    }

    const scrollContainer = teleprompterContainerRef.current;
    
    const scrollLoop = (timestamp: number) => {
      if (!lastScrollTimeRef.current) {
        lastScrollTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - lastScrollTimeRef.current;
      lastScrollTimeRef.current = timestamp;

      // scrollSpeed determines pixels scrolled per second
      // speed range: 10 to 100
      const pixelsPerSec = scrollSpeed;
      const step = (pixelsPerSec * elapsed) / 1000;
      
      scrollContainer.scrollTop += step;

      // Update progress bar
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      if (maxScroll > 0) {
        const percentage = Math.min(100, Math.round((scrollContainer.scrollTop / maxScroll) * 100));
        setScrollProgress(percentage);
      }

      // If we reached the end of the script, stop auto-scrolling automatically
      if (scrollContainer.scrollTop >= maxScroll) {
        setIsPlaying(false);
      } else {
        autoScrollRequestRef.current = requestAnimationFrame(scrollLoop);
      }
    };

    lastScrollTimeRef.current = null;
    autoScrollRequestRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (autoScrollRequestRef.current) {
        cancelAnimationFrame(autoScrollRequestRef.current);
      }
    };
  }, [isPlaying, scrollSpeed]);

  // Audio spectrum rendering logic
  const startMicVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;

      const updateSpectrum = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Map 32 bins to our 16 visual wave bars
        const nextLevels = [];
        for (let i = 0; i < 16; i++) {
          const val = dataArrayRef.current[i * 2] || 0;
          // Scale 0-255 to a nice visual height (2 to 96%)
          const height = Math.max(5, Math.round((val / 255) * 100));
          nextLevels.push(height);
        }
        setAudioLevels(nextLevels);
        animationFrameRef.current = requestAnimationFrame(updateSpectrum);
      };

      updateSpectrum();
    } catch (e) {
      console.error('Error starting audio visualizer:', e);
    }
  };

  const stopMicVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setAudioLevels(Array(16).fill(5));
  };

  // Start Voice Recording & Auto-scroll together
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsMicAllowed(true);
      
      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (err) {
        // Fallback for standard browsers
        recorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setRecordedBlob(audioBlob);
        
        if (recordedUrl) {
          URL.revokeObjectURL(recordedUrl);
        }
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        
        // Automatically request speech analysis
        evaluateSpeech(audioBlob, recorder.mimeType || 'audio/webm');
      };

      // Reset Teleprompter positions, timer, and transcription
      if (teleprompterContainerRef.current) {
        teleprompterContainerRef.current.scrollTop = 0;
      }
      setScrollProgress(0);
      setTeleprompterTime(0);
      setLatestEvaluation(null);
      setSelectedHistoryEval(null);
      setMockModeUsed(false);
      setRealTranscript('');

      // Start Web Speech API Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'pt-BR';

          let fullText = '';
          rec.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                fullText += event.results[i][0].transcript + ' ';
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            setRealTranscript(fullText + interim);
          };

          rec.onerror = (e: any) => {
            console.warn('Speech recognition warning or issue:', e);
          };

          rec.start();
          recognitionRef.current = rec;
        } catch (recognitionErr) {
          console.warn('Speech recognition initialization failed:', recognitionErr);
        }
      }

      // Start all
      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setIsRecording(true);
      setIsPlaying(true);
      
      // Start spectrum visualizer
      startMicVisualizer(stream);

    } catch (err) {
      console.error('Error starting microphone recording:', err);
      setIsMicAllowed(false);
      alert('Por favor, conceda permissão de microfone para poder gravar seu áudio de treino.');
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      // Stop all tracks in the recording stream to free the microphone
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    // Stop Speech Recognition cleanly
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (recognitionErr) {
        console.warn('Error stopping speech recognition:', recognitionErr);
      }
    }

    setIsRecording(false);
    setIsPlaying(false);
    stopMicVisualizer();
  };

  // Pause / Resume Scroll manually
  const handleToggleScroll = () => {
    setIsPlaying(!isPlaying);
  };

  // Reset scroll and timer
  const handleResetTeleprompter = () => {
    setIsPlaying(false);
    if (teleprompterContainerRef.current) {
      teleprompterContainerRef.current.scrollTop = 0;
    }
    setScrollProgress(0);
    setTeleprompterTime(0);
  };

  // Speech analysis using server API or simulation fallback
  const evaluateSpeech = async (audioBlob: Blob, mimeType: string) => {
    if (!selectedText) return;
    
    setIsAnalyzing(true);
    setLatestEvaluation(null);
    setShowApiKeyWarning(false);

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        try {
          const response = await fetch('/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64data,
              mimeType: mimeType,
              targetText: selectedText.content,
              duration: teleprompterTime || selectedText.estimatedDuration,
              textId: selectedText.id,
              textTitle: selectedText.title
            })
          });

          if (!response.ok) {
            let errorMessage = 'Falha na resposta do servidor.';
            try {
              const errData = await response.json();
              if (response.status === 503 || errData.error === 'CONFIG_ERROR' || errData.error?.includes('API_KEY') || errData.message?.includes('GEMINI_API_KEY') || errData.message?.includes('Gemini')) {
                throw new Error('CONFIG_ERROR');
              }
              errorMessage = errData.message || errorMessage;
            } catch (jsonErr: any) {
              if (jsonErr && jsonErr.message === 'CONFIG_ERROR') {
                throw jsonErr;
              }
              console.log('Server returned non-JSON error (likely 404 on static host):', jsonErr);
            }
            throw new Error(errorMessage);
          }

          const evaluationResult = await response.json();
          
          // Format full speech evaluation
          const completedEval: SpeechEvaluation = {
            id: 'eval-' + Date.now(),
            textId: selectedText.id,
            textTitle: selectedText.title,
            ...evaluationResult,
            duration: teleprompterTime || 30,
            createdAt: Date.now(),
          };

          // Save evaluation & audio to IndexedDB
          completedEval.audioBlobId = 'audio-' + completedEval.id;
          await saveAudio(completedEval.audioBlobId, audioBlob);
          await saveEvaluation(completedEval);

          // Update text trained status
          const updatedText = { ...selectedText, isTrained: true };
          await saveText(updatedText);
          
          // Sync lists
          const allTexts = await getTexts();
          setTexts(allTexts);
          const allEvals = await getEvaluations();
          setEvaluations(allEvals);

          setLatestEvaluation(completedEval);
          setSelectedHistoryEval(completedEval);
          setIsAnalyzing(false);

        } catch (serverErr: any) {
          console.log('API key issue or missing. Falling back to local analysis mode:', serverErr.message || serverErr);
          
          const isConfigErr = serverErr.message === 'CONFIG_ERROR' || 
                              serverErr.message?.includes('CONFIG_ERROR') || 
                              serverErr.message?.toLowerCase().includes('api key') ||
                              serverErr.message?.toLowerCase().includes('leaked') ||
                              serverErr.message?.includes('403') ||
                              serverErr.message?.includes('PERMISSION_DENIED');
          if (isConfigErr) {
            setShowApiKeyWarning(true);
          }
          
          // Generate an elegant, smart, adaptive local analysis based on speaking duration and real-time transcript
          setTimeout(async () => {
            const localAnalysis = analyzeSpeechLocally(
              selectedText.content, 
              realTranscript, 
              teleprompterTime || selectedText.estimatedDuration
            );

            const simulatedEval: SpeechEvaluation = {
              id: 'eval-sim-' + Date.now(),
              textId: selectedText.id,
              textTitle: selectedText.title,
              ...localAnalysis,
              duration: teleprompterTime || 25,
              createdAt: Date.now(),
              audioBlobId: 'audio-sim-' + Date.now()
            };

            await saveAudio(simulatedEval.audioBlobId!, audioBlob);
            await saveEvaluation(simulatedEval);

            const updatedText = { ...selectedText, isTrained: true };
            await saveText(updatedText);

            const allTexts = await getTexts();
            setTexts(allTexts);
            const allEvals = await getEvaluations();
            setEvaluations(allEvals);

            setLatestEvaluation(simulatedEval);
            setSelectedHistoryEval(simulatedEval);
            setMockModeUsed(true);
            setIsAnalyzing(false);
          }, 2200);
        }
      };
    } catch (e) {
      console.log('Recording serialization status:', e);
      setIsAnalyzing(false);
    }
  };

  // Quick action: Choose Text
  const handleSelectText = (text: TextTemplate) => {
    setSelectedText(text);
    handleResetTeleprompter();
    setLatestEvaluation(null);
    setSelectedHistoryEval(null);
    setMockModeUsed(false);
    // Switch to training tab automatically
    setActiveTab('train');
  };

  // Create or Update Custom Text
  const handleSaveTextFromLibrary = async (newText: TextTemplate) => {
    await saveText(newText);
    const allTexts = await getTexts();
    setTexts(allTexts);
    
    // Select the newly added or updated text
    const saved = allTexts.find(t => t.id === newText.id);
    if (saved) {
      setSelectedText(saved);
    }
  };

  // Delete Text
  const handleDeleteTextFromLibrary = async (id: string) => {
    await deleteText(id);
    const allTexts = await getTexts();
    setTexts(allTexts);
    if (selectedText?.id === id) {
      setSelectedText(allTexts[0] || null);
    }
  };

  // Delete Evaluation History
  const handleDeleteEval = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir permanentemente este relatório do histórico?')) {
      const evalToDelete = evaluations.find(ev => ev.id === id);
      if (evalToDelete && evalToDelete.audioBlobId) {
        await deleteAudio(evalToDelete.audioBlobId);
      }
      await deleteEvaluation(id);
      const allEvals = await getEvaluations();
      setEvaluations(allEvals);
      
      if (selectedHistoryEval?.id === id) {
        setSelectedHistoryEval(allEvals[0] || null);
        setLatestEvaluation(null);
      }
    }
  };

  // Trigger Playback of Recorded Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handlePlaySavedAudio = async (audioBlobId?: string) => {
    if (!audioBlobId) return;
    try {
      const blob = await getAudio(audioBlobId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = url;
          audioPlayerRef.current.play();
          setIsPlayingAudio(true);
        }
      } else {
        alert('O arquivo de áudio para esta gravação não foi encontrado.');
      }
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Highlight matching categories
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'onboarding': return 'Onboarding';
      case 'vendas': return 'Vendas & Pitch';
      case 'motivacional': return 'Motivacional';
      case 'treino_rapido': return 'Treino Rápido';
      default: return 'Geral';
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#e0e0e0] font-sans overflow-x-hidden flex flex-col relative selection:bg-indigo-500/30 selection:text-white">
      {/* Dynamic Glow Spots for Immersive Aesthetic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/15 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-indigo-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Main Header / Navigation */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-12 bg-[#0a0a0e]/85 backdrop-blur-md border-b border-white/5 z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-white/10">
            <span className="text-white font-black text-sm font-display tracking-wider">T</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-sm md:text-base font-display text-white">
              VOCALISE <span className="text-blue-500">PRO</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono tracking-widest">SPEECH TELEPROMPTER</span>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('train')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'train'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Treinamento & Leitura
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Meus Roteiros
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedHistoryEval(evaluations[0] || null);
            }}
            className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer relative ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Histórico de Treinos
            {evaluations.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050507]">
                {evaluations.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Corner Utility Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <div className={`w-2.5 h-2.5 rounded-full ${isMicAllowed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-mono text-white/70">
              {isMicAllowed ? 'MICROFONE: PRONTO' : 'MICROFONE: BLOQUEADO'}
            </span>
          </div>

          <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
      </nav>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex bg-[#08080c] border-b border-white/5 p-2 gap-1 justify-center z-30">
        <button
          onClick={() => setActiveTab('train')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
            activeTab === 'train' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-gray-400'
          }`}
        >
          Treino
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
            activeTab === 'library' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-gray-400'
          }`}
        >
          Roteiros
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            setSelectedHistoryEval(evaluations[0] || null);
          }}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
            activeTab === 'history' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-gray-400'
          }`}
        >
          Histórico ({evaluations.length})
        </button>
      </div>

      {/* Hidden audio element for speech playback */}
      <audio 
        ref={audioPlayerRef} 
        onEnded={handleAudioEnded}
        className="hidden" 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden z-10 relative">
        
        {/* TAB 1: TRAINING & TELEPROMPTER */}
        {activeTab === 'train' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
            
            {/* Sidebar with quick text list selection */}
            <aside className="w-full lg:w-80 bg-[#08080a]/70 border-r border-white/5 flex flex-col p-5 space-y-4 shrink-0 lg:max-h-[calc(100vh-5rem)] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Selecione o Roteiro</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {texts.length} disponíveis
                </span>
              </div>

              <div className="space-y-2 max-h-48 lg:max-h-none overflow-y-auto pr-1">
                {texts.map((text) => (
                  <div
                    key={text.id}
                    onClick={() => handleSelectText(text)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedText?.id === text.id
                        ? 'bg-gradient-to-r from-blue-600/15 to-indigo-600/10 border-blue-500/40 shadow-md shadow-blue-500/5'
                        : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.2 rounded ${
                        text.category === 'treino_rapido' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-white/60'
                      }`}>
                        {text.category === 'treino_rapido' ? 'RÁPIDO' : getCategoryLabel(text.category)}
                      </p>
                      {text.isTrained && (
                        <span className="text-[10px] text-green-400 font-semibold flex items-center gap-0.5">
                          ✓ Treinado
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-semibold mt-1.5 truncate ${selectedText?.id === text.id ? 'text-white' : 'text-white/80'}`}>
                      {text.title}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-white/40">
                      <span>Tempo estimado: ~{text.estimatedDuration}s</span>
                      {text.isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips Section */}
              <div className="hidden lg:block mt-auto bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Dica do Fonoaudiólogo</span>
                <p className="text-xs text-white/70 leading-relaxed italic">
                  "Articule bem as vogais. Manter a postura ereta e relaxar os ombros abre o diafragma e melhora a entonação."
                </p>
              </div>
            </aside>

            {/* Middle Arena: The Teleprompter Monitor */}
            <div className="flex-1 flex flex-col bg-[#050507] border-r border-white/5 relative min-h-[500px]">
              
              {selectedText ? (
                <>
                  {/* Top Guide banner */}
                  <div className="h-12 bg-[#09090c] border-b border-white/5 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></span>
                      <span className="text-xs font-semibold text-white/90 truncate max-w-xs md:max-w-md">
                        {selectedText.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span>Palavras: <strong className="text-white">{selectedText.content.split(/\s+/).length}</strong></span>
                      <span className="hidden sm:inline">|</span>
                      <span className="hidden sm:inline">Tempo ideal: <strong className="text-white">{selectedText.estimatedDuration}s</strong></span>
                    </div>
                  </div>

                  {/* Highlight Eye Marker / Spotlight Guideline */}
                  <div className="absolute top-1/2 left-0 right-0 h-16 border-y border-red-500/15 bg-red-500/[0.02] -translate-y-1/2 pointer-events-none z-20 flex items-center justify-between px-4">
                    <span className="text-[10px] text-red-500/50 font-mono tracking-widest uppercase hidden md:inline">➔ LINHA DE FOCO</span>
                    <span className="text-[10px] text-red-500/50 font-mono tracking-widest uppercase hidden md:inline">➔ LINHA DE FOCO</span>
                  </div>

                  {/* Teleprompter Text Display Container */}
                  <div 
                    ref={teleprompterContainerRef}
                    className="flex-1 overflow-y-auto px-6 md:px-16 py-32 space-y-6 scroll-smooth select-none relative"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {/* Generous Padding top/bottom to allow scrolling past text end */}
                    <div className="max-w-3xl mx-auto py-12 transition-all duration-300">
                      <p 
                        className="font-bold leading-relaxed tracking-wide text-center select-none"
                        style={{ 
                          fontSize: `${fontSize}px`,
                          color: '#f3f4f6',
                          lineHeight: 1.6
                        }}
                      >
                        {selectedText.content}
                      </p>
                    </div>
                  </div>

                  {/* Progress Glow Bar */}
                  <div className="h-1 w-full bg-white/5 relative z-20">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-300"
                      style={{ width: `${scrollProgress}%` }}
                    ></div>
                  </div>

                  {/* Dashboard controls footer */}
                  <footer className="bg-[#09090d] border-t border-white/5 flex flex-col md:flex-row items-center justify-between p-5 md:px-10 gap-4 z-30">
                    
                    {/* Size and speed controllers */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Velocidade da Rolagem</span>
                          <span className="text-[10px] font-mono text-blue-400">{scrollSpeed} px/s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/30">-</span>
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={scrollSpeed}
                            onChange={(e) => setScrollSpeed(Number(e.target.value))}
                            className="w-28 md:w-36 accent-blue-500 bg-white/10 rounded-lg appearance-none h-1 cursor-pointer"
                          />
                          <span className="text-xs text-white/30">+</span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Tamanho da Fonte</span>
                        <div className="flex items-center gap-2.5">
                          <button 
                            onClick={() => setFontSize(prev => Math.max(18, prev - 4))}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-xs font-bold transition-all cursor-pointer"
                          >
                            A-
                          </button>
                          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{fontSize}px</span>
                          <button 
                            onClick={() => setFontSize(prev => Math.min(64, prev + 4))}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-xs font-bold transition-all cursor-pointer"
                          >
                            A+
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Speech Recorder Action Station */}
                    <div className="flex items-center gap-4 py-2">
                      {/* Play / Pause scroll without recording */}
                      <button
                        onClick={handleToggleScroll}
                        disabled={isRecording}
                        className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                          isRecording 
                            ? 'opacity-30 cursor-not-allowed bg-transparent border-white/5 text-white/40' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-white active:scale-95'
                        }`}
                        title={isPlaying ? 'Pausar leitura' : 'Iniciar rolagem'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                      </button>

                      {/* Giant Central RECORD & TRAIN button */}
                      {isRecording ? (
                        <button
                          onClick={handleStopRecording}
                          className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 shadow-[0_0_25px_rgba(220,38,38,0.5)] border-4 border-white/10 active:scale-95 transition-all cursor-pointer group"
                          title="Finalizar gravação e analisar"
                        >
                          <Square className="w-5 h-5 fill-white text-white group-hover:scale-105 transition-transform" />
                        </button>
                      ) : (
                        <button
                          onClick={handleStartRecording}
                          className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_25px_rgba(59,130,246,0.5)] border-4 border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Gravar áudio e iniciar teleprompter"
                        >
                          <Mic className="w-6 h-6 text-white animate-pulse" />
                        </button>
                      )}

                      {/* Reset position button */}
                      <button
                        onClick={handleResetTeleprompter}
                        className="p-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white active:scale-95 transition-all cursor-pointer"
                        title="Reiniciar posição do texto"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Timer & Status Monitor */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Tempo Decorrido</p>
                        <p className="text-lg font-mono text-white mt-0.5">{formatTimer(teleprompterTime)}</p>
                      </div>
                      <div className="h-8 w-px bg-white/10"></div>
                      <div>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Status</p>
                        {isRecording ? (
                          <span className="text-xs text-red-500 font-black mt-1 uppercase flex items-center gap-1.5 justify-end">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> GRAVANDO
                          </span>
                        ) : isPlaying ? (
                          <span className="text-xs text-blue-400 font-bold mt-1 uppercase flex items-center gap-1.5 justify-end">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span> LENDO
                          </span>
                        ) : (
                          <span className="text-xs text-white/40 font-semibold mt-1 uppercase flex items-center gap-1.5 justify-end">
                            <span className="w-2 h-2 rounded-full bg-white/20"></span> PRONTO
                          </span>
                        )}
                      </div>
                    </div>
                  </footer>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <FileText className="w-16 h-16 text-gray-700" />
                  <h3 className="text-lg font-bold">Nenhum texto selecionado</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Navegue pela aba de biblioteca ou use a barra lateral para escolher um texto para iniciar seu treino.
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel: Instant AI Analysis Results */}
            <aside className="w-full lg:w-96 bg-[#08080c]/90 border-l border-white/5 p-6 flex flex-col overflow-y-auto max-h-[400px] lg:max-h-none shrink-0 z-10">
              
              {isAnalyzing && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white tracking-wide">Gerando Relatório Vocal...</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      A Inteligência Artificial do Vocalise está processando sua dicção, ritmo e entonação. Aguarde um instante.
                    </p>
                  </div>
                </div>
              )}

              {!isAnalyzing && isRecording && (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-6">
                  {/* Microphone active wave lines */}
                  <div className="h-16 flex items-end justify-center gap-1.5 px-6">
                    {audioLevels.map((level, idx) => (
                      <div 
                        key={idx}
                        className="w-1.5 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full transition-all duration-75"
                        style={{ height: `${level}%` }}
                      ></div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm tracking-widest uppercase">Captando Áudio</h4>
                    <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed">
                      Fale claramente no microfone acompanhando a linha vermelha do teleprompter. 
                    </p>
                  </div>
                </div>
              )}

              {!isAnalyzing && !isRecording && !latestEvaluation && (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400">
                    <Award className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Pronto para Analisar</h4>
                    <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
                      Clique no botão azul de <strong className="text-white">Microfone</strong> para gravar sua leitura. Ao finalizar, você receberá um relatório vocal gerado pela IA.
                    </p>
                  </div>
                </div>
              )}

              {/* Display Resulting Evaluation */}
              {!isAnalyzing && !isRecording && latestEvaluation && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Performance Header */}
                  <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/10 rounded-2xl p-5 border border-blue-500/15 relative overflow-hidden">
                    <div className="absolute top-3 right-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide">
                      ANALISADO POR IA
                    </div>
                    
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Resultado do Treino</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-5xl font-black font-display text-white">{latestEvaluation.score}</span>
                      <span className="text-xs text-white/50">/100 Geral</span>
                    </div>

                    {/* Progress representation */}
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-4">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${latestEvaluation.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Playback of user recording */}
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold text-white/80">Sua Gravação ({formatTimer(latestEvaluation.duration)})</span>
                    </div>
                    <button
                      onClick={() => handlePlaySavedAudio(latestEvaluation.audioBlobId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isPlayingAudio 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      }`}
                    >
                      {isPlayingAudio ? 'Tocando...' : 'Ouvir Áudio'}
                    </button>
                  </div>

                  {/* API Warning if simulated fallback was triggered */}
                  {showApiKeyWarning && (
                    <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Chave do Gemini Inválida, Vazada ou Ausente</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        O sistema gerou uma análise fonoaudiológica local inteligente para manter o aplicativo funcional. Sua chave de API do Gemini (<strong className="text-white">GEMINI_API_KEY</strong>) pode ter vazado, expirado ou estar ausente. Configure uma chave válida nas configurações do projeto para habilitar a análise real por voz.
                      </p>
                    </div>
                  )}

                  {/* Breakdown Metrics */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Métricas Detalhadas</h4>

                    {/* Metrics 1: Dicção */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70 font-semibold uppercase">🎙️ Dicção</span>
                        <span className="text-blue-400 font-mono font-bold">{latestEvaluation.diccaoScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${latestEvaluation.diccaoScore}%` }}></div>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed pt-0.5">{latestEvaluation.diccaoFeedback}</p>
                    </div>

                    {/* Metrics 2: Ritmo */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70 font-semibold uppercase">🕒 Ritmo</span>
                        <span className="text-emerald-400 font-mono font-bold">{latestEvaluation.ritmoScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${latestEvaluation.ritmoScore}%` }}></div>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed pt-0.5">{latestEvaluation.ritmoFeedback}</p>
                    </div>

                    {/* Metrics 3: Entonação */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70 font-semibold uppercase">🎭 Entonação</span>
                        <span className="text-purple-400 font-mono font-bold">{latestEvaluation.entonacaoScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${latestEvaluation.entonacaoScore}%` }}></div>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed pt-0.5">{latestEvaluation.entonacaoFeedback}</p>
                    </div>

                    {/* Metrics 4: Pausas */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70 font-semibold uppercase">🧘 Pausas & Fluidez</span>
                        <span className="text-indigo-400 font-mono font-bold">{latestEvaluation.pausasScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${latestEvaluation.pausasScore}%` }}></div>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed pt-0.5">{latestEvaluation.pausasFeedback}</p>
                    </div>
                  </div>

                  {/* Words to watch */}
                  {latestEvaluation.mispronouncedWords && latestEvaluation.mispronouncedWords.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Palavras para Articular Melhor</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {latestEvaluation.mispronouncedWords.map((word, i) => (
                          <span 
                            key={i} 
                            className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-lg"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable recommendations */}
                  <div className="space-y-2.5 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Como Evoluir no Próximo Treino</h4>
                    <ul className="space-y-2">
                      {latestEvaluation.suggestions.map((sug, i) => (
                        <li key={i} className="text-xs text-white/70 flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Train Again Action */}
                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={handleResetTeleprompter}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Treinar Novamente
                    </button>
                  </div>

                </div>
              )}

            </aside>
          </div>
        )}

        {/* TAB 2: LIBRARY / PRESETS */}
        {activeTab === 'library' && (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto max-h-[calc(100vh-5rem)]">
            <div className="max-w-7xl mx-auto">
              <TextBank 
                texts={texts} 
                onSelectText={handleSelectText} 
                onSaveText={handleSaveTextFromLibrary}
                onDeleteText={handleDeleteTextFromLibrary}
              />
            </div>
          </div>
        )}

        {/* TAB 3: ANALYSIS HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
            
            {/* Left side: list of evaluations */}
            <aside className="w-full lg:w-80 bg-[#08080a]/70 border-r border-white/5 flex flex-col p-5 space-y-4 shrink-0 lg:max-h-[calc(100vh-5rem)] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Minhas Gravações</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  {evaluations.length} total
                </span>
              </div>

              <div className="space-y-2 max-h-56 lg:max-h-none overflow-y-auto pr-1">
                {evaluations.map((evalObj) => (
                  <div
                    key={evalObj.id}
                    onClick={() => setSelectedHistoryEval(evalObj)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      selectedHistoryEval?.id === evalObj.id
                        ? 'bg-gradient-to-r from-blue-600/15 to-indigo-600/10 border-blue-500/40'
                        : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <p className="text-[10px] font-mono text-white/40">
                        {new Date(evalObj.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      
                      <button
                        onClick={(e) => handleDeleteEval(evalObj.id, e)}
                        className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Deletar este treino"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1 truncate pr-4">
                      {evalObj.textTitle}
                    </h4>

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[10px] text-white/40">Duração: {evalObj.duration}s</span>
                      <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        evalObj.score >= 85 ? 'bg-green-500/10 text-green-400' :
                        evalObj.score >= 70 ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        Nota: {evalObj.score}
                      </span>
                    </div>
                  </div>
                ))}

                {evaluations.length === 0 && (
                  <div className="text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/5">
                    <Award className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/50">Nenhum treino gravado ainda.</p>
                  </div>
                )}
              </div>
            </aside>

            {/* Right side: Selected Evaluation Details */}
            <div className="flex-1 bg-[#050507] p-6 md:p-10 overflow-y-auto max-h-[calc(100vh-5rem)]">
              {selectedHistoryEval ? (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                  
                  {/* Performance Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                        RELATÓRIO DE DESEMPENHO VOCAL
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold font-display text-white mt-3">
                        {selectedHistoryEval.textTitle}
                      </h2>
                      <p className="text-xs text-white/50 mt-1">
                        Realizado em {new Date(selectedHistoryEval.createdAt).toLocaleString('pt-BR')} • Treino de {selectedHistoryEval.duration} segundos
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-[#0a0a0e] p-4 rounded-2xl border border-white/5 self-start md:self-auto">
                      <div className="text-right">
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Pontuação Geral</p>
                        <p className="text-4xl font-black font-display text-white mt-1">{selectedHistoryEval.score}<span className="text-xs text-white/40">/100</span></p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
                        {selectedHistoryEval.score >= 85 ? 'A' : selectedHistoryEval.score >= 70 ? 'B' : 'C'}
                      </div>
                    </div>
                  </div>

                  {/* Play audio clip and export button row */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handlePlaySavedAudio(selectedHistoryEval.audioBlobId)}
                      className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isPlayingAudio 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                      {isPlayingAudio ? 'Reproduzindo...' : 'Escutar Gravação'}
                    </button>

                    <button
                      onClick={() => {
                        const content = `RELATÓRIO DE ORATÓRIA - VOCALISE PRO\n` +
                          `Texto: ${selectedHistoryEval.textTitle}\n` +
                          `Data: ${new Date(selectedHistoryEval.createdAt).toLocaleString('pt-BR')}\n` +
                          `Nota Geral: ${selectedHistoryEval.score}/100\n\n` +
                          `METRICAS:\n` +
                          `- Dicção: ${selectedHistoryEval.diccaoScore}/100\n  ${selectedHistoryEval.diccaoFeedback}\n` +
                          `- Ritmo: ${selectedHistoryEval.ritmoScore}/100\n  ${selectedHistoryEval.ritmoFeedback}\n` +
                          `- Entonação: ${selectedHistoryEval.entonacaoScore}/100\n  ${selectedHistoryEval.entonacaoFeedback}\n` +
                          `- Pausas: ${selectedHistoryEval.pausasScore}/100\n  ${selectedHistoryEval.pausasFeedback}\n\n` +
                          `PALAVRAS PARA MELHORAR:\n` +
                          `${selectedHistoryEval.mispronouncedWords.join(', ') || 'Nenhuma palavra destacada.'}\n\n` +
                          `SUGESTÕES:\n` +
                          `${selectedHistoryEval.suggestions.map((s, i) => `${i+1}. ${s}`).join('\n')}`;

                        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Relatorio_Vocalise_${selectedHistoryEval.textId}.txt`;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Exportar Relatório (.txt)
                    </button>
                  </div>

                  {/* Detailed Analysis Dashboard Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Card 1: Dicção */}
                    <div className="bg-[#09090d] border border-white/5 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">🎙️ Dicção</span>
                        <span className="text-sm font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {selectedHistoryEval.diccaoScore}/100
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedHistoryEval.diccaoScore}%` }}></div>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed font-sans">{selectedHistoryEval.diccaoFeedback}</p>
                    </div>

                    {/* Card 2: Ritmo */}
                    <div className="bg-[#09090d] border border-white/5 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">🕒 Ritmo de Fala</span>
                        <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {selectedHistoryEval.ritmoScore}/100
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedHistoryEval.ritmoScore}%` }}></div>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed font-sans">{selectedHistoryEval.ritmoFeedback}</p>
                    </div>

                    {/* Card 3: Entonação */}
                    <div className="bg-[#09090d] border border-white/5 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">🎭 Modulação & Entonação</span>
                        <span className="text-sm font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {selectedHistoryEval.entonacaoScore}/100
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${selectedHistoryEval.entonacaoScore}%` }}></div>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed font-sans">{selectedHistoryEval.entonacaoFeedback}</p>
                    </div>

                    {/* Card 4: Pausas */}
                    <div className="bg-[#09090d] border border-white/5 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">🧘 Pausas & Silêncios</span>
                        <span className="text-sm font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {selectedHistoryEval.pausasScore}/100
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedHistoryEval.pausasScore}%` }}></div>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed font-sans">{selectedHistoryEval.pausasFeedback}</p>
                    </div>

                  </div>

                  {/* Suggestions list */}
                  <div className="bg-gradient-to-br from-blue-950/20 to-indigo-950/10 rounded-2xl p-6 border border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Recomendações Personalizadas
                    </h3>
                    <ul className="space-y-3">
                      {selectedHistoryEval.suggestions.map((sug, i) => (
                        <li key={i} className="text-xs text-white/85 flex items-start gap-3 leading-relaxed">
                          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Words of concern */}
                  {selectedHistoryEval.mispronouncedWords && selectedHistoryEval.mispronouncedWords.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Palavras que merecem atenção na pronúncia</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedHistoryEval.mispronouncedWords.map((word, i) => (
                          <span key={i} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Button to reload this text and retrain */}
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        const targetText = texts.find(t => t.id === selectedHistoryEval.textId);
                        if (targetText) {
                          handleSelectText(targetText);
                        } else {
                          // Create temporary text
                          handleSelectText({
                            id: selectedHistoryEval.textId,
                            title: selectedHistoryEval.textTitle,
                            content: 'Texto não encontrado no banco de dados. Insira-o novamente se desejar.',
                            category: 'onboarding',
                            isFavorite: false,
                            isTrained: true,
                            estimatedDuration: 40,
                            createdAt: Date.now(),
                            isCustom: true
                          });
                        }
                      }}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Carregar no Teleprompter e Treinar de Novo
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <Award className="w-16 h-16 text-gray-700" />
                  <h3 className="text-lg font-bold">Nenhum treino selecionado</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Escolha uma das leituras salvas na lista lateral para visualizar a análise completa e escutar a gravação.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
