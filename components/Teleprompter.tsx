// Fix: This file was empty. Added the implementation for the Teleprompter component.
import React, { useState, useEffect, useRef } from 'react';
import { StoredText, AnalysisReport } from '../types';
import { Icon } from './Icon';
import { mockTranscribe } from '../services/audioAnalyzer';
import { analyzeSpeechWithGemini } from '../services/geminiService';

interface TeleprompterProps {
  textToRead: StoredText;
  onFinish: (recording: { textId: string; audioUrl: string; transcript: string; analysis: AnalysisReport }) => void;
  onCancel: () => void;
}

export const Teleprompter: React.FC<TeleprompterProps> = ({ textToRead, onFinish, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startScrolling = () => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    scrollIntervalRef.current = window.setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += 1;
      }
    }, 120 - scrollSpeed * 20); // Adjust interval based on speed
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const handleTogglePlayPause = () => {
    if (!isRecording) {
      startRecording();
    } else {
      if (isPaused) {
        startScrolling();
        mediaRecorderRef.current?.resume();
      } else {
        stopScrolling();
        mediaRecorderRef.current?.pause();
      }
      setIsPaused(prev => !prev);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        setIsAnalyzing(true);
        setError(null);
        try {
          const transcript = await mockTranscribe(audioBlob, textToRead.content);
          const analysis = await analyzeSpeechWithGemini(textToRead.content, transcript);
          onFinish({
            textId: textToRead.id,
            audioUrl,
            transcript,
            analysis
          });
        } catch (err) {
          console.error(err);
          setError('Falha ao analisar a gravação. Por favor, tente novamente.');
          setIsAnalyzing(false);
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      startScrolling();
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Não foi possível iniciar a gravação. Verifique as permissões do microfone.");
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      stopScrolling();
      setIsRecording(false);
      setIsPaused(true);
    }
  };
  
  const handleRestart = () => {
    if (window.confirm("Tem certeza que deseja reiniciar? Sua gravação atual será perdida.")) {
        if (mediaRecorderRef.current && isRecording) {
            // A clean stop without triggering onstop's analysis logic
            mediaRecorderRef.current.onstop = () => {};
            mediaRecorderRef.current.stop();
        }
        stopScrolling();
        if(scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        setIsRecording(false);
        setIsPaused(true);
        audioChunksRef.current = [];
        setError(null);
    }
  }

  if (isAnalyzing) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
        <div className="w-16 h-16 border-4 border-t-transparent border-light-accent rounded-full animate-spin"></div>
        <h2 className="text-2xl font-bold mt-4">Analisando sua fala...</h2>
        <p className="text-gray-500">Isso pode levar um momento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="p-4 bg-light-surface dark:bg-dark-surface shadow-md flex justify-between items-center print-hidden">
        <h2 className="text-xl font-bold">{textToRead.title}</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
          Cancelar
        </button>
      </div>

      <div className="flex-grow overflow-hidden relative">
        <div className="absolute top-1/2 left-0 right-0 border-t-2 border-red-500 z-10"></div>
        <div ref={scrollContainerRef} className="h-full overflow-y-scroll scroll-smooth p-8 pt-[50vh] pb-[50vh]">
          <p className="text-4xl font-serif leading-relaxed whitespace-pre-wrap">
            {textToRead.content}
          </p>
        </div>
      </div>
      {error && <div className="p-2 text-center bg-red-500/20 text-red-500">{error}</div>}

      <div className="p-4 bg-light-surface dark:bg-dark-surface shadow-inner flex flex-col sm:flex-row justify-center items-center gap-4 print-hidden">
        <div className="flex items-center gap-2">
            <label>Velocidade:</label>
            <input 
                type="range" 
                min="1" 
                max="5" 
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                disabled={isRecording && !isPaused}
                className="w-32"
            />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleRestart} title="Reiniciar" className="p-3 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary disabled:opacity-50" disabled={!isRecording}>
            <Icon name="restart" className="w-6 h-6" />
          </button>
          <button onClick={handleTogglePlayPause} title={isRecording && !isPaused ? 'Pausar' : 'Iniciar'} className="p-4 bg-light-accent text-white rounded-full text-2xl shadow-lg transform hover:scale-105">
            <Icon name={isRecording && !isPaused ? 'pause' : 'play'} className="w-8 h-8" />
          </button>
          <button onClick={handleStop} title="Parar & Analisar" className="p-3 rounded-full hover:bg-light-primary dark:hover:bg-dark-primary disabled:opacity-50" disabled={!isRecording}>
            <Icon name="stop" className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};