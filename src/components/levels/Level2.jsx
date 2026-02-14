import { useState, useRef, useEffect } from "react";
import { useGame } from "../../context/GameContext";
import { useAudio } from "../../context/AudioContext";
import GameModal from "../ui/GameModal";
import TypewriterText from "../ui/TypewriterText";
import LevelLoader from "../ui/LevelLoader";
import cirnoFumo from "../../assets/level2/cirno.png";
import glassImg from "../../assets/level2/glass.png";
import mikuImg from "../../assets/Miku.png";
import level2Bgm from "../../assets/sound/levels/level2.mp3";

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

// Diálogos de presentación de Cirno
const CIRNO_INTRO = [
  "Cirno: ¡¡ATENCIÓN!! ¡Soy Cirno, la GUARDIANA de este sector! ⑨",
  "Cirno: ¡El hada más fuerte de Gensokyo protege los datos de Teto!",
  "Cirno: ¿Crees que puedes encontrar MI baguette? ¡JA! ¡Ingenuo!",
  "Cirno: Soy tan inteligente que escondí el pan donde NADIE lo encontrará~",
  "Cirno: ¡Prepárate para perder, BAKA! ¡Aquí vamos!",
];

// Insultos de Cirno cuando el jugador falla
const CIRNO_INSULTS = [
  "Cirno: ¡¡BAKA BAKA BAKA!! ¿En serio elegiste ese? JAJAJA",
  "Cirno: ¡Qué torpe! Ni un niño de 5 años fallaría así~",
  "Cirno: *se ríe* ¡¡Eres peor de lo que pensaba!!",
  "Cirno: ¿Tus ojos funcionan? Porque parece que NO ⑨",
  "Cirno: ¡JAJAJA! ¡Soy demasiado lista para ti!",
  "Cirno: ¿Eso es todo lo que tienes? Patéticooo~",
  "Cirno: ¡¡Imposible que ganes contra LA MÁS FUERTE!!",
  "Cirno: *baila* ¡Otro fallo más para mi colección!",
];

