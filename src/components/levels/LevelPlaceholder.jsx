import { useGame } from "../../context/GameContext";

const LevelPlaceholder = ({ name }) => {
  const { nextLevel, takeDamage } = useGame();

  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl">{name}</h2>
      <p className="text-gray-400">[Aquí va el minijuego]</p>
      <div className="flex gap-4">
        <button
          onClick={takeDamage}
          className="bg-red-900 px-4 py-2 border border-red-500"
        >
          Simular Fallo
        </button>
        <button
          onClick={nextLevel}
          className="bg-green-900 px-4 py-2 border border-green-500"
        >
          Simular Victoria
        </button>
      </div>
    </div>
  );
};

export default LevelPlaceholder;
