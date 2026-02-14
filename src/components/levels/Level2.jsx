import { useState, useEffect } from "react";
import { useGame } from "../../context/GameContext";
import { HelpCircle } from "lucide-react"; // Icono provisional para el vaso
import cirnoFumo from "../../assets/cirno.png";

// Configuración
const SHUFFLE_DURATION_BASE = 2500; // Duración base del barajado
const SHUFFLE_SPEED_BASE = 1200; // Velocidad base (ms entre movimientos) - MUY LENTO
// Por cada acierto: duración +1500ms y velocidad -500ms (MUCHO más rápido)
const WINS_REQUIRED = 3; // Aciertos necesarios para pasar

export default function Level2() {
  const { nextLevel, takeDamage } = useGame();

  // Estado del juego local
  const [cups, setCups] = useState([0, 1, 2]); // Posiciones de los vasos
  const [winningCup, setWinningCup] = useState(1); // El pan empieza en medio (índice 1)
  const [gameState, setGameState] = useState("intro"); // intro, shuffling, picking, revealed
  const [selectedCup, setSelectedCup] = useState(null);
  const [wins, setWins] = useState(0); // Contador de aciertos
  const [bouncingCup, setBouncingCup] = useState(null); // Vaso que está "saltando"
  const [fumoTransform, setFumoTransform] = useState({
    x: 0,
    y: 0,
    rotate: 0,
    scaleX: 1,
    scaleY: 1,
    skew: 0,
  }); // CARICATURESCO

  // Calcular dificultad basada en aciertos - MUY AGRESIVO
  // Ronda 1: 1200ms (muy lento), 2.5s
  // Ronda 2: 600ms (medio), 4s
  // Ronda 3: 200ms (MUY rápido), 5.5s
  const getShuffleSpeed = () => Math.max(200, SHUFFLE_SPEED_BASE - wins * 500);
  const getShuffleDuration = () => SHUFFLE_DURATION_BASE + wins * 1500;

  // 1. Iniciar el juego
  const startGame = () => {
    setGameState("shuffling");
    const startTime = Date.now();
    const duration = getShuffleDuration();
    const speed = getShuffleSpeed();

    // Función recursiva con velocidad constante por ronda
    const shuffle = () => {
      const elapsed = Date.now() - startTime;

      // Si ya pasó el tiempo, detener
      if (elapsed > duration) {
        setBouncingCup(null);
        setFumoTransform({
          x: 0,
          y: 0,
          rotate: 0,
          scaleX: 1,
          scaleY: 1,
          skew: 0,
        });
        setGameState("picking");
        return;
      }

      // Reordenar el array de vasos aleatoriamente
      setCups((prev) => [...prev].sort(() => Math.random() - 0.5));

      // Hacer que un vaso aleatorio "salte" para efecto dinámico
      setBouncingCup(Math.floor(Math.random() * 3));
      setTimeout(() => setBouncingCup(null), 300);

      // CARICATURA TOTAL - squash & stretch + movimientos locos
      const isSquash = Math.random() > 0.5;
      setFumoTransform({
        x: (Math.random() - 0.5) * 200, // -100 a +100 px (MUY exagerado)
        y: (Math.random() - 0.5) * 80, // -40 a +40 px
        rotate: (Math.random() - 0.5) * 60, // -30 a +30 grados (LOCO)
        scaleX: isSquash ? 1.3 : 0.7, // Squash horizontal / vertical
        scaleY: isSquash ? 0.7 : 1.3, // Stretch opuesto
        skew: (Math.random() - 0.5) * 20, // -10 a +10 grados de inclinación
      });

      setTimeout(shuffle, speed);
    };

    shuffle();
  };

  // 2. Manejar el click del usuario
  const handleCupClick = (cupId) => {
    if (gameState !== "picking") return;

    setSelectedCup(cupId);
    setGameState("revealed");

    if (cupId === winningCup) {
      const newWins = wins + 1;
      setWins(newWins);

      if (newWins >= WINS_REQUIRED) {
        // ¡Ganó el nivel! Esperar y pasar
        setTimeout(nextLevel, 1500);
      } else {
        // Acierto pero necesita más. Nueva ronda
        setTimeout(() => {
          setGameState("intro");
          setSelectedCup(null);
          setCups([0, 1, 2]);
          // Colocar el pan en una posición aleatoria
          setWinningCup(Math.floor(Math.random() * 3));
        }, 1500);
      }
    } else {
      // Perdió. Restar vida y reiniciar este nivel
      takeDamage();
      setTimeout(() => {
        setGameState("intro"); // Reiniciar ronda
        setSelectedCup(null);
        setCups([0, 1, 2]); // Resetear posiciones
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Indicador de progreso */}
      <div className="mb-4 text-lg font-mono text-gray-300">
        Aciertos: {wins}/{WINS_REQUIRED}
      </div>

      <h2 className="text-xl mb-8 text-teto-red font-bold font-mono">
        {gameState === "intro"
          ? "¿DÓNDE ESTÁ LA BAGUETTE?"
          : gameState === "shuffling"
            ? "BARAJANDO..."
            : gameState === "picking"
              ? "ELIGE UN VASO"
              : selectedCup === winningCup
                ? wins + 1 >= WINS_REQUIRED
                  ? "¡NIVEL COMPLETADO!"
                  : "¡CORRECTO! OTRA VEZ..."
                : "¡FALLASTE!"}
      </h2>

      {/* Contenedor principal del juego */}
      <div className="relative flex flex-col items-center">
        {/* PERSONAJE - Coloca tu asset de fumo aquí */}
        <div
          className={`
            relative mb-4 transition-transform duration-100 ease-out
          `}
          style={{
            transform:
              gameState === "shuffling"
                ? `translateX(${fumoTransform.x}px) translateY(${fumoTransform.y}px) rotate(${fumoTransform.rotate}deg) scaleX(${fumoTransform.scaleX}) scaleY(${fumoTransform.scaleY}) skewX(${fumoTransform.skew}deg)`
                : "translateX(0) translateY(0) rotate(0deg) scaleX(1) scaleY(1) skewX(0deg)",
          }}
        >
          {/* CIRNO FUMO */}
          <img
            src={cirnoFumo}
            alt="Cirno Fumo"
            className="w-50 h-50 object-contain drop-shadow-lg"
            draggable={false}
          />
        </div>

        {/* Contenedor de Vasos */}
        <div className="flex justify-center w-full">
          <div className="relative h-40" style={{ width: "272px" }}>
            {[0, 1, 2].map((cupId) => {
              // Encontrar la posición actual del vaso en el array
              const position = cups.indexOf(cupId);
              // Lógica visual: ¿Deberíamos mostrar el pan?
              const showBread =
                (gameState === "intro" || gameState === "revealed") &&
                cupId === winningCup;
              const isSelected = selectedCup === cupId;
              const isBouncing = bouncingCup === cupId;

              // Calcular posición X: 80px vaso + 16px gap = 96px por slot
              const xOffset = position * 96;

              return (
                <div
                  key={cupId}
                  onClick={() => handleCupClick(cupId)}
                  style={{ left: `${xOffset}px` }}
                  className={`
                absolute bottom-0 w-20 h-24 flex flex-col items-center justify-end cursor-pointer
                transition-all duration-500 ease-in-out
                ${gameState === "picking" ? "hover:-translate-y-2" : ""}
                ${isBouncing ? "-translate-y-8" : ""}
              `}
                >
                  {/* EL PAN (Sprite) */}
                  <div
                    className={`
                absolute bottom-2 text-4xl transition-opacity duration-300
                ${showBread ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
              `}
                  >
                    🥖
                  </div>

                  {/* EL VASO (Tapa) */}
                  <div
                    className={`
                w-full h-20 bg-white border-4 border-gray-400 z-10 flex items-center justify-center
                transition-transform duration-500 ease-in-out
                ${showBread ? "-translate-y-12 mb-2" : "translate-y-0"}
              `}
                  >
                    {/* Decoración del vaso */}
                    <span className="text-black font-bold text-2xl rotate-180">
                      U
                    </span>
                  </div>

                  {/* Indicador de selección */}
                  {isSelected && (
                    <div className="absolute -bottom-8 text-white font-bold animate-bounce">
                      ^
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botón de Inicio */}
      {gameState === "intro" && (
        <button
          onClick={startGame}
          className="mt-12 px-6 py-2 border-2 border-white hover:bg-white hover:text-black font-mono animate-pulse"
        >
          [ COMENZAR ]
        </button>
      )}
    </div>
  );
}