export default function Level2() {
  const { nextLevel, takeDamage, completeLevel } = useGame();
  const { playSfx } = useAudio();
  const bgmRef = useRef(null);

  // Inicializar audio de fondo
  useEffect(() => {
    bgmRef.current = new Audio(level2Bgm);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.4;

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  // Estado del juego local
  const [cups, setCups] = useState([0, 1, 2]); // Posiciones de los vasos
  const [numCups, setNumCups] = useState(3); // Número actual de vasos
  const [winningCup, setWinningCup] = useState(1); // El pan empieza en medio (índice 1)
  const [gameState, setGameState] = useState("rules"); // rules, cirnoIntro, intro, shuffling, picking, revealed
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
  const [cirnoIntroStep, setCirnoIntroStep] = useState(0); // Paso de intro de Cirno
  const [gameAppearing, setGameAppearing] = useState(false); // Animación de aparición
  const [message, _setMessage] = useState("Observa el vaso con el pan...");
  const [chatHistory, setChatHistory] = useState([]); // Historial de mensajes
  const [currentTypingId, setCurrentTypingId] = useState(0); // Para forzar re-render del typewriter

  // Helper para cambiar mensaje y reiniciar typewriter
  const updateMessage = (newMsg) => {
    _setMessage(newMsg);
    setCurrentTypingId((prev) => prev + 1);
  };

  // Estados de modales
  const [showLoading, setShowLoading] = useState(true);
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

      // Reproducir sonido whoosh
      playSfx("whosh", 0.9, 1.5);

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

    playSfx("sqek");
    setSelectedCup(cupId);
    setGameState("revealed");

    if (cupId === winningCup) {
      playSfx("ding");
      const newWins = wins + 1;
      setWins(newWins);

      // Cirno manda mensaje al chat (como hackeando)
      const cirnoMsg =
        CIRNO_MESSAGES[Math.min(newWins - 1, CIRNO_MESSAGES.length - 1)];
      setChatHistory((prev) => [...prev, cirnoMsg]);

      if (newWins >= WINS_REQUIRED) {
        // ¡Ganó el nivel! Esperar y pasar
        updateMessage("¡¡¡NIVEL COMPLETADO!!! ¡INCREÍBLE!");
        if (bgmRef.current) bgmRef.current.pause();
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
      playSfx("baka");

      // Cirno insulta al jugador
      const randomInsult =
        CIRNO_INSULTS[Math.floor(Math.random() * CIRNO_INSULTS.length)];
      setChatHistory((prev) => [...prev, randomInsult]);

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

  // 3. Manejar diálogo de intro (Miku)
  const handleNextDialogue = () => {
    playSfx("select");
    if (introStep < MIKU_INTRO.length - 1) {
      setIntroStep((prev) => prev + 1);
    } else {
      playSfx("weaponPull");
      setGameState("cirnoIntro"); // Ir a intro de Cirno
    }
  };

  // 4. Manejar diálogo de Cirno
  const handleCirnoDialogue = () => {
    playSfx("select");
    if (cirnoIntroStep < CIRNO_INTRO.length - 1) {
      setCirnoIntroStep((prev) => prev + 1);
    } else {
      playSfx("weaponPull");
      setGameAppearing(true); // Activar animación
      // Iniciar música de fondo
      if (bgmRef.current) {
        bgmRef.current.play().catch(() => {});
      }
      setTimeout(() => {
        setGameState("intro"); // Ir al juego
      }, 100); // Pequeño delay para que la animación inicie
    }
  };

  const showRules = gameState === "rules";
  const showCirnoIntro = gameState === "cirnoIntro";

  return (
    <div className="flex flex-row items-start justify-center w-full gap-4 px-4">
      {/* PANTALLA DE CARGA */}
      {showLoading && (
        <LevelLoader levelNumber={2} onComplete={() => setShowLoading(false)} />
      )}

      {/* MODALES */}
      <GameModal
        isOpen={showWinModal}
        onClose={() => {
          setShowWinModal(false);
          completeLevel(2); // Desbloquear pieza 2 del sobre
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

      {/* --- PANTALLA DE INTRO (MIKU OCUPA TODO) --- */}
      {showRules ? (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold font-mono text-teto-red mb-8 animate-pulse">
            NIVEL 2
          </h1>

          <div className="w-full border-4 border-white bg-black p-6">
            {/* Header con Miku */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-white">
              <div className="w-16 h-16 border-2 border-teto-red overflow-hidden">
                <img
                  src={mikuImg}
                  alt="Miku"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-teto-red font-mono text-xl font-bold">
                  MIKU
                </span>
                <div className="text-green-400 font-mono text-sm">
                  ● EN LÍNEA
                </div>
              </div>
            </div>

            {/* Mensaje */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6 min-h-[100px]">
              <p className="font-mono text-white text-lg leading-relaxed">
                <TypewriterText
                  key={`intro-${introStep}`}
                  text={MIKU_INTRO[introStep]}
                  voice="miku"
                  speed={25}
                />
              </p>
            </div>

            {/* Botón */}
            <button
              onClick={handleNextDialogue}
              className="w-full py-3 text-teto-red font-mono text-lg hover:bg-teto-red hover:text-black transition-colors border-2 border-teto-red"
            >
              {introStep < MIKU_INTRO.length - 1 ? "SIGUIENTE →" : "¡JUGAR!"}
            </button>
          </div>
        </div>
      ) : showCirnoIntro ? (
        /* --- PANTALLA DE INTRO DE CIRNO (BOSS) --- */
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
          {/* Imagen de Cirno grande con efecto dramático */}
          <div className="mb-6 animate-bounce">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400/30 blur-xl rounded-full animate-pulse"></div>
              <img
                src={cirnoFumo}
                alt="Cirno"
                className="relative w-48 h-48 object-contain drop-shadow-[0_0_25px_rgba(34,211,238,0.7)]"
                draggable={false}
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold font-mono text-cyan-400 mb-4 animate-pulse">
            ⑨ GUARDIANA DE DATOS ⑨
          </h1>

          <div className="w-full border-4 border-cyan-400 bg-black p-6">
            {/* Header con Cirno */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-cyan-400">
              <div className="w-16 h-16 border-2 border-cyan-400 overflow-hidden rounded-full bg-cyan-900/50">
                <img
                  src={cirnoFumo}
                  alt="Cirno"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-cyan-400 font-mono text-xl font-bold">
                  CIRNO
                </span>
                <div className="text-cyan-300 font-mono text-sm">
                  ⑨ GUARDIANA DEL NIVEL 2
                </div>
              </div>
            </div>

            {/* Mensaje */}
            <div className="bg-cyan-900/30 border border-cyan-400 rounded-lg p-4 mb-6 min-h-25">
              <p className="font-mono text-cyan-100 text-lg leading-relaxed">
                <TypewriterText
                  key={`cirno-intro-${cirnoIntroStep}`}
                  text={CIRNO_INTRO[cirnoIntroStep]}
                  voice="cirno"
                  speed={30}
                />
              </p>
            </div>

            {/* Botón */}
            <button
              onClick={handleCirnoDialogue}
              className="w-full py-3 text-cyan-400 font-mono text-lg hover:bg-cyan-400 hover:text-black transition-colors border-2 border-cyan-400"
            >
              {cirnoIntroStep < CIRNO_INTRO.length - 1
                ? "SIGUIENTE →"
                : "¡EMPEZAR!"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto gap-4">
          {/* --- ÁREA DE JUEGO --- */}
          <div
            className={`flex flex-col items-center w-full ${gameAppearing ? "animate-magnet-left" : ""}`}
          >
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
              className={`relative flex flex-col items-center border-4 ${isFinalRound ? "border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.5)]" : "border-white"} bg-black p-6 min-h-100 w-full`}
            >
              {/* PERSONAJE - Coloca tu asset de fumo aquí */}
              <div
                className={`
              relative mb-4 transition-transform duration-100 ease-out
              ${gameState === "picking" ? "animate-float" : ""}
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
                  className={`w-50 h-50 object-contain drop-shadow-lg ${gameState === "picking" ? "drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" : ""}`}
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

          {/* --- CAJA DE DIÁLOGO ESTILO UNDERTALE (ABAJO) --- */}
          <div
            className={`w-full border-4 border-white bg-black ${gameAppearing ? "animate-magnet-right" : ""}`}
          >
            {/* Área de mensajes - Estilo Undertale */}
            <div className="p-6 min-h-32">
              {/* Mostrar Cirno si hay mensajes, sino el sistema */}
              {chatHistory.length > 0 ? (
                <p className="font-mono text-cyan-300 text-lg leading-relaxed">
                  <TypewriterText
                    key={`cirno-${chatHistory.length}`}
                    text={chatHistory[chatHistory.length - 1]}
                    voice="cirno"
                    speed={25}
                  />
                </p>
              ) : (
                <p className="font-mono text-white text-lg leading-relaxed">
                  <TypewriterText
                    key={`msg-${currentTypingId}`}
                    text={`* ${message}`}
                    voice="system"
                    speed={20}
                  />
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
