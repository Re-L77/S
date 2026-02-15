import { createContext, useState, useContext } from "react";

const GameContext = createContext();

// Mapeo de niveles a piezas del corazón
const LEVEL_TO_PIECE = {
  1: "header", // Nivel 1 -> Encabezado
  2: "logic", // Nivel 2 -> Protocolo/Lógica
  3: "signature", // Nivel 3 -> Firma/Autenticación
};

export const GameProvider = ({ children }) => {
  const [level, setLevel] = useState(1); // Nivel actual
  const [lives, setLives] = useState(3); // Vidas globales (Miku)
  const [gameState, setGameState] = useState("intro"); // intro, playing, won, gameover
  const [checkpoint, setCheckpoint] = useState(1); // Último nivel completado + 1

  // Sistema de piezas del corazón
  const [heartPieces, setHeartPieces] = useState({
    header: false, // Nivel 1 - El Encabezado
    logic: false, // Nivel 2 - El Protocolo
    signature: false, // Nivel 3 - La Firma
  });

  // Para mostrar el modal de pieza desbloqueada
  const [unlockedPiece, setUnlockedPiece] = useState(null);

  // Calcular progreso de desencriptación
  const decryptionProgress =
    Math.round(Object.values(heartPieces).filter(Boolean).length * 33.33);
  const isFullyDecrypted = decryptionProgress >= 99;

  // Acción: Iniciar el juego (después de la intro)
  const startGame = () => {
    setGameState("playing");
  };

  // Acción: Perder vida
  const takeDamage = () => {
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) setGameState("gameover");
      return newLives;
    });
  };

  // Acción: Curarse (ganar vidas, máximo 3)
  const heal = (amount = 1) => {
    setLives((prev) => Math.min(3, prev + amount));
  };

  // Acción: Completar un nivel y desbloquear pieza del corazón
  const completeLevel = (levelNum) => {
    const pieceKey = LEVEL_TO_PIECE[levelNum];
    if (pieceKey && !heartPieces[pieceKey]) {
      setHeartPieces((prev) => ({ ...prev, [pieceKey]: true }));
      setUnlockedPiece(pieceKey);
    }
    // Guardar checkpoint
    setCheckpoint(levelNum + 1);
  };

  // Acción: Cerrar el modal de pieza desbloqueada
  const closePieceModal = () => {
    setUnlockedPiece(null);
  };

  // Acción: Pasar de nivel
  const nextLevel = () => {
    setLevel((prev) => prev + 1);
  };

  // DEBUG: Simular ganar todos los niveles (solo para testing)
  const debugWinAll = () => {
    setHeartPieces({
      header: true,
      logic: true,
      signature: true,
    });
    setLevel(4); // Nivel después del último
    setGameState("won");
  };

  // DEBUG: Simular ganar el nivel actual
  const debugWinLevel = () => {
    completeLevel(level);
    nextLevel();
  };

  // Reiniciar desde el último checkpoint
  const restartFromCheckpoint = () => {
    setLevel(checkpoint);
    setLives(3);
    setGameState("playing");
  };

  // Reiniciar todo el juego
  const restartGame = () => {
    setLevel(1);
    setLives(3);
    setGameState("intro");
    setCheckpoint(1);
    setHeartPieces({
      header: false,
      logic: false,
      signature: false,
    });
    setUnlockedPiece(null);
  };

  return (
    <GameContext.Provider
      value={{
        level,
        lives,
        gameState,
        heartPieces,
        unlockedPiece,
        decryptionProgress,
        isFullyDecrypted,
        checkpoint,
        startGame,
        takeDamage,
        heal,
        nextLevel,
        completeLevel,
        closePieceModal,
        setLevel,
        setLives,
        setGameState,
        debugWinAll,
        debugWinLevel,
        restartFromCheckpoint,
        restartGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => useContext(GameContext);
