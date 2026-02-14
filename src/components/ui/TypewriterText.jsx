import { useState, useEffect, useRef, useCallback } from "react";

// Frecuencias para simular voces de personajes (como Undertale)
const VOICE_CONFIGS = {
  miku: { baseFreq: 900, variation: 2, duration: 0.03 },
  cirno: { baseFreq: 960, variation: 10, duration: 0.06 },
  system: { baseFreq: 300, variation: 2, duration: 0.03 },
};

export default function TypewriterText({
  text,
  speed = 30,
  voice = "system",
  onComplete,
  className = "",
  playing = true,
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const audioContextRef = useRef(null);
  const indexRef = useRef(0);
  const initializedRef = useRef(false);

  // Crear AudioContext una sola vez
  useEffect(() => {
    audioContextRef.current = new (
      window.AudioContext || window.webkitAudioContext
    )();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Función para reproducir sonido de letra
  const playLetterSound = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed")
      return;

    const config = VOICE_CONFIGS[voice] || VOICE_CONFIGS.system;
    const ctx = audioContextRef.current;

    // Crear oscilador
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Frecuencia con variación aleatoria (como Undertale)
    const freq = config.baseFreq + (Math.random() - 0.5) * config.variation;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    oscillator.type = "square"; // Sonido 8-bit

    // Envelope de volumen
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      ctx.currentTime + config.duration,
    );

    // Conectar y reproducir
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + config.duration);
  }, [voice]);

  // Efecto typewriter
  useEffect(() => {
    if (!playing) return;

    // Reset al cambiar texto
    indexRef.current = 0;
    initializedRef.current = true;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        const char = text[indexRef.current];
        setDisplayedText(text.slice(0, indexRef.current + 1));

        // Solo reproducir sonido en letras (no espacios ni puntuación)
        if (/[a-záéíóúñA-ZÁÉÍÓÚÑ0-9]/.test(char)) {
          playLetterSound();
        }

        indexRef.current++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, playing, playLetterSound, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▌</span>}
    </span>
  );
}
