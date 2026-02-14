import { useGame } from "../../context/GameContext";
import { Heart } from "lucide-react";

const Layout = ({ children }) => {
  const { lives, level } = useGame();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono p-4">
      {/* Marco del juego */}
      <div className="w-full max-w-2xl border-4 border-white p-6 relative min-h-[500px] flex flex-col">
        {/* Header: Vidas y Nivel */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-gray-700 pb-2">
          <div className="text-xl">LVL {level}</div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
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

        {/* Caja de Texto (Narrativa) */}
        <div className="mt-6 border-2 border-white p-4 min-h-[80px] text-sm typing-effect">
          <p>Miku entra a la zona segura de Teto...</p>
        </div>
      </div>
    </div>
  );
};

export default Layout;
