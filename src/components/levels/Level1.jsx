import { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { useAudio } from "../../context/AudioContext";
import GameModal from "../ui/GameModal";
import LevelLoader from "../ui/LevelLoader";
import TypewriterText from "../ui/TypewriterText";
// IMPORTANTE: Importamos la imagen desde tu carpeta assets para que Vite la encuentre
import mikuImg from "../../assets/Miku.png";
import mizukiImg from "../../assets/level1/mizuki.png";
// TUS IMÁGENES REALES (Según tu captura)
import reimuImg from "../../assets/level1/reimu.png";
import marisaImg from "../../assets/level1/marisa.png";
import sakuyaImg from "../../assets/level1/sakuya.png"; // <--- CAMBIO: Usamos Sakuya
import flandreImg from "../../assets/level1/flandre.png";
import yuyukoImg from "../../assets/level1/yuyuko.png"; // <--- CAMBIO: Usamos Yuyuko
import koishiImg from "../../assets/level1/koishi.png";
// Música de fondo (agrega el archivo level1.mp3 en assets/sound/levels/)
import level1Bgm from "../../assets/sound/levels/level1.mp3";

/* DATA CORREGIDA */
const FUMO_DATA = [
  {
    id: 1,
    src: reimuImg,
    name: "Reimu Hakurei",
    funnyQuote: "Donación aceptada.",
  },
  {
    id: 2,
    src: marisaImg,
    name: "Marisa Kirisame",
    funnyQuote: "¡Solo lo tomé prestado!",
  },
  {
    id: 3,
    src: sakuyaImg, // <--- Sakuya en lugar de Remilia
    name: "Sakuya Izayoi",
    funnyQuote: "Limpieza completa.",
  },
  {
    id: 4,
    src: flandreImg,
    name: "Flandre Scarlet",
    funnyQuote: "¡Se rompió!",
  },
  {
    id: 5,
    src: yuyukoImg, // <--- Yuyuko en lugar de Satori
    name: "Yuyuko Saigyouji",
    funnyQuote: "¿Eso se come?",
  },
  {
    id: 6,
    src: koishiImg,
    name: "Koishi Komeiji",
    funnyQuote: "¿Mi par? ¿Dónde?",
  },
];
const TIME_LIMIT = 40;

// DIÁLOGO: REGLAS DIRECTAS
const MIKU_RULES = [
  "Miku: ¡Atención! Para romper esta barrera, necesitamos velocidad.",
  "Regla 1: Encuentra todos los pares de Fumos idénticos.",
  "Regla 2: Tienes 50 segundos exactos. Si el contador llega a cero, pierdes una vida.",
  "Regla 3: El sistema es inestable. Las cartas se moverán si te tardas mucho.",
  "Miku: Eso es todo. ¡Demuestra tu memoria y desbloquea el nivel!",
];

// DIÁLOGO: INTRO DE MIZUKI (Boss del nivel 1)
const MIZUKI_INTRO = [
  "¿Hmm? ¿Otro intruso intentando hackear los archivos de Teto?",
  "Soy Mizuki, la guardiana de este sector de memoria.",
  "He ocultado los datos en pares de Fumos. Vamos a ver si puedes encontrarlos todos...",
  "¡No te confíes! Los Fumos se mueven cuando el tiempo corre.",
  "Adelante... si te atreves a desafiar mi memoria perfecta.",
];

// BURLAS DE MIZUKI (cuando el jugador falla)
const MIZUKI_INSULTS = [
  "Mizuki: ¿En serio? Esos no se parecen en nada~ ♪",
  "Mizuki: *suspira* Esperaba más de ti, hacker.",
  "Mizuki: ¿Tus ojos funcionan? Porque esos Fumos son DIFERENTES.",
  "Mizuki: Jajaja~ Teto estará a salvo si sigues así.",
  "Mizuki: ¿Quieres que te dé una pista? ...No.",
  "Mizuki: Esto es demasiado fácil para mí~",
  "Mizuki: *bosteza* Me estás aburriendo.",
];

export default function Level1() {
  const { nextLevel, takeDamage, completeLevel } = useGame();
  const { playSfx } = useAudio();
  const bgmRef = useRef(null);

  // Inicializar audio de fondo
  useEffect(() => {
    bgmRef.current = new Audio(level1Bgm);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.3;

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  // --- ESTADOS ---
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  // Estados visuales
  const [shaking, setShaking] = useState([]);
  const [popping, setPopping] = useState([]);

  // Intro (Miku rules)
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(0);
  const [message, setMessage] = useState("Esperando inicio...");

  // Intro de Mizuki (Boss)
  const [showMizukiIntro, setShowMizukiIntro] = useState(false);
  const [mizukiIntroStep, setMizukiIntroStep] = useState(0);

  // Burlas de Mizuki
  const [mizukiTaunt, setMizukiTaunt] = useState(null);

  // Estados de modales
  const [showLoading, setShowLoading] = useState(true);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);

  // 1. Inicialización
  useEffect(() => {
    const shuffled = [...FUMO_DATA, ...FUMO_DATA]
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, uniqueId: index }));
    setCards(shuffled);
  }, []);

  // 2. Timer
  useEffect(() => {
    if (showIntro || showMizukiIntro) return;
    if (solved.length === FUMO_DATA.length) return;

    if (timeLeft <= 0) {
      playSfx("baka");
      takeDamage();
      setMessage("¡TIEMPO FUERA! -1 VIDA");
      setShowDamageModal(true);
      setTimeLeft(15);
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, solved, takeDamage, showIntro, showMizukiIntro, playSfx]);

  // 3. Lógica
  useEffect(() => {
    if (flipped.length === 2) {
      setDisabled(true);
      const [first, second] = flipped;

      if (cards[first].id === cards[second].id) {
        playSfx("ding");
        setMessage(`¡Correcto! ${cards[first].name} asegurado.`);
        setPopping([first, second]);
        setTimeout(() => {
          setSolved((prev) => [...prev, cards[first].id]);
          setFlipped([]);
          setPopping([]);
          setDisabled(false);
        }, 600);
      } else {
        // Mizuki se burla del jugador
        const randomInsult =
          MIZUKI_INSULTS[Math.floor(Math.random() * MIZUKI_INSULTS.length)];
        setMizukiTaunt(randomInsult);
        setMessage("¡Incorrecto!");
        setShaking([first, second]);
        setTimeout(() => {
          setFlipped([]);
          setShaking([]);
          setDisabled(false);
          // Ocultar burla después de un rato
          setTimeout(() => setMizukiTaunt(null), 2000);
        }, 800);
      }
    }
  }, [flipped, cards]);

  // 4. Ganar
  useEffect(() => {
    if (FUMO_DATA.length > 0 && solved.length === FUMO_DATA.length) {
      setMessage("¡NIVEL COMPLETADO!");
      setShowWinModal(true);
    }
  }, [solved]);

  // --- HANDLERS ---
  const handleClick = (index) => {
    if (
      showIntro ||
      showMizukiIntro ||
      disabled ||
      solved.includes(cards[index].id) ||
      flipped.includes(index)
    )
      return;
    playSfx("sqek", 0.9);
    setFlipped((prev) => [...prev, index]);
  };

  const handleNextDialogue = () => {
    playSfx("select");
    if (introStep < MIKU_RULES.length - 1) {
      setIntroStep((prev) => prev + 1);
    } else {
      // Después de las reglas de Miku, mostrar intro de Mizuki
      setShowIntro(false);
      setShowMizukiIntro(true);
    }
  };

  const handleNextMizukiDialogue = () => {
    playSfx("select");
    if (mizukiIntroStep < MIZUKI_INTRO.length - 1) {
      setMizukiIntroStep((prev) => prev + 1);
    } else {
      startGame();
    }
  };

  const startGame = () => {
    playSfx("weaponPull");
    setShowIntro(false);
    setShowMizukiIntro(false);
    setMessage("¡Comienza!");
    // Iniciar música de fondo
    if (bgmRef.current) {
      bgmRef.current.currentTime = 0;
      bgmRef.current.play().catch(() => {});
    }
  };

  // Detener música cuando se gana, reanudar después de daño
  useEffect(() => {
    if (showWinModal) {
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    }
  }, [showWinModal]);

  // No pausar música en el modal de daño, solo atenuar temporalmente
  useEffect(() => {
    if (showDamageModal && bgmRef.current) {
      bgmRef.current.volume = 0.1; // Atenuar
    } else if (
      !showDamageModal &&
      bgmRef.current &&
      !showIntro &&
      !showMizukiIntro &&
      !showWinModal
    ) {
      bgmRef.current.volume = 0.3; // Restaurar volumen normal
    }
  }, [showDamageModal, showIntro, showMizukiIntro, showWinModal]);

  // --- GLITCH VISUALS ---
  const isWarning = timeLeft <= 25;
  const isCritical = timeLeft <= 10;
  const boardClass = isCritical
    ? "glitch-critical"
    : isWarning
      ? "glitch-warning"
      : "board-mover";
  const progress = (timeLeft / TIME_LIMIT) * 100;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* PANTALLA DE CARGA */}
      {showLoading && (
        <LevelLoader levelNumber={1} onComplete={() => setShowLoading(false)} />
      )}

      {/* MODALES */}
      <GameModal
        isOpen={showWinModal}
        onClose={() => {
          setShowWinModal(false);
          completeLevel(1); // Desbloquear pieza 1 del sobre
          nextLevel();
        }}
        type="win"
        title="¡NIVEL COMPLETADO!"
        subtitle="Has encontrado todos los pares de Fumos"
        buttonText="SIGUIENTE NIVEL"
      />
      <GameModal
        isOpen={showDamageModal}
        onClose={() => setShowDamageModal(false)}
        type="damage"
        title="-1 VIDA"
        subtitle="¡El tiempo se agotó! Sigue intentando..."
        buttonText="CONTINUAR"
        autoClose={2000}
      />

      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-15px, -25px) rotate(-1deg); }
          20% { transform: translate(20px, -10px) rotate(1.5deg); }
          30% { transform: translate(-10px, 15px) rotate(-0.5deg); }
          40% { transform: translate(25px, 20px) rotate(2deg); }
          50% { transform: translate(-20px, -15px) rotate(-1.5deg); }
          60% { transform: translate(15px, -20px) rotate(1deg); }
          70% { transform: translate(-25px, 10px) rotate(-2deg); }
          80% { transform: translate(10px, 25px) rotate(0.5deg); }
          90% { transform: translate(-15px, -10px) rotate(-1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes float-warning {
          0% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-20px, -30px) rotate(-2deg) skew(2deg); }
          20% { transform: translate(25px, -15px) rotate(2deg) skew(-1deg); }
          30% { transform: translate(-15px, 20px) rotate(-1deg) skew(1deg); }
          40% { transform: translate(30px, 25px) rotate(2.5deg) skew(-2deg); }
          50% { transform: translate(-25px, -20px) rotate(-2deg) skew(1deg); }
          60% { transform: translate(20px, -25px) rotate(1.5deg) skew(-1deg); }
          70% { transform: translate(-30px, 15px) rotate(-2.5deg) skew(2deg); }
          80% { transform: translate(15px, 30px) rotate(1deg) skew(-1deg); }
          90% { transform: translate(-20px, -15px) rotate(-1.5deg) skew(1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes float-critical {
          0% { transform: translate(0, 0) rotate(0deg) skew(0deg); filter: none; }
          8% { transform: translate(-25px, -35px) rotate(-3deg) skew(5deg); filter: hue-rotate(30deg); }
          16% { transform: translate(30px, -20px) rotate(2.5deg) skew(-8deg); filter: hue-rotate(-60deg); }
          24% { transform: translate(-20px, 25px) rotate(-2deg) skew(6deg); filter: invert(0.3); }
          32% { transform: translate(35px, 30px) rotate(3deg) skew(-5deg); filter: hue-rotate(90deg); }
          40% { transform: translate(-30px, -25px) rotate(-2.5deg) skew(8deg); filter: none; opacity: 0.85; }
          48% { transform: translate(25px, -30px) rotate(2deg) skew(-6deg); filter: hue-rotate(-90deg); }
          56% { transform: translate(-35px, 20px) rotate(-3deg) skew(5deg); filter: invert(0.2); }
          64% { transform: translate(20px, 35px) rotate(1.5deg) skew(-8deg); filter: hue-rotate(60deg); }
          72% { transform: translate(-25px, -20px) rotate(-2deg) skew(6deg); filter: none; }
          80% { transform: translate(30px, -25px) rotate(2.5deg) skew(-5deg); filter: hue-rotate(-30deg) invert(0.15); }
          88% { transform: translate(-20px, 30px) rotate(-1.5deg) skew(8deg); filter: hue-rotate(45deg); }
          96% { transform: translate(15px, -15px) rotate(1deg) skew(-6deg); filter: none; }
          100% { transform: translate(0, 0) rotate(0deg) skew(0deg); filter: none; }
        }
        @keyframes twitch {
          0% { transform: translate(1px, 1px); }
          20% { transform: translate(-3px, 0px); }
          40% { transform: translate(1px, -1px); }
          60% { transform: translate(-3px, 1px); }
          80% { transform: translate(-1px, -1px); }
          100% { transform: translate(1px, -2px); }
        }
        
        .board-mover { animation: float 8s ease-in-out infinite; }
        .glitch-warning { animation: float-warning 5s ease-in-out infinite; border-color: yellow !important; }
        .glitch-critical { animation: float-critical 3s ease-in-out infinite; border-color: red !important; box-shadow: 0 0 20px red; }
        .card-shake { animation: twitch 0.3s ease-in-out infinite; border-color: red !important; }
        .card-pop { transform: scale(1.3); border-color: #00ff00 !important; box-shadow: 0 0 15px #00ff00; z-index: 100; }
      `}</style>

      {/* --- PANTALLA DE INTRO (MIKU OCUPA TODO) --- */}
      {showIntro ? (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold font-mono text-teto-red mb-8 animate-pulse">
            NIVEL 1
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
                  text={MIKU_RULES[introStep]}
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
              {introStep < MIKU_RULES.length - 1
                ? "SIGUIENTE →"
                : "CONTINUAR →"}
            </button>
          </div>
        </div>
      ) : showMizukiIntro ? (
        /* --- PANTALLA DE INTRO MIZUKI (BOSS) --- */
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
          {/* Imagen de Mizuki grande con efecto dramático */}
          <div className="mb-6 animate-bounce">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-400/30 blur-xl rounded-full animate-pulse"></div>
              <img
                src={mizukiImg}
                alt="Mizuki"
                className="relative w-48 h-48 object-contain drop-shadow-[0_0_25px_rgba(236,72,153,0.7)]"
                draggable={false}
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold font-mono text-pink-400 mb-4 animate-pulse">
            ♥ Mizuki ♥
          </h1>

          <div className="w-full border-4 border-pink-400 bg-black p-6">
            {/* Header con Mizuki */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-pink-400">
              <div className="w-16 h-16 border-2 border-pink-400 overflow-hidden rounded-full bg-pink-900/50">
                <img
                  src={mizukiImg}
                  alt="Mizuki"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-pink-400 font-mono text-xl font-bold">
                  MIZUKI
                </span>
                <div className="text-pink-300 font-mono text-sm">
                  ♥ BOSS DEL NIVEL 1
                </div>
              </div>
            </div>

            {/* Mensaje */}
            <div className="bg-pink-900/30 border border-pink-400 rounded-lg p-4 mb-6 min-h-25">
              <p className="font-mono text-pink-100 text-lg leading-relaxed">
                <TypewriterText
                  key={`mizuki-${mizukiIntroStep}`}
                  text={MIZUKI_INTRO[mizukiIntroStep]}
                  voice="mizuki"
                  speed={30}
                />
              </p>
            </div>

            {/* Botón */}
            <button
              onClick={handleNextMizukiDialogue}
              className="w-full py-3 text-pink-400 font-mono text-lg hover:bg-pink-400 hover:text-black transition-colors border-2 border-pink-400"
            >
              {mizukiIntroStep < MIZUKI_INTRO.length - 1
                ? "SIGUIENTE →"
                : "¡ACEPTO EL DESAFÍO!"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-4">
          {/* --- ÁREA DE JUEGO --- */}
          <div className="flex flex-col items-center w-full">
            {/* HEADER */}
            <div className="flex justify-between w-full font-mono mb-2 px-2 text-sm sm:text-base">
              <span
                className={`${isCritical ? "text-red-500 animate-ping" : "text-teto-red"} font-bold`}
              >
                {isCritical ? "ERROR CRÍTICO" : "NIVEL 1"}
              </span>
              <span
                className={isCritical ? "text-red-500 font-bold text-xl" : ""}
              >
                {timeLeft}s
              </span>
            </div>

            {/* BARRA DE TIEMPO */}
            <div className="w-full h-3 border-2 border-white mb-4 bg-gray-900 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${isCritical ? "bg-red-600" : isWarning ? "bg-yellow-400" : "bg-green-400"}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* --- TABLERO --- */}
            <div className="relative w-full border-4 border-white bg-black overflow-visible flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] p-2">
              {/* JUEGO */}
              <div
                className={`${boardClass} p-2 sm:p-4 bg-gray-800 border-2 border-white rounded-lg transition-all duration-300`}
              >
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {cards.map((card, index) => {
                    const isFlipped =
                      flipped.includes(index) || solved.includes(card.id);
                    const isShaking = shaking.includes(index);

                    return (
                      <div
                        key={card.uniqueId}
                        onClick={() => handleClick(index)}
                        className={`
                      w-[72px] h-[72px] sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 cursor-pointer
                      border-2 flex items-center justify-center bg-gray-900 transition-all duration-200
                      ${isShaking ? "card-shake" : ""}
                      ${isFlipped ? "border-teto-red rotate-y-180" : "border-white hover:border-yellow-400"}
                      ${solved.includes(card.id) ? "opacity-20 grayscale border-gray-700" : ""} 
                    `}
                      >
                        <div
                          className={`w-full h-full p-1 ${isFlipped ? "block" : "hidden"}`}
                        >
                          <img
                            src={card.src}
                            alt="Fumo"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "block";
                            }}
                          />
                          <span className="text-xl hidden">🧸</span>
                        </div>
                        <div
                          className={`text-white font-bold text-lg ${isFlipped ? "hidden" : "block"}`}
                        >
                          ?
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* --- CAJA DE DIÁLOGO ESTILO UNDERTALE (Mizuki o Sistema) --- */}
          <div
            className={`w-full border-4 ${mizukiTaunt ? "border-pink-400" : "border-white"} bg-black transition-colors duration-300`}
          >
            {mizukiTaunt ? (
              <div className="p-4">
                {/* Header Integrado de Mizuki */}
                <div className="flex items-center gap-3 mb-2 pb-2 border-b border-pink-400/50">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-pink-400 overflow-hidden rounded-full bg-pink-900/50">
                    <img
                      src={mizukiImg}
                      alt="Mizuki"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-pink-400 font-mono text-base sm:text-lg font-bold">
                      MIZUKI
                    </span>
                  </div>
                </div>
                {/* Mensaje de Mizuki */}
                <p className="font-mono text-pink-100 text-base sm:text-lg leading-relaxed animate-pulse">
                  {mizukiTaunt}
                </p>
              </div>
            ) : (
              <div className="p-4 min-h-[100px] flex items-center">
                <p
                  className={`font-mono text-lg leading-relaxed ${isCritical ? "text-red-400" : "text-white"}`}
                >
                  * {message}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
