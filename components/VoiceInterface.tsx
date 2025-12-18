
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createAudioBlob, decode, decodeAudioData } from '../utils/audio';

const VoiceInterface: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [userText, setUserText] = useState('');
  const [aiText, setAiText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const micStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
        sessionRef.current.close?.();
    }
    if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    
    setIsActive(false);
    setIsConnecting(false);
    nextStartTimeRef.current = 0;
    setUserText('');
    setAiText('');
  }, []);

  const startVoiceSession = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setUserText('');
      setAiText('');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Resume contexts to avoid browser suspension latency
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);

            const source = inputCtx.createMediaStreamSource(stream);
            // Smaller buffer size for lower latency (2048 vs 4096)
            const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createAudioBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Priority 1: Instant Audio Playback
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputAudioContextRef.current!;
              // Critical for gapless playback: schedule exactly at the end of the previous chunk
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
            }

            // Priority 2: Handling Interruptions (Zero-latency cut-off)
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Priority 3: UI Transcriptions (Non-blocking)
            if (message.serverContent?.outputTranscription) {
              setAiText(prev => prev + message.serverContent!.outputTranscription!.text);
            } else if (message.serverContent?.inputTranscription) {
              setUserText(prev => prev + message.serverContent!.inputTranscription!.text);
            }

            if (message.serverContent?.turnComplete) {
              // Optional: reset transcriptions for next turn if you want them clean
              // setUserText('');
              // setAiText('');
            }
          },
          onerror: (e) => {
            console.error('Session error:', e);
            setError('Ошибка соединения.');
            cleanup();
          },
          onclose: () => {
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          // Super-fast instructions: be ultra-concise, skip greetings, answer immediately.
          systemInstruction: 'Ты — скоростной ИИ-ассистент. Отвечай МГНОВЕННО и МАКСИМАЛЬНО КРАТКО на русском. Никаких вступлений, никакой вежливости, только суть. Если вопрос понятен — сразу ответ.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error('Microphone/Session Error:', err);
      setError('Нет доступа к микрофону.');
      setIsConnecting(false);
    }
  };

  const handleToggle = () => {
    if (isActive) {
      cleanup();
    } else {
      startVoiceSession();
    }
  };

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12">
      <div className="relative">
        {/* Animated Rings for active feedback */}
        <div className={`absolute inset-0 rounded-full border-2 border-indigo-500/20 scale-[1.5] transition-all duration-500 ${isActive ? 'animate-ping' : 'opacity-0'}`}></div>
        
        {/* Main Mic Button */}
        <button
          onClick={handleToggle}
          disabled={isConnecting}
          className={`relative z-10 w-40 h-40 md:w-56 md:h-56 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
            isActive 
              ? 'bg-indigo-600 shadow-[0_0_50px_rgba(79,70,229,0.6)] scale-105' 
              : isConnecting 
                ? 'bg-white/5 cursor-wait' 
                : 'glass hover:scale-105 border border-white/20'
          }`}
        >
          {isConnecting ? (
            <div className="flex space-x-1">
              <div className="w-2 h-8 bg-indigo-400 animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-12 bg-indigo-400 animate-bounce" style={{animationDelay: '100ms'}}></div>
              <div className="w-2 h-8 bg-indigo-400 animate-bounce" style={{animationDelay: '200ms'}}></div>
            </div>
          ) : (
            <svg className={`w-16 h-16 md:w-20 md:h-20 ${isActive ? 'text-white' : 'text-indigo-500'}`} fill="currentColor" viewBox="0 0 24 24">
              {isActive ? (
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              ) : (
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              )}
            </svg>
          )}
        </button>
      </div>

      <div className="text-center space-y-6 max-w-2xl px-6">
        <div className="min-h-[1.5rem]">
          {error ? (
             <p className="text-red-400 font-medium animate-pulse">{error}</p>
          ) : (
            <h3 className="text-xl font-medium text-white/80 tracking-tight">
              {isActive ? 'Слушаю...' : isConnecting ? 'Ускоряюсь...' : 'Мгновенный ответ готов'}
            </h3>
          )}
        </div>
        
        <div className="space-y-4">
           {userText && (
             <div className="opacity-60 transition-opacity">
               <p className="text-sm md:text-base italic">"{userText}"</p>
             </div>
           )}
           
           {aiText && (
             <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
               <p className="text-lg md:text-xl font-medium text-indigo-100 leading-tight">{aiText}</p>
             </div>
           )}
        </div>
      </div>

      {!isActive && !isConnecting && (
        <p className="text-white/20 text-sm font-light">
          Технология сверхнизкой задержки Gemini Live
        </p>
      )}
    </div>
  );
};

export default VoiceInterface;
