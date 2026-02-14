import { useState, useEffect } from "react";
import { useAudio } from "../../context/AudioContext";

export default function LevelLoader({ levelNumber, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading, ready, fadeout
  const [opacity, setOpacity] = useState(1);
  const { initAudio, playSfx } = useAudio();

  useEffect(() => {
    // Simular carga progresiva
    const loadingInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(loadingInterval);
          setPhase("ready");
          return 100;
        }
        // Velocidad variable para efecto más realista
        const increment = Math.random() * 15 + 5;
        return Math.min(100, prev + increment);
      });
    }, 100);

    return () => clearInterval(loadingInterval);
  }, []);

  // Manejar click para iniciar (habilita audio en navegadores)
  const handleStart = () => {
    initAudio(); // Inicializar audio con interacción del usuario
    playSfx("select");
    setPhase("fadeout");
  };

  useEffect(() => {
    if (phase === "fadeout") {
      // Animación de fade out
      const fadeInterval = setInterval(() => {
        setOpacity((prev) => {
          if (prev <= 0) {
            clearInterval(fadeInterval);
            onComplete();
            return 0;
          }
          return prev - 0.05;
        });
      }, 30);
      return () => clearInterval(fadeInterval);
    }
  }, [phase, onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      style={{ opacity }}
    >
      {/* Efecto de scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col items-center gap-8">
        {/* Título del nivel */}
        <div className="text-center">
          <div className="text-gray-500 font-mono text-sm mb-2 animate-pulse">
            CARGANDO...
          </div>
          <h1 className="text-4xl font-bold font-mono text-white animate-pulse">
            NIVEL {levelNumber}
          </h1>
        </div>

        {/* Barra de progreso */}
        <div className="w-64 h-2 border border-white/50 bg-black">
          <div
            className="h-full bg-teto-red transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Porcentaje */}
        <div className="font-mono text-white text-sm">
          {Math.floor(progress)}%
        </div>

        {/* Mensaje de estado o botón de inicio */}
        {phase === "ready" || phase === "fadeout" ? (
          <button
            onClick={handleStart}
            className="px-8 py-3 border-2 border-teto-red text-teto-red font-mono text-lg hover:bg-teto-red hover:text-black focus:bg-teto-red focus:text-black focus:outline-none transition-colors animate-pulse"
          >
            [ INICIAR ]
          </button>
        ) : (
          <div className="font-mono text-gray-400 text-xs text-center max-w-xs">
            {progress < 30 && "Inicializando sistema..."}
            {progress >= 30 && progress < 60 && "Cargando assets..."}
            {progress >= 60 && progress < 90 && "Preparando desafío..."}
            {progress >= 90 && progress < 100 && "Casi listo..."}
          </div>
        )}

        {/* Efecto de glitch en el borde */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white animate-ping"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
