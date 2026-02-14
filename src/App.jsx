import { GameProvider, useGame } from "./context/GameContext";
import { AudioProvider } from "./context/AudioContext";
import Layout from "./components/ui/Layout";
import GameManager from "./components/GameManager";
import IntroScreen from "./components/ui/IntroScreen";

function GameContent() {
  const { gameState } = useGame();

  // Mostrar intro antes de empezar
  if (gameState === "intro") {
    return <IntroScreen />;
  }

  // Juego normal
  return (
    <Layout>
      <GameManager />
    </Layout>
  );
}

function App() {
  return (
    <AudioProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </AudioProvider>
  );
}

export default App;
