import { useState } from "react";
import { useGame } from "../../context/GameContext";
import GameModal from "../ui/GameModal";
import cirnoFumo from "../../assets/level2/cirno.png";
import glassImg from "../../assets/level2/glass.png";
import mikuImg from "../../assets/Miku.png";

// Configuración
const SHUFFLE_DURATION_BASE = 2500; // Duración base del barajado
const SHUFFLE_SPEED_BASE = 1200; // Velocidad base (ms entre movimientos) - MUY LENTO
// Por cada acierto: duración +1500ms y velocidad -500ms (MUCHO más rápido)
const WINS_REQUIRED = 3; // Aciertos necesarios para pasar

// Diálogos de Miku
const MIKU_INTRO = [
  "Miku: ¡Otro desafío! Cirno ha escondido su baguette bajo uno de los vasos.",
  "Regla 1: Observa dónde está el pan antes de que empiece el barajado.",
  "Regla 2: Necesitas acertar 3 veces para pasar. Cada ronda es más rápida.",
  "Miku: ¡Confía en tu intuición y sigue el vaso correcto!",
];

export default function Level2() {
  const { nextLevel, takeDamage } = useGame();

  // Estado del juego local
  const [cups, setCups] = useState([0, 1, 2]); // Posiciones de los vasos
  const [winningCup, setWinningCup] = useState(1); // El pan empieza en medio (índice 1)
  const [gameState, setGameState] = useState("rules"); // rules, intro, shuffling, picking, revealed
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

  // Estados del chat de Miku
  const [introStep, setIntroStep] = useState(0);
  const [message, setMessage] = useState("Observa el vaso con el pan...");

  // Estados de modales
  const [showStartModal, setShowStartModal] = useState(true);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);

  // Calcular dificultad basada en aciertos - MUY AGRESIVO
  // Ronda 1: 1200ms (muy lento), 2.5s
  // Ronda 2: 600ms (medio), 4s
  // Ronda 3: 200ms (MUY rápido), 5.5s
  const getShuffleSpeed = () => Math.max(200, SHUFFLE_SPEED_BASE - wins * 500);
  const getShuffleDuration = () => SHUFFLE_DURATION_BASE + wins * 1500;

  // 1. Iniciar el juego
  const startGame = () => {
    setGameState("shuffling");
    setMessage("¡Barajando! Sigue el vaso...");
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
        setMessage("¿Dónde está el pan? ¡Elige un vaso!");
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
        setMessage("¡NIVEL COMPLETADO! Bien hecho~");
        setShowWinModal(true);
      } else {
        // Acierto pero necesita más. Nueva ronda
        setMessage(`¡Correcto! ${newWins}/${WINS_REQUIRED} - ¡Otra vez!`);
        setTimeout(() => {
          setGameState("intro");
          setSelectedCup(null);
          setCups([0, 1, 2]);
          setMessage("Observa el vaso con el pan...");
          // Colocar el pan en una posición aleatoria
          setWinningCup(Math.floor(Math.random() * 3));
        }, 1500);
      }
    } else {
      // Perdió. Restar vida y reiniciar este nivel
      setMessage("¡Fallaste! -1 vida. Inténtalo de nuevo.");
      setShowDamageModal(true);
      takeDamage();
      setTimeout(() => {
        setGameState("intro"); // Reiniciar ronda
        setSelectedCup(null);
        setMessage("Observa el vaso con el pan...");
        setCups([0, 1, 2]); // Resetear posiciones
      }, 1500);
    }
  };

  // 3. Manejar diálogo de intro
  const handleNextDialogue = () => {
    if (introStep < MIKU_INTRO.length - 1) {
      setIntroStep((prev) => prev + 1);
    } else {
      setGameState("intro");
    }
  };

  const showRules = gameState === "rules";

  return (
    <div className="flex flex-row items-start justify-center w-full gap-4 px-4">
      {/* MODALES */}
      <GameModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        type="start"
        title="NIVEL 2"
        subtitle="El Juego del Vaso - Encuentra dónde está la baguette de Cirno"
        buttonText="¡EMPEZAR!"
      />
      <GameModal
        isOpen={showWinModal}
        onClose={() => {
          setShowWinModal(false);
          nextLevel();
        }}
        type="win"
        title="¡NIVEL COMPLETADO!"
        subtitle="Has encontrado la baguette 3 veces"
        buttonText="SIGUIENTE NIVEL"
      />
      <GameModal
        isOpen={showDamageModal}
        onClose={() => setShowDamageModal(false)}
        type="damage"
        title="-1 VIDA"
        subtitle="¡Ese no era el vaso correcto!"
        buttonText="CONTINUAR"
        autoClose={2000}
      />

      {/* --- ÁREA DE JUEGO (IZQUIERDA) --- */}
      <div className="flex flex-col items-center flex-1 max-w-[550px]">
        {/* Indicador de progreso */}
        <div className="mb-2 text-lg font-mono text-gray-300">
          Aciertos: {wins}/{WINS_REQUIRED}
        </div>

        <h2 className="text-xl mb-4 text-teto-red font-bold font-mono">
          {showRules
            ? "NIVEL 2"
            : gameState === "intro"
              ? "¿DÓNDE ESTÁ LA BAGUETTE?"
              : gameState === "shuffling"
                ? "BARAJANDO..."
                : gameState === "picking"
                  ? "ELIGE UN VASO"
                  : selectedCup === winningCup
                    ? wins >= WINS_REQUIRED
                      ? "¡NIVEL COMPLETADO!"
                      : "¡CORRECTO! OTRA VEZ..."
                    : "¡FALLASTE!"}
        </h2>

        {/* Contenedor principal del juego */}
        <div className="relative flex flex-col items-center border-4 border-white bg-black p-6 min-h-[400px] w-full">
          {/* Cubierta de reglas */}
          {showRules && (
            <div className="absolute inset-0 bg-black/90 z-10 flex flex-col items-center justify-center gap-4">
              <div className="text-teto-red font-mono text-xl animate-pulse">
                PAUSA - LEYENDO REGLAS
              </div>
            </div>
          )}

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

                    {/* EL VASO */}
                    <img
                      src={glassImg}
                      alt="Vaso"
                      draggable={false}
                      className={`
                        w-20 h-24 object-contain z-10
                        transition-transform duration-500 ease-in-out
                        ${showBread ? "-translate-y-12" : "translate-y-0"}
                      `}
                    />

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

          {/* Botón de Inicio dentro del área de juego */}
          {gameState === "intro" && (
            <button
              onClick={startGame}
              className="mt-8 px-6 py-2 border-2 border-white hover:bg-white hover:text-black font-mono animate-pulse"
            >
              [ COMENZAR ]
            </button>
          )}
        </div>
      </div>

      {/* --- LIVE CHAT MIKU (DERECHA) --- */}
      <div className="w-64 flex flex-col border-4 border-white bg-black h-[500px]">
        {/* Header del chat */}
        <div className="border-b-2 border-white p-2 flex items-center gap-2 bg-gray-900">
          <div className="w-10 h-10 border-2 border-teto-red overflow-hidden flex-shrink-0">
            <img
              src={mikuImg}
              alt="Miku"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-teto-red font-mono text-sm font-bold">
              MIKU
            </span>
            <span className="text-green-400 font-mono text-xs">● EN LÍNEA</span>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
          {showRules ? (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-2">
              <p className="font-mono text-white text-xs leading-relaxed">
                {MIKU_INTRO[introStep]}
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-2">
              <p className="font-mono text-white text-xs leading-relaxed">
                * {message}
              </p>
            </div>
          )}
        </div>

        {/* Input/Botón área */}
        <div className="border-t-2 border-white p-2 bg-gray-900">
          {showRules ? (
            <button
              onClick={handleNextDialogue}
              className="w-full py-2 text-teto-red font-mono text-sm hover:bg-teto-red hover:text-black transition-colors border-2 border-teto-red"
            >
              {introStep < MIKU_INTRO.length - 1 ? "SIGUIENTE →" : "¡JUGAR!"}
            </button>
          ) : (
            <div className="text-gray-500 font-mono text-xs text-center py-2">
              {gameState === "shuffling"
                ? "⚡ Barajando..."
                : "Sistema activo..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
