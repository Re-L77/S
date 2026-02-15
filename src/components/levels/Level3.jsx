import { useState } from "react";
import RhythmEngine from "./RhythmEngine";
import { useGame } from "../../context/GameContext";

export default function Level3() {
  const { lives } = useGame();
  const [difficulty, setDifficulty] = useState(null);

  return (
    // DISEÑO LIMPIO: Ocupa todo el espacio, sin recuadros extra
    <div className="w-full h-[650px] flex bg-black font-mono overflow-hidden border-b-4 border-white">
      <div className="flex-1 relative bg-black">
        {!difficulty ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-10 z-10 relative">
            <h2 className="text-white text-4xl tracking-[0.3em] font-black border-b-4 border-white pb-4">
              EMOTIONAL_PAYLOAD
            </h2>
            <div className="flex flex-col gap-4 w-64">
              {["easy", "normal", "hard"].map((d) => (
                <button 
                  key={d} 
                  onClick={() => setDifficulty(d)}
                  className="border-2 border-white py-3 text-white font-bold hover:bg-white hover:text-black transition-all uppercase tracking-widest text-lg"
                >
                  [ {d} ]
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-[10px] mt-4 uppercase">Selecciona intensidad del bypass</p>
          </div>
        ) : (
          // Usamos la ruta directa a public/video.mp4
          <RhythmEngine videoSrc="/video.mp4" difficulty={difficulty} />
        )}
      </div>

      {/* PANEL LATERAL MINIMALISTA (Sin bordes de recuadro) */}
      <div className="w-48 bg-black p-6 text-white border-l-4 border-white flex flex-col">
        <h3 className="text-white mb-8 font-black text-center border-b-2 border-white pb-2 uppercase tracking-tighter">Status</h3>
        <div className="space-y-6">
            <div>
                <p className="text-gray-500 text-[10px] uppercase mb-1">Integridad</p>
                <p className="text-red-500 text-2xl">{"♥".repeat(lives)}</p>
            </div>
            <div>
                <p className="text-gray-500 text-[10px] uppercase mb-1">Frecuencia</p>
                <p className="text-cyan-400 animate-pulse font-bold">{difficulty ? difficulty.toUpperCase() : "---"}</p>
            </div>
        </div>
        <div className="mt-auto opacity-30 text-[9px] leading-tight">
           * Analizando flujo de datos...<br/>
           * 8.0s de calibración inicial.
        </div>
      </div>
    </div>
  );
}