import { useGame } from "../../context/GameContext";

export default function ContinuaraScreen() {
  const { restartGame } = useGame();

  return (
    <div className="w-full h-[650px] flex flex-col items-center justify-center bg-black border-b-4 border-white">
      <div className="text-center space-y-8 animate-pulse">
        {/* Título principal */}
        <h1 className="text-6xl font-black text-white tracking-wider">
          CONTINUARÁ...
        </h1>
        
        {/* Subtítulo */}
        <p className="text-xl text-gray-400 tracking-wide">
          La historia completa próximamente
        </p>

        {/* Detalles adicionales */}
        <div className="mt-12 space-y-2 text-sm text-gray-600">
          <p>▶ Esta es una versión demo</p>
          <p>▶ Nivel 3: KASANE TETO - Próximamente</p>
        </div>

        {/* Botón para reiniciar */}
        <button
          onClick={restartGame}
          className="mt-8 border-2 border-white px-6 py-3 text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest"
        >
          [ VOLVER AL INICIO ]
        </button>
      </div>
    </div>
  );
}
