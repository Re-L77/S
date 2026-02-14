import { useState } from "react";
import { useGame } from "../../context/GameContext";
import GameModal from "../ui/GameModal";
import TypewriterText from "../ui/TypewriterText";
import cirnoFumo from "../../assets/level2/cirno.png";
import glassImg from "../../assets/level2/glass.png";
import mikuImg from "../../assets/Miku.png";

// Configuración
const SHUFFLE_DURATION_BASE = 2000; // Duración base del barajado
const SHUFFLE_SPEED_BASE = 1000; // Velocidad base (ms entre movimientos)
const WINS_REQUIRED = 5; // Aciertos necesarios para pasar

// Configuración de vasos por ronda (progresivo y exagerado)
const getCupCount = (currentWins) => {
  const cupProgression = [3, 4, 5, 6, 12]; // ¡¡12 VASOS EN LA FINAL!!
  return cupProgression[Math.min(currentWins, cupProgression.length - 1)];
};

// Mensajes graciosos por ronda
const ROUND_MESSAGES = [
  "Ronda 1: ¡Fácil! Solo 3 vasos~",
  "Ronda 2: Un poco más... ¡4 vasos!",
  "Ronda 3: ¿5 vasos? Puedes hacerlo.",
  "Ronda 4: 6 vasos... Esto se pone serio.",
  "RONDA FINAL: ¡¡¡12 VASOS!!! ¿¿ESTÁS LISTO??",
];

// Mensajes de Cirno en el chat (como si hackeara el chat)
const CIRNO_MESSAGES = [
  "Cirno: ¿¿Cómo supiste??",
  "Cirno: Imposible... ¡SOY LA MÁS FUERTE! te la pondré tan dura que no darán ganas de sentarte~",
  "Cirno: A poco si muy oni-chan?  ",
  "Cirno: *se enoja* ¡¡Deja de adivinar BAKAAAA!! :'''v, usaré todo mi poder para derrotarte.",
  "Cirno: *Momento zad* perdoname teto, no pude protegerte...",
];

// Diálogos de Miku
const MIKU_INTRO = [
  "Miku: ¡Otro desafío! Cirno ha escondido su baguette bajo uno de los vasos.",
  "Regla 1: Observa dónde está el pan antes de que empiece el barajado.",
  "Regla 2: Necesitas acertar 5 VECES para pasar. ¡Cada ronda añade más vasos!",
  "Miku: La última ronda es... especial. ¡Confía en tu intuición!",
];

