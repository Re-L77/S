import { createContext, useContext, useRef, useCallback } from "react";

// Importar archivos de audio
import bakaSfx from "../assets/sound/ui/baka.mp3";
import selectSfx from "../assets/sound/ui/undertale-select-sound.mp3";
import dingSfx from "../assets/sound/ui/undertale-ding.mp3";
import weaponPullSfx from "../assets/sound/ui/deltarune-weapons-pull.mp3";
import sqekSfx from "../assets/sound/ui/sqek.mp3";
import whoshSfx from "../assets/sound/ui/whosh.wav";
import attackSfx from "../assets/sound/ui/attack.mp3";
import healSfx from "../assets/sound/ui/heal.mp3";
import hitSfx from "../assets/sound/ui/undertale-sound-effect-attack-hit.mp3";

const AudioContext = createContext(null);

// Frecuencias para simular voces de personajes (como Undertale)
const VOICE_CONFIGS = {
  miku: { baseFreq: 900, variation: 2, duration: 0.03 },
  cirno: { baseFreq: 960, variation: 10, duration: 0.06 },
  mizuki: { baseFreq: 520, variation: 8, duration: 0.045 },
  teto: { baseFreq: 400, variation: 15, duration: 0.05 },
  system: { baseFreq: 300, variation: 2, duration: 0.03 },
};

// Mapeo de efectos de sonido
const SFX_FILES = {
  baka: bakaSfx,
  select: selectSfx,
  ding: dingSfx,
  weaponPull: weaponPullSfx,
  sqek: sqekSfx,
  whosh: whoshSfx,
  attack: attackSfx,
  heal: healSfx,
  hit: hitSfx,
};

export function AudioProvider({ children }) {
  const audioContextRef = useRef(null);
  const initializedRef = useRef(false);
  const audioElementsRef = useRef({});
  const lastSoundTimeRef = useRef(0); // Para throttling de voces
  const VOICE_THROTTLE_MS = 25; // Mínimo 25ms entre sonidos de voz

  // Inicializar el AudioContext (debe llamarse desde un evento de usuario)
  const initAudio = useCallback(() => {
    if (!initializedRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
      initializedRef.current = true;
    }
    // Resumir si está suspendido
    if (
      audioContextRef.current &&
      audioContextRef.current.state === "suspended"
    ) {
      audioContextRef.current.resume();
    }
  }, []);

  // Reproducir sonido de letra (con throttling para evitar saturación)
  const playSound = useCallback((voice = "system") => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed")
      return;

    // Throttling: evitar reproducir sonidos muy seguidos
    const now = Date.now();
    if (now - lastSoundTimeRef.current < VOICE_THROTTLE_MS) {
      return; // Ignorar si es muy pronto
    }
    lastSoundTimeRef.current = now;

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
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + config.duration,
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);
    } catch {
      // Silenciar errores
    }
  }, []);

  // Reproducir efecto de sonido (archivo de audio)
  // allowOverlap: si true, crea nueva instancia para permitir múltiples sonidos simultáneos
  const playSfx = useCallback(
    (sfxName, volume = 0.5, playbackRate = 1, allowOverlap = false) => {
      const sfxFile = SFX_FILES[sfxName];
      if (!sfxFile) return;

      try {
        let audio;

        if (allowOverlap) {
          // Crear nueva instancia para permitir overlap
          audio = new Audio(sfxFile);
        } else {
          // Reutilizar o crear elemento de audio
          if (!audioElementsRef.current[sfxName]) {
            audioElementsRef.current[sfxName] = new Audio(sfxFile);
          }
          audio = audioElementsRef.current[sfxName];
          audio.currentTime = 0; // Reiniciar para permitir reproducción rápida
        }

        audio.volume = volume;
        audio.playbackRate = playbackRate; // Velocidad de reproducción
        audio.play().catch(() => {
          // Silenciar errores de autoplay
        });
      } catch {
        // Silenciar errores
      }
    },
    [],
  );

  return (
    <AudioContext.Provider value={{ initAudio, playSound, playSfx }}>
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
      playSound: () => {},
      playSfx: () => {},
    };
  }
  return context;
}
