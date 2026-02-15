import { useGame } from "../context/GameContext";
import Level1 from "./levels/Level1";
import LevelPlaceholder from "./levels/LevelPlaceholder";
import GameOverScreen from "./ui/GameOverScreen";
import Level2 from "./levels/Level2";
import Level3 from "./levels/Level3";

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
      return <Level3 />;
    // ... añade casos hasta el 7
    default:
      return <div className="text-green-400">¡GANASTE EL CORAZÓN DE TETO!</div>;
  }
};

export default GameManager;