export default function Level2() {
  const { nextLevel, takeDamage } = useGame();

  // Estado del juego local
  const [cups, setCups] = useState([0, 1, 2]); // Posiciones de los vasos
  const [numCups, setNumCups] = useState(3); // Número actual de vasos
  const [winningCup, setWinningCup] = useState(1); // El pan empieza en medio (índice 1)
  const [gameState, setGameState] = useState("rules"); // rules, intro, shuffling, picking, revealed
  const [selectedCup, setSelectedCup] = useState(null);
  const [wins, setWins] = useState(0); // Contador de aciertos
  const [bouncingCup, setBouncingCup] = useState(null); // Vaso que está "saltando"
  const [isFinalRound, setIsFinalRound] = useState(false); // ¡METTATON MODE!
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
  const [message, _setMessage] = useState("Observa el vaso con el pan...");
  const [chatHistory, setChatHistory] = useState([]); // Historial de mensajes
  const [currentTypingId, setCurrentTypingId] = useState(0); // Para forzar re-render del typewriter

  // Helper para cambiar mensaje y reiniciar typewriter
  const updateMessage = (newMsg) => {
    _setMessage(newMsg);
    setCurrentTypingId(prev => prev + 1);
  };

  // Estados de modales
  const [showStartModal, setShowStartModal] = useState(true);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);

  // Calcular dificultad basada en aciertos - PROGRESIVO Y AGRESIVO
  // Ronda 1: 1000ms, 2s | Ronda 5: 150ms, 4s (CAOS)
  const getShuffleSpeed = () => {
    if (wins >= 4) return 100; // FINAL: ¡ULTRA RÁPIDO!
    return Math.max(200, SHUFFLE_SPEED_BASE - wins * 200);
  };
  const getShuffleDuration = () => {
    if (wins >= 4) return 5000; // FINAL: Más tiempo de caos
    return SHUFFLE_DURATION_BASE + wins * 500;
  };

  // 1. Iniciar el juego
  const startGame = () => {
    setGameState("shuffling");
    updateMessage("¡Barajando! Sigue el vaso...");
    const startTime = Date.now();
    const duration = getShuffleDuration();
    const speed = getShuffleSpeed();
    const currentNumCups = numCups;

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
        updateMessage(
          isFinalRound
            ? "¡¿DÓNDE ESTÁ?! ¡ELIGE RÁPIDO!"
            : "¿Dónde está el pan? ¡Elige un vaso!",
        );
        return;
      }

      // Reordenar el array de vasos aleatoriamente
      setCups((prev) => [...prev].sort(() => Math.random() - 0.5));

      // Hacer que un vaso aleatorio "salte" para efecto dinámico
      setBouncingCup(Math.floor(Math.random() * currentNumCups));
      setTimeout(() => setBouncingCup(null), Math.min(200, speed / 2));

      // CARICATURA TOTAL - squash & stretch + movimientos locos
      const isSquash = Math.random() > 0.5;
      const intensity = isFinalRound ? 2 : 1; // Más loco en la ronda final
      setFumoTransform({
        x: (Math.random() - 0.5) * 200 * intensity,
        y: (Math.random() - 0.5) * 80 * intensity,
        rotate: (Math.random() - 0.5) * 60 * intensity,
        scaleX: isSquash
          ? 1.3 + (intensity - 1) * 0.3
          : 0.7 - (intensity - 1) * 0.2,
        scaleY: isSquash
          ? 0.7 - (intensity - 1) * 0.2
          : 1.3 + (intensity - 1) * 0.3,
        skew: (Math.random() - 0.5) * 20 * intensity,
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

      // Cirno manda mensaje al chat (como hackeando)
      const cirnoMsg =
        CIRNO_MESSAGES[Math.min(newWins - 1, CIRNO_MESSAGES.length - 1)];
      setChatHistory((prev) => [...prev, cirnoMsg]);

      if (newWins >= WINS_REQUIRED) {
        // ¡Ganó el nivel! Esperar y pasar
        updateMessage("¡¡¡NIVEL COMPLETADO!!! ¡INCREÍBLE!");
        setShowWinModal(true);
      } else {
        // Acierto pero necesita más. Nueva ronda con más vasos
        const nextCupCount = getCupCount(newWins);
        const isNextFinal = newWins === WINS_REQUIRED - 1;

        updateMessage(
          ROUND_MESSAGES[newWins] || `¡Correcto! ${newWins}/${WINS_REQUIRED}`,
        );

        setTimeout(() => {
          // Preparar siguiente ronda
          const newCupsArray = Array.from(
            { length: nextCupCount },
            (_, i) => i,
          );
          setCups(newCupsArray);
          setNumCups(nextCupCount);
          setIsFinalRound(isNextFinal);
          setGameState("intro");
          setSelectedCup(null);
          // Colocar el pan en una posición aleatoria
          setWinningCup(Math.floor(Math.random() * nextCupCount));
        }, 1500);
      }
    } else {
      // Perdió. Restar vida y reiniciar ESTA ronda (no resetear vasos)
      updateMessage(
        isFinalRound
          ? "¡¡NOOOO!! ¡Tan cerca! -1 vida"
          : "¡Fallaste! -1 vida. Inténtalo de nuevo.",
      );
      setShowDamageModal(true);
      takeDamage();
      setTimeout(() => {
        setGameState("intro"); // Reiniciar ronda
        setSelectedCup(null);
        updateMessage(
          isFinalRound
            ? "¡¡Otra oportunidad!! Observa bien..."
            : "Observa el vaso con el pan...",
        );
        // Mantener el mismo número de vasos pero reordenar
        const currentCupsArray = Array.from({ length: numCups }, (_, i) => i);
        setCups(currentCupsArray);
        setWinningCup(Math.floor(Math.random() * numCups));
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
        subtitle="El Juego del Vaso - ¡5 rondas! Cada vez más vasos y más rápido..."
        buttonText="¡EMPEZAR!"
      />
      <GameModal
        isOpen={showWinModal}
        onClose={() => {
          setShowWinModal(false);
          nextLevel();
        }}
        type="win"
        title="¡¡INCREÍBLE!!"
        subtitle="¡¡Sobreviviste a los 12 VASOS!! Eres un genio."
        buttonText="SIGUIENTE NIVEL"
      />
      <GameModal
        isOpen={showDamageModal}
        onClose={() => setShowDamageModal(false)}
        type="damage"
        title="-1 VIDA"
        subtitle={
          isFinalRound
            ? "¡¡NOOO!! ¡Entre 12 vasos y elegiste ese!"
            : "¡Ese no era el vaso correcto!"
        }
        buttonText="CONTINUAR"
        autoClose={2000}
      />

      {/* --- ÁREA DE JUEGO (IZQUIERDA) --- */}
      <div className="flex flex-col items-center flex-1 max-w-[600px]">
        {/* Indicador de progreso */}
        <div
          className={`mb-2 text-lg font-mono ${isFinalRound ? "text-yellow-400 animate-pulse text-xl" : "text-gray-300"}`}
        >
          {isFinalRound
            ? "🔥 RONDA FINAL 🔥"
            : `Ronda ${wins + 1}/${WINS_REQUIRED}`}{" "}
          | Vasos: {numCups}
        </div>

        <h2
          className={`text-xl mb-4 font-bold font-mono ${isFinalRound ? "text-yellow-400 text-2xl animate-bounce" : "text-teto-red"}`}
        >
          {showRules
            ? "NIVEL 2"
            : gameState === "intro"
              ? isFinalRound
                ? "¿Esto será suficiente para ti?"
                : "¿DÓNDE ESTÁ LA BAGUETTE?"
              : gameState === "shuffling"
                ? isFinalRound
                  ? "¡¡Sus demonios se vinieron dentro de ella!!"
                  : "BARAJANDO..."
                : gameState === "picking"
                  ? isFinalRound
                    ? "¡¡ELIGE RÁPIDO!!"
                    : "ELIGE UN VASO"
                  : selectedCup === winningCup
                    ? wins >= WINS_REQUIRED
                      ? "¡¡¡ÉPICO!!!"
                      : "¡CORRECTO! OTRA VEZ..."
                    : isFinalRound
                      ? "¡¡NOOOOO!!"
                      : "¡FALLASTE!"}
        </h2>

        {/* Contenedor principal del juego */}
        <div
          className={`relative flex flex-col items-center border-4 ${isFinalRound ? "border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.5)]" : "border-white"} bg-black p-6 min-h-[400px] w-full`}
        >
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
          <div className="flex justify-center w-full overflow-visible">
            <div
              className="relative h-40 flex items-end"
              style={{
                width: `${numCups * (numCups > 6 ? 45 : 80)}px`,
              }}
            >
              {Array.from({ length: numCups }, (_, i) => i).map((cupId) => {
                // Encontrar la posición actual del vaso en el array
                const position = cups.indexOf(cupId);
                // Lógica visual: ¿Deberíamos mostrar el pan?
                const showBread =
                  (gameState === "intro" || gameState === "revealed") &&
                  cupId === winningCup;
                const isSelected = selectedCup === cupId;
                const isBouncing = bouncingCup === cupId;

                // Tamaño de vasos dinámico
                const cupSize = numCups > 6 ? "w-10 h-12" : "w-20 h-24";
                const breadSize = numCups > 6 ? "text-xl" : "text-4xl";

                // Calcular posición X absoluta basada en el orden en el array
                const spacing = numCups > 6 ? 45 : 80; // px entre vasos
                const leftPosition = position * spacing;

                return (
                  <div
                    key={cupId}
                    onClick={() => handleCupClick(cupId)}
                    style={{
                      position: "absolute",
                      left: `${leftPosition}px`,
                      bottom: 0,
                      transform: `translateY(${isBouncing ? -20 : 0}px)`,
                    }}
                    className={`
                      ${cupSize} flex flex-col items-center justify-end cursor-pointer
                      transition-all duration-300 ease-in-out
                      ${gameState === "picking" ? "hover:-translate-y-4 hover:scale-110" : ""}
                    `}
                  >
                    {/* EL PAN (Sprite) */}
                    <div
                      className={`
                        absolute bottom-1 ${breadSize} transition-opacity duration-300
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
                        ${cupSize} object-contain z-10
                        transition-transform duration-300 ease-in-out
                        ${showBread ? "-translate-y-8" : "translate-y-0"}
                      `}
                    />

                    {/* Indicador de selección */}
                    {isSelected && (
                      <div className="absolute -bottom-6 text-white font-bold animate-bounce text-sm">
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
                <TypewriterText 
                  key={`intro-${introStep}`}
                  text={MIKU_INTRO[introStep]} 
                  voice="miku" 
                  speed={25}
                />
              </p>
            </div>
          ) : (
            <>
              {/* Mensaje actual del sistema */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-2">
                <p className="font-mono text-white text-xs leading-relaxed">
                  <TypewriterText 
                    key={`msg-${currentTypingId}`}
                    text={`* ${message}`} 
                    voice="system" 
                    speed={20}
                  />
                </p>
              </div>

              {/* Historial de mensajes de Cirno (como si hackeara el chat) */}
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className="bg-cyan-900/50 border border-cyan-400 rounded-lg p-2"
                >
                  <p className="font-mono text-cyan-300 text-xs leading-relaxed">
                    <TypewriterText 
                      key={`cirno-${index}`}
                      text={msg} 
                      voice="cirno" 
                      speed={35}
                    />
                  </p>
                </div>
              ))}
            </>
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
