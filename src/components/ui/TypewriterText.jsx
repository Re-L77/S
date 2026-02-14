import { useState, useEffect, useRef } from "react";
import { useAudio } from "../../context/AudioContext";

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
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const { playSound } = useAudio();

  // Mantener referencia actualizada de onComplete sin causar re-renders
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Efecto typewriter
  useEffect(() => {
    if (!playing) return;

    // Reset al cambiar texto
    indexRef.current = 0;

    // Usar timeout para evitar setState síncrono
    const resetTimeout = setTimeout(() => {
      setDisplayedText("");
      setIsComplete(false);
    }, 0);

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        const char = text[indexRef.current];
        setDisplayedText(text.slice(0, indexRef.current + 1));

        // Solo reproducir sonido en letras (no espacios ni puntuación)
        if (/[a-záéíóúñA-ZÁÉÍÓÚÑ0-9]/.test(char)) {
          playSound(voice);
        }

        indexRef.current++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, speed);

    return () => {
      clearTimeout(resetTimeout);
      clearInterval(interval);
    };
  }, [text, speed, playing, playSound, voice]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▌</span>}
    </span>
  );
}
