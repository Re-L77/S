import { GameProvider } from "./context/GameContext";
import Layout from "./components/ui/Layout";
import GameManager from "./components/GameManager";

function App() {
  return (
    <GameProvider>
      <Layout>
        <GameManager />
      </Layout>
    </GameProvider>
  );
}

export default App;
