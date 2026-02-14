import { useGame } from "../context/GameContext";
import LevelPlaceholder from "./levels/LevelPlaceholder";

import Level2 from "./levels/Level2";
// IMPORTANTE: Aquí importarás tus niveles reales cuando los crees
// import Level1Memorama from './levels/Level1Memorama';

const GameManager = () => {
  const { level, gameState } = useGame();

  if (gameState === "gameover") {
    return (
      <div className="text-center text-red-500 animate-pulse">
        <h1 className="text-4xl">DETERMINATION... FAILED</h1>
        <p>Teto no recibió su regalo :(</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 border-2 border-white p-2 hover:bg-white hover:text-black"
        >
          REINTENTAR
        </button>
      </div>
    );
  }

  // Router de Niveles
  switch (level) {
    case 1:
      // return <Level1Memorama />; // Descomentarás esto luego
      return <LevelPlaceholder name="Nivel 1: Memorama" />;
    case 2:
      return <Level2 />;
    case 3:
      return <LevelPlaceholder name="Nivel 3: Carrera" />;
    // ... añade casos hasta el 7
    default:
      return <div className="text-green-400">¡GANASTE EL CORAZÓN DE TETO!</div>;
  }
};

export default GameManager;
