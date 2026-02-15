import { useGame } from "../context/GameContext";
import Level1 from "./levels/Level1";
import LevelPlaceholder from "./levels/LevelPlaceholder";
import GameOverScreen from "./ui/GameOverScreen";

import Level4 from "./levels/Level4";

const GameManager = () => {
  const { level, gameState } = useGame();

  if (gameState === "gameover") {
    return <GameOverScreen />;
  }

  // Router de Niveles
  switch (level) {
    case 1:
      // return <Level1Memorama />; // Descomentarás esto luego
      return <Level1 name="Nivel 1: Memorama" />;
    case 2:
      return <Level2 />;
    case 3:
      return <LevelPlaceholder name="Nivel 3: Carrera" levelNumber={3} />;
    case 4:
      return <Level4 />;
    // ... añade casos hasta el 7
    default:
      return <div className="text-green-400">¡GANASTE EL CORAZÓN DE TETO!</div>;
  }
};

export default GameManager;
