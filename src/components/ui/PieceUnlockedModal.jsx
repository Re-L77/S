import { useEffect, useState } from "react";
import { useAudio } from "../../context/AudioContext";
import TypewriterText from "./TypewriterText";
import mikuImg from "../../assets/Miku.png";
// Imágenes de los jefes de cada nivel
import mizukiImg from "../../assets/level1/mizuki.png";
import cirnoImg from "../../assets/level2/cirno.png";

// Colores complementarios para las piezas del corazón
const HEART_COLORS = {
  header: "#22c55e", // Verde
  logic: "#f97316", // Naranja
  signature: "#ec4899", // Rosa
};

// Información de cada pieza del corazón
const PIECE_DATA = {
  header: {
    name: "HEADER_INFO",
    title: "El Encabezado",
    subtitle: "Poner orden al caos",
    color: HEART_COLORS.header,
    bossName: "MIZUKI AKIYAMA",
    bossImg: mizukiImg,
    systemMessages: [
      "> Data fragment recovered: HEADER_INFO",
      "> Chaos levels stabilized.",
      "> Decryption progress: 33%",
    ],
    mikuComment:
      "Vaya, encontraste el inicio. Al menos ahora sabemos a quién va dirigida la carta. Ya no es solo ruido mental de Teto.",
    position: "Superior Izquierdo",
  },
  logic: {
    name: "LOGIC_BYPASS",
    title: "El Protocolo",
    subtitle: "Dejar de sobrepensar",
    color: HEART_COLORS.logic,
    bossName: "⑨ CIRNO ⑨",
    bossImg: cirnoImg,
    systemMessages: [
      "> Logic bypass successful.",
      "> Encryption key part 2/3 found.",
      "> Decryption progress: 66%",
    ],
    mikuComment:
      "Bien hecho. Has logrado que Teto deje de pensar estupideces por un segundo. La lógica de 'si no lo digo, no pasa nada' ha sido eliminada.",
    position: "Superior Derecho",
  },

  signature: {
    name: "AUTH_SIGNATURE",
    title: "La Firma",
    subtitle: "Resiliencia",
    color: HEART_COLORS.signature,
    bossName: "GUMI",
    bossImg: null, // Se agregará cuando tengas la imagen
    systemMessages: [
      "> Root access granted.",
      "> Sudo command accepted.",
      "> File 'carta_final.txt' decrypted.",
      "> Decryption progress: 100%",
    ],
    mikuComment:
      "Contraseña correcta. Lo lograste, ¿eh? Bueno, ya no hay excusas. El sistema está abierto de par en par. Mira lo que esa tonta ha guardado para ti.",
    position: "Inferior",
  },
};

