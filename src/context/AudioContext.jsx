import { createContext, useContext, useRef, useCallback } from "react";

const AudioContext = createContext(null);

// Frecuencias para simular voces de personajes (como Undertale)
const VOICE_CONFIGS = {
  miku: { baseFreq: 900, variation: 2, duration: 0.03 },
  cirno: { baseFreq: 960, variation: 10, duration: 0.06 },
  system: { baseFreq: 300, variation: 2, duration: 0.03 },
};

export function AudioProvider({ children }) {
  const audioContextRef = useRef(null);
  const initializedRef = useRef(false);

  // Inicializar el AudioContext (debe llamarse desde un evento de usuario)
  const initAudio = useCallback(() => {
    if (!initializedRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      initializedRef.current = true;
    }
    // Resumir si está suspendido
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, []);

  // Reproducir sonido de letra
  const playSound = useCallback((voice = "system") => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") return;

    // Resumir si está suspendido
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    const config = VOICE_CONFIGS[voice] || VOICE_CONFIGS.system;
    const ctx = audioContextRef.current;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      const freq = config.baseFreq + (Math.random() - 0.5) * config.variation;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      oscillator.type = "square";

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);
    } catch {
      // Silenciar errores
    }
  }, []);

  return (
    <AudioContext.Provider value={{ initAudio, playSound }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    // Fallback si no hay provider
    return { 
      initAudio: () => {}, 
      playSound: () => {} 
    };
  }
  return context;
}
