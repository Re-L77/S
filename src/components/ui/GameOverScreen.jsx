import { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { useAudio } from "../../context/AudioContext";

// Caracteres de "corrupción" para los bugs
const BUG_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~▓▒░█▀▄▌▐■□▪▫●○◘◙◄►▲▼←↑→↓↔↕";
const generateBugText = () => {
  const length = Math.floor(Math.random() * 20) + 5;
  return Array.from(
    { length },
    () => BUG_CHARS[Math.floor(Math.random() * BUG_CHARS.length)],
  ).join("");
};

// Líneas del "Kernel Panic" emocional
const CRASH_LINES = [
  "> kernel panic - not syncing: Emotional buffer overflow",
  "> CPU 0: Machine check exception",
  "> Stack trace:",
  ">   [<0x00000000>] teto_feelings+0x1312/0x1314",
  ">   [<0x00000001>] try_express_love+0x404/0xffff",
  ">   [<0x00000002>] courage.ko: module not found",
  "> ---[ end trace: cariño.zip corrupted ]---",
  "",
  "> SYSTEM HALTED: Critical insecurity detected.",
  "> Emotional_Core_Dumped...",
  "> Teto ha levantado el firewall de nuevo.",
  "",
  "> Connection to heart@teto:8080 refused",
  "> Error: Permission denied (publickey,feelings)",
];

const MIKU_MESSAGES = [
  "¡Lo perdimos! Se ha desconectado.",
  "Teto se asustó y cerró el puerto 8080.",
  "Si no lo intentas de nuevo, va a pensar que no te importa.",
  "¿Vas a dejar que su timidez gane?",
  "El archivo 'carta_final.txt' sigue ahí esperando...",
  "Mantén tu DETERMINACIÓN.",
];

export default function GameOverScreen() {
  const { restartFromCheckpoint, level } = useGame();
  const { playSfx } = useAudio();
  const [displayedLines, setDisplayedLines] = useState([]);
  const [showMiku, setShowMiku] = useState(false);
  const [mikuIndex, setMikuIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [glitchEffect, setGlitchEffect] = useState(true);

  // Estado para bugs progresivos
  const [bugs, setBugs] = useState([]);
  const bugIntervalRef = useRef(null);
  const bugStartedRef = useRef(false);

  const handleReconnect = useCallback(() => {
    playSfx("select");
    // Efecto de "reinicio del sistema"
    setGlitchEffect(true);
    setTimeout(() => {
      restartFromCheckpoint();
    }, 500);
  }, [playSfx, restartFromCheckpoint]);

  // Efecto de glitch inicial
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchEffect((prev) => !prev);
    }, 100);

    // Detener glitch después de 1 segundo
    setTimeout(() => {
      clearInterval(glitchInterval);
      setGlitchEffect(false);
    }, 1000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Mostrar líneas de crash una por una
  useEffect(() => {
    if (displayedLines.length < CRASH_LINES.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, CRASH_LINES[prev.length]]);
        if (displayedLines.length % 3 === 0) {
          playSfx("ding", 0.3);
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      // Después de las líneas de crash, mostrar a Miku
      setTimeout(() => {
        playSfx("select");
        setShowMiku(true);
      }, 800);
    }
  }, [displayedLines, playSfx]);

  // Mensajes de Miku uno por uno
  useEffect(() => {
    if (showMiku && mikuIndex < MIKU_MESSAGES.length - 1) {
      const timer = setTimeout(() => {
        setMikuIndex((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (showMiku && mikuIndex === MIKU_MESSAGES.length - 1) {
      setTimeout(() => {
        playSfx("weaponPull", 0.5);
        setShowButton(true);
      }, 1500);
    }
  }, [showMiku, mikuIndex, playSfx]);

  // Soporte para tecla Enter
  useEffect(() => {
    if (!showButton) return;
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleReconnect();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showButton, handleReconnect]);

  // Bugs progresivos - si el usuario tarda mucho, la pantalla se llena de bugs
  useEffect(() => {
    if (!showButton || bugStartedRef.current) return;
    bugStartedRef.current = true;

    // Empezar a generar bugs después de 5 segundos
    const startDelay = setTimeout(() => {
      let bugCount = 0;
      const maxBugs = 50;

      bugIntervalRef.current = setInterval(() => {
        if (bugCount >= maxBugs) {
          clearInterval(bugIntervalRef.current);
          return;
        }

        // Cada bug tiene posición aleatoria y texto corrupto
        const newBug = {
          id: Date.now() + Math.random(),
          text: generateBugText(),
          x: Math.random() * 90, // % desde la izquierda
          y: Math.random() * 90, // % desde arriba
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 1.5,
          color: ["#ff0000", "#00ff00", "#ff00ff", "#ffff00", "#00ffff"][
            Math.floor(Math.random() * 5)
          ],
        };

        setBugs((prev) => [...prev, newBug]);
        bugCount++;

        // Sonido de glitch ocasional
        if (bugCount % 5 === 0) {
          playSfx("baka", 0.1);
        }
      }, 800); // Un bug cada 800ms
    }, 5000); // Empezar después de 5 segundos

    return () => {
      clearTimeout(startDelay);
      if (bugIntervalRef.current) {
        clearInterval(bugIntervalRef.current);
      }
    };
  }, [showButton, playSfx]);

  return (
    <div
      className={`fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4 overflow-hidden
        ${glitchEffect ? "animate-pulse" : ""}`}
      style={{
        animation: glitchEffect ? "glitchBg 0.1s infinite" : "none",
      }}
    >
      <style>{`
        @keyframes glitchBg {
          0% { transform: translate(0); filter: none; }
          20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
          40% { transform: translate(2px, -2px); filter: invert(0.1); }
          60% { transform: translate(-1px, -1px); filter: hue-rotate(-90deg); }
          80% { transform: translate(1px, 1px); filter: none; }
          100% { transform: translate(0); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes heartBreak {
          0% { transform: scale(1); }
          25% { transform: scale(1.1) rotate(-5deg); }
          50% { transform: scale(0.9) rotate(5deg); }
          75% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes bugFloat {
          0% { transform: translate(0, 0) rotate(var(--rot)); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translate(10px, -15px) rotate(calc(var(--rot) + 15deg)); }
          100% { transform: translate(-5px, 5px) rotate(calc(var(--rot) - 10deg)); opacity: 0.8; }
        }
        @keyframes bugGlitch {
          0%, 100% { filter: none; }
          25% { filter: hue-rotate(90deg) blur(1px); }
          50% { filter: invert(0.3); }
          75% { filter: hue-rotate(-90deg); }
        }
      `}</style>

      {/* BUGS PROGRESIVOS - aparecen si el usuario tarda */}
      {bugs.map((bug) => (
        <div
          key={bug.id}
          className="absolute pointer-events-none font-mono select-none z-40"
          style={{
            left: `${bug.x}%`,
            top: `${bug.y}%`,
            transform: `rotate(${bug.rotation}deg) scale(${bug.scale})`,
            color: bug.color,
            textShadow: `0 0 5px ${bug.color}`,
            animation:
              "bugFloat 3s ease-in-out infinite, bugGlitch 0.5s infinite",
            "--rot": `${bug.rotation}deg`,
            opacity: 0.7,
          }}
        >
          {bug.text}
        </div>
      ))}

      {/* Scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)",
        }}
      />

      {/* Corazón roto central */}
      <div
        className="mb-8"
        style={{ animation: "heartBreak 2s ease-in-out infinite" }}
      >
        <svg viewBox="0 0 64 64" width="120" height="120">
          {/* Mitad izquierda del corazón roto */}
          <path
            d="M32 12 C28 6, 20 4, 12 8 C4 12, 2 22, 6 28 L28 54 L32 32 L32 12 Z"
            fill="#ff3366"
            opacity="0.6"
            style={{ transform: "translate(-4px, 0) rotate(-5deg)" }}
          />
          {/* Mitad derecha del corazón roto */}
          <path
            d="M32 12 C36 6, 44 4, 52 8 C60 12, 62 22, 58 28 L36 54 L32 32 L32 12 Z"
            fill="#ff3366"
            opacity="0.6"
            style={{ transform: "translate(4px, 0) rotate(5deg)" }}
          />
          {/* Grieta en el centro */}
          <path
            d="M32 10 L30 20 L34 25 L30 35 L34 45 L32 55"
            stroke="#000"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      {/* Terminal de crash */}
      <div className="w-full max-w-2xl border-2 border-red-500/50 bg-black/90 font-mono text-sm">
        {/* Terminal header */}
        <div className="border-b border-red-500/30 p-2 flex items-center gap-2 bg-red-900/20">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-red-500/30" />
          <span className="ml-2 text-red-400 text-xs">
            teto_mind_hack.sh - CRITICAL ERROR
          </span>
        </div>

        {/* Crash log */}
        <div className="p-4 max-h-48 overflow-hidden">
          {displayedLines.map((line, i) => (
            <p
              key={i}
              className={`${line.includes("HALTED") || line.includes("refused") ? "text-red-400" : "text-green-400"} 
                ${line === "" ? "h-2" : ""}`}
            >
              {line}
            </p>
          ))}
          {displayedLines.length < CRASH_LINES.length && (
            <span
              className="text-green-400"
              style={{ animation: "blink 1s infinite" }}
            >
              _
            </span>
          )}
        </div>

        {/* Mensaje de Miku */}
        {showMiku && (
          <div className="border-t border-red-500/30 p-4 bg-black/50">
            <div className="flex items-start gap-3">
              <div className="text-cyan-400 text-2xl">👤</div>
              <div className="flex-1">
                <span className="text-cyan-400 text-xs font-bold">[MIKU]:</span>
                <p className="text-white mt-1">
                  {MIKU_MESSAGES.slice(0, mikuIndex + 1).map((msg, i) => (
                    <span key={i} className="block">
                      {msg}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón de reconexión */}
      {showButton && (
        <div className="mt-8 flex flex-col items-center gap-4 animate-pulse">
          <button
            onClick={handleReconnect}
            className="px-8 py-4 border-2 border-cyan-400 text-cyan-400 font-mono text-lg
              hover:bg-cyan-400 hover:text-black transition-all duration-300
              shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]"
          >
            [ RECONNECT ] sudo connect --force
          </button>
          <p className="text-gray-500 text-xs">
            Checkpoint: Nivel {level} | Presiona ENTER para reconectar
          </p>
        </div>
      )}
    </div>
  );
}