export default function PieceUnlockedModal({ pieceKey, onClose }) {
  const [phase, setPhase] = useState(0); // 0: system, 1: miku, 2: done
  const [systemIndex, setSystemIndex] = useState(0);
  const [showMiku, setShowMiku] = useState(false);
  const [mikuComplete, setMikuComplete] = useState(false);
  const { playSfx } = useAudio();

  const piece = PIECE_DATA[pieceKey];

  // Sonido inicial al aparecer el modal
  useEffect(() => {
    playSfx("weaponPull", 0.5);
  }, [playSfx]);

  useEffect(() => {
    if (!piece) return;

    // Mostrar mensajes del sistema uno por uno
    if (phase === 0 && systemIndex < piece.systemMessages.length - 1) {
      const timer = setTimeout(() => {
        playSfx("ding", 0.6);
        setSystemIndex((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (phase === 0 && systemIndex === piece.systemMessages.length - 1) {
      // Después del último mensaje del sistema, mostrar a Miku
      const timer = setTimeout(() => {
        playSfx("select");
        setPhase(1);
        setShowMiku(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, systemIndex, piece, playSfx]);

  // Soporte para tecla Enter (antes del early return para cumplir reglas de hooks)
  useEffect(() => {
    if (!piece) return;
    const handleKeyDown = (e) => {
      if ((e.key === "Enter" || e.key === " ") && phase === 1 && mikuComplete) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, mikuComplete, onClose, piece]);

  if (!piece) return null;

  const handleClick = () => {
    if (phase === 1 && mikuComplete) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
      onClick={handleClick}
    >
      <div className="w-full max-w-2xl">
        {/* Header con efecto glitch y jefe derrotado */}
        <div className="text-center mb-4">
          {/* Jefe derrotado */}
          {piece.bossImg && (
            <div className="flex justify-center mb-3">
              <div
                className="w-20 h-20 border-2 overflow-hidden opacity-50 grayscale"
                style={{ borderColor: piece.color }}
              >
                <img
                  src={piece.bossImg}
                  alt={piece.bossName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500 mb-2">
            {piece.bossName} - DERROTADO
          </div>

          <div className="animate-pulse" style={{ color: piece.color }}>
            <div className="text-xs tracking-widest mb-2">
              ▼ PAQUETE DE DATOS RECUPERADO ▼
            </div>
            <h2 className="text-3xl font-bold glitch-text">{piece.name}</h2>
            <div className="text-sm mt-1 text-gray-400">{piece.title}</div>
            <div className="text-xs mt-1 text-gray-500 italic">
              "{piece.subtitle}"
            </div>
          </div>
        </div>

        {/* Visualización del corazón con la pieza iluminándose */}
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24">
            {/* Corazón simétrico perfecto */}
            <svg
              viewBox="0 0 32 32"
              className="w-full h-full"
              style={{ filter: "drop-shadow(0 0 10px rgba(255,51,102,0.5))" }}
            >
              {/* Lóbulo Superior Izquierdo (header) */}
              <path
                d="M16 10 Q16 6 12 4 Q8 2 4 6 Q0 10 2 14 L16 14 Z"
                fill={pieceKey === "header" ? piece.color : "#333"}
                className={
                  pieceKey === "header" ? "animate-pulse" : "opacity-50"
                }
              />
              {/* Lóbulo Superior Derecho (logic) - espejo exacto */}
              <path
                d="M16 10 Q16 6 20 4 Q24 2 28 6 Q32 10 30 14 L16 14 Z"
                fill={pieceKey === "logic" ? piece.color : "#333"}
                className={
                  pieceKey === "logic" ? "animate-pulse" : "opacity-50"
                }
              />
              {/* Parte Inferior (signature) - Ocupa toda la parte inferior */}
              <path
                d="M2 14 L30 14 L16 30 Z"
                fill={pieceKey === "signature" ? piece.color : "#333"}
                className={
                  pieceKey === "signature" ? "animate-pulse" : "opacity-50"
                }
              />
            </svg>
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-30"
              style={{ backgroundColor: piece.color }}
            />
          </div>
        </div>

        {/* Terminal con mensajes */}
        <div className="border-2 border-gray-700 bg-gray-900/80">
          {/* Terminal header */}
          <div className="border-b border-gray-700 p-2 flex items-center gap-2 bg-gray-800">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="ml-2 text-gray-500 text-xs">
              fragment_recovery.sh
            </span>
          </div>

          {/* Mensajes del sistema */}
          <div className="p-4 space-y-2 min-h-[120px]">
            {piece.systemMessages.slice(0, systemIndex + 1).map((msg, i) => (
              <p
                key={i}
                className="text-green-400 text-sm font-mono"
                style={{
                  animation:
                    i === systemIndex ? "fadeIn 0.3s ease-out" : "none",
                }}
              >
                {msg}
              </p>
            ))}
          </div>

          {/* Comentario de Miku */}
          {showMiku && (
            <div className="border-t border-gray-700 p-4 bg-black/50">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 border-2 border-cyan-400 overflow-hidden shrink-0">
                  <img
                    src={mikuImg}
                    alt="Miku"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-cyan-400 text-xs font-bold">
                    [MIKU]:
                  </span>
                  <p className="text-white text-sm mt-1">
                    <TypewriterText
                      key={`miku-${pieceKey}`}
                      text={piece.mikuComment}
                      voice="miku"
                      speed={20}
                      onComplete={() => setMikuComplete(true)}
                    />
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de continuar - discreto */}
        {mikuComplete && (
          <div className="text-center mt-2 animate-pulse">
            <span className="text-gray-600 text-xs">▼ click ▼</span>
          </div>
        )}

        {/* Posición de la pieza */}
        <div className="text-center mt-4 text-gray-600 text-xs">
          Cuadrante: {piece.position} | Fragmento{" "}
          {Object.keys(PIECE_DATA).indexOf(pieceKey) + 1}/3
        </div>
      </div>
    </div>
  );
}
