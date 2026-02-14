import { createContext, useState, useContext } from "react";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [level, setLevel] = useState(1); // Nivel actual
  const [lives, setLives] = useState(3); // Vidas globales (Miku)
  const [gameState, setGameState] = useState("playing"); // playing, won, gameover

  // Acción: Perder vida
  const takeDamage = () => {
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) setGameState("gameover");
      return newLives;
    });
  };

  // Acción: Pasar de nivel
  const nextLevel = () => {
    setLevel((prev) => prev + 1);
  };

  return (
    <GameContext.Provider
      value={{
        level,
        lives,
        gameState,
        takeDamage,
        nextLevel,
        setLevel,
        setLives,
        setGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => useContext(GameContext);
