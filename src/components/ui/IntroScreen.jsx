import { useState, useEffect, useCallback } from "react";
import { useGame } from "../../context/GameContext";
import { useAudio } from "../../context/AudioContext";
import TypewriterText from "./TypewriterText";
import mikuImg from "../../assets/Miku.png";

const INTRO_MESSAGES = [
  {
    speaker: "system",
    text: "> Iniciando conexión segura...",
    voice: "system",
  },
  {
    speaker: "system",
    text: "> Bienvenido, Operador.",
    voice: "system",
  },
  {
    speaker: "system",
    text: "> Estado de la misión: CRÍTICO",
    voice: "system",
  },
  {
    speaker: "miku",
    text: "Hey... ¿Me escuchas? Soy Miku. Tu guía en esta operación.",
    voice: "miku",
  },
  {
    speaker: "miku",
    text: "Tenemos un problema. Teto ha encriptado una carta muy importante. Una carta para TI.",
    voice: "miku",
  },
  {
    speaker: "miku",
    text: "Verás... ella tiene MIEDO. Miedo de que leas lo que realmente siente.",
    voice: "miku",
  },
  {
    speaker: "miku",
    text: "Ha fragmentado la carta en 4 piezas y las ha escondido en lo más profundo de su mente.",
    voice: "miku",
  },
  {
    speaker: "system",
    text: "> Archivo detectado: carta_final.txt",
    voice: "system",
  },
  {
    speaker: "system",
    text: "> Estado: CORRUPTO | Fragmentos: 4 | Encriptación: MÁXIMA",
    voice: "system",
  },
  {
    speaker: "miku",
    text: "Tu misión es hackear la mente de Teto. Cada nivel que superes recuperará un PAQUETE DE DATOS.",
    voice: "miku",
  },
  {
    speaker: "miku",
    text: "4 piezas. 4 niveles. 4 barreras que Teto ha puesto entre tú y sus sentimientos.",
    voice: "miku",
  },
  {
    speaker: "system",
    text: "> Paquete 1: HEADER_INFO (El Encabezado)",
    voice: "system",
  },
  {
    speaker: "system",
    text: "> Paquete 2: LOGIC_BYPASS (El Protocolo)",
    voice: "system",
  },
  {
    speaker: "system",
    text: "> Paquete 3: EMOTIONAL_PAYLOAD (El Contenido)",
    voice: "system",
  },
  {
    speaker: "system",
    text: "> Paquete 4: AUTH_SIGNATURE (La Firma)",
    voice: "system",
  },
  {
    speaker: "miku",
    text: "¿Estás listo para descifrar lo que Teto no se atreve a decirte en voz alta?",
    voice: "miku",
  },
  {
    speaker: "miku",
    text: "Entonces... comencemos la operación. Sudo access: GRANTED.",
    voice: "miku",
  },
];

export default function IntroScreen() {
  const { startGame } = useGame();
  const { initAudio } = useAudio();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [messageComplete, setMessageComplete] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Inicializar audio en el primer clic
  const ensureAudioInit = useCallback(() => {
    if (!audioInitialized) {
      initAudio();
      setAudioInitialized(true);
    }
  }, [audioInitialized, initAudio]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (!messageComplete) {
      // Si el mensaje no está completo, completarlo
      setMessageComplete(true);
      return;
    }

    if (currentMessage < INTRO_MESSAGES.length - 1) {
      setCurrentMessage((prev) => prev + 1);
      setMessageComplete(false);
    } else {
      // Fin de la intro
      startGame();
    }
  };

  // Soporte para tecla Enter y Espacio
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        ensureAudioInit();
        // Lógica inline para evitar problemas de closure
        if (!messageComplete) {
          setMessageComplete(true);
        } else if (currentMessage < INTRO_MESSAGES.length - 1) {
          setCurrentMessage((prev) => prev + 1);
          setMessageComplete(false);
        } else {
          startGame();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messageComplete, currentMessage, startGame, ensureAudioInit]);

  const handleSkip = () => {
    startGame();
  };

  const msg = INTRO_MESSAGES[currentMessage];
  const isSystem = msg.speaker === "system";
  const isLastMessage = currentMessage === INTRO_MESSAGES.length - 1;

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 z-50"
      onClick={() => {
        ensureAudioInit();
        handleNext();
      }}
    >
      {/* Terminal Header */}
      <div className="w-full max-w-3xl">
        <div className="border-2 border-gray-700 bg-gray-900 p-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-4 text-gray-400 text-sm">
            teto_mind_hack.sh - Conexión establecida
          </span>
        </div>

        {/* Terminal Body */}
        <div className="border-2 border-t-0 border-gray-700 bg-black p-6 min-h-[400px] flex flex-col">
          {/* Área de mensajes anteriores (últimos 3) */}
          <div className="flex-1 space-y-2 mb-6 opacity-50">
            {INTRO_MESSAGES.slice(
              Math.max(0, currentMessage - 3),
              currentMessage,
            ).map((m, i) => (
              <p
                key={i}
                className={`text-sm ${
                  m.speaker === "system" ? "text-green-400" : "text-cyan-300"
                }`}
              >
                {m.speaker === "system" ? m.text : `[MIKU]: ${m.text}`}
              </p>
            ))}
          </div>

          {/* Mensaje actual */}
          <div className="flex items-start gap-4">
            {!isSystem && (
              <div className="w-16 h-16 border-2 border-cyan-400 overflow-hidden shrink-0 animate-pulse">
                <img
                  src={mikuImg}
                  alt="Miku"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              {isSystem ? (
                <p className="text-green-400 text-lg">
                  <TypewriterText
                    key={currentMessage}
                    text={msg.text}
                    voice="system"
                    speed={20}
                    onComplete={() => setMessageComplete(true)}
                  />
                </p>
              ) : (
                <div>
                  <span className="text-cyan-400 text-sm font-bold">
                    [MIKU]:
                  </span>
                  <p className="text-white text-lg mt-1">
                    <TypewriterText
                      key={currentMessage}
                      text={msg.text}
                      voice="miku"
                      speed={25}
                      onComplete={() => setMessageComplete(true)}
                    />
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Indicador de continuar */}
          {messageComplete && (
            <div className="mt-6 text-center animate-pulse">
              <span className="text-gray-400 text-sm">
                {isLastMessage
                  ? "[ CLICK PARA INICIAR MISIÓN ]"
                  : "[ CLICK PARA CONTINUAR ]"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Botón Skip */}
      {showSkip && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="mt-4 text-gray-600 hover:text-gray-400 text-sm transition-colors"
        >
          [SKIP INTRO]
        </button>
      )}

      {/* Barra de progreso */}
      <div className="w-full max-w-3xl mt-4">
        <div className="h-1 bg-gray-800 rounded">
          <div
            className="h-full bg-cyan-400 rounded transition-all duration-300"
            style={{
              width: `${((currentMessage + 1) / INTRO_MESSAGES.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-gray-600 text-xs mt-1 text-center">
          {currentMessage + 1} / {INTRO_MESSAGES.length}
        </p>
      </div>
    </div>
  );
}
