import { useGame } from "../../context/GameContext";
import { Heart, Lock } from "lucide-react";
import PieceUnlockedModal from "./PieceUnlockedModal";

// Colores complementarios para las piezas del corazón
const HEART_COLORS = {
  header: "#22c55e", // Verde
  logic: "#f97316", // Naranja (complementario del azul)
  payload: "#3b82f6", // Azul
  signature: "#ec4899", // Rosa/Magenta (complementario del verde)
};

// Componente del corazón simétrico dividido en 4 cuadrantes
const PixelHeart = ({ pieces, size = 40 }) => {
  // Corazón simétrico perfecto: viewBox 0 0 32 32, centro en x=16
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ filter: "drop-shadow(0 0 8px rgba(255,51,102,0.4))" }}
    >
      {/* Lóbulo Superior Izquierdo (header) - Verde */}
      <path
        d="M16 10 Q16 6 12 4 Q8 2 4 6 Q0 10 2 14 L16 14 Z"
        fill={pieces.header ? HEART_COLORS.header : "#333"}
        className={pieces.header ? "animate-pulse" : "opacity-40"}
      />
      {/* Lóbulo Superior Derecho (logic) - Naranja (espejo exacto) */}
      <path
        d="M16 10 Q16 6 20 4 Q24 2 28 6 Q32 10 30 14 L16 14 Z"
        fill={pieces.logic ? HEART_COLORS.logic : "#333"}
        className={pieces.logic ? "animate-pulse" : "opacity-40"}
      />
      {/* Parte Inferior Izquierda (payload) - Azul */}
      <path
        d="M2 14 L16 14 L16 30 L4 18 Q0 14 2 14 Z"
        fill={pieces.payload ? HEART_COLORS.payload : "#333"}
        className={pieces.payload ? "animate-pulse" : "opacity-40"}
      />
      {/* Parte Inferior Derecha (signature) - Rosa (espejo exacto) */}
      <path
        d="M30 14 L16 14 L16 30 L28 18 Q32 14 30 14 Z"
        fill={pieces.signature ? HEART_COLORS.signature : "#333"}
        className={pieces.signature ? "animate-pulse" : "opacity-40"}
      />
    </svg>
  );
};

const Layout = ({ children }) => {
  const {
    lives,
    level,
    heartPieces,
    decryptionProgress,
    isFullyDecrypted,
    unlockedPiece,
    closePieceModal,
    debugWinAll,
    debugWinLevel,
    takeDamage,
  } = useGame();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono p-4">
      {/* Marco del juego */}
      <div className="w-full max-w-6xl border-4 border-white p-8 relative min-h-[550px] flex flex-col">
        {/* Header: Vidas, Nivel y Corazón */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-gray-700 pb-2">
          <div className="text-xl">LVL {level}</div>

          {/* === CORAZÓN CON PIEZAS === */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <PixelHeart pieces={heartPieces} size={48} />

              {/* Overlay de progreso */}
              {!isFullyDecrypted && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <span className="text-[10px] text-green-400 bg-black px-1 whitespace-nowrap">
                    {decryptionProgress}%
                  </span>
                </div>
              )}
            </div>

            {/* Indicador de estado */}
            <div className="flex flex-col items-start text-xs">
              {isFullyDecrypted ? (
                <>
                  <span className="text-green-400 font-bold">■ DECRYPTED</span>
                  <span className="text-gray-500 text-[10px]">
                    carta_final.txt
                  </span>
                </>
              ) : (
                <>
                  <span className="text-gray-400 flex items-center gap-1">
                    <Lock size={10} /> ENCRYPTED
                  </span>
                  <span className="text-gray-600 text-[10px]">
                    {Object.values(heartPieces).filter(Boolean).length}/4
                    fragmentos
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <Heart
                key={i}
                fill={i < lives ? "#ff3366" : "black"}
                className={i < lives ? "text-teto-red" : "text-gray-800"}
              />
            ))}
          </div>
        </div>

        {/* Área del Minijuego */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {children}
        </div>
      </div>

      {/* Modal de pieza desbloqueada */}
      {unlockedPiece && (
        <PieceUnlockedModal
          pieceKey={unlockedPiece}
          onClose={closePieceModal}
        />
      )}

      {/* Botones DEBUG para testing - solo desarrollo */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 opacity-50 hover:opacity-100 transition-all">
          <button
            onClick={debugWinAll}
            className="bg-green-900 hover:bg-green-700 text-green-400 hover:text-white text-xs px-3 py-1 rounded border border-green-600"
          >
            🏆 WIN ALL
          </button>
          <button
            onClick={debugWinLevel}
            className="bg-blue-900 hover:bg-blue-700 text-blue-400 hover:text-white text-xs px-3 py-1 rounded border border-blue-600"
          >
            ✅ WIN LEVEL
          </button>
          <button
            onClick={takeDamage}
            className="bg-red-900 hover:bg-red-700 text-red-400 hover:text-white text-xs px-3 py-1 rounded border border-red-600"
          >
            💔 LOSE LIFE
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
