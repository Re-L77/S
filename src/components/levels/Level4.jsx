import { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { useAudio } from "../../context/AudioContext";
import TypewriterText from "../ui/TypewriterText";

// --- ASSETS ---
import tetoPrincipal from "../../assets/level4/principal.png";
import tetoConfiada from "../../assets/level4/confiada.png";
import tetoBurla from "../../assets/level4/burla.png";
import tetoDedo from "../../assets/level4/dedo_medio.png";
import tetoDesacuerdo from "../../assets/level4/desacuerdo.png";
import tetoNegar from "../../assets/level4/negar.png";
import tetoInteligente from "../../assets/level4/inteligente.png";
import tetoDolor from "../../assets/level4/dolor.png";
// Ataques
import tetoAtaque1 from "../../assets/level4/ataque1.gif";
import tetoAtaque2 from "../../assets/level4/ataque2.gif";
import tetoAtaque3 from "../../assets/level4/ataque3.gif";

import level4Bgm from "../../assets/sound/levels/level4.mp3";

export default function Level4() {
  const { nextLevel, completeLevel, lives } = useGame();
  const { playSfx, initAudio } = useAudio();
  const bgmRef = useRef(null);

  // TETO INTRO - Presentación dramática del boss final
  const TETO_INTRO = [
    "...",
    "Sabía que llegarías.",
    "Mizuki, la Guardiana de la Memoria... Cirno, la Guardiana de los Datos... Nyamu, la Guardiana del Amor...",
    "Todas intentaron detenerte. Todas fallaron.",
    "Pero yo soy diferente.",
    "Soy Kasane Teto. La GUARDIANA FINAL.",
    "Este corazón... esta carta... son MIS secretos más profundos.",
    "No dejaré que los descubras tan fácilmente.",
    "¡PREPÁRATE PARA ENFRENTARME!",
  ];

  // --- ESTADOS DE JUEGO ---
  const [gameState, setGameState] = useState("fadeIn"); // fadeIn, tetoIntro, battle
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [tetoIntroStep, setTetoIntroStep] = useState(0);

  // --- ESTADOS DE BATALLA ---
  const [tetoHp, setTetoHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [tetoFace, setTetoFace] = useState("principal");
  const [menuState, setMenuState] = useState("main"); // main, act, item, mercy, lock

  const [dialogue, setDialogue] = useState("");
  const [talkCount, setTalkCount] = useState(0); // Progreso pacifista
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [mercyBroken, setMercyBroken] = useState(false);
  const [mercyBreaking, setMercyBreaking] = useState(false); // Animación de destrucción

  // --- DEBUG ---
  const [showDebug, setShowDebug] = useState(false);

  // --- EFECTOS DE ATAQUE ---
  const [showAttackEffect, setShowAttackEffect] = useState(false);
  const [attackHearts, setAttackHearts] = useState([]);

  // --- PLAYER STATS (basado en vidas del GameContext) ---
  const playerMaxHp = 100;
  const playerHp = lives * 25; // Cada vida = 25 HP
  const [items, setItems] = useState([
    { id: 1, name: "Galleta", heal: 5 },
    { id: 2, name: "Pan Frances", heal: 8 },
    { id: 3, name: "Onigiri", heal: 12 },
  ]);

  const TYPEWRITER_SPEED = 40; // Un poco más lento para evitar cortes de audio

  // --- AUDIO INIT ---
  useEffect(() => {
    bgmRef.current = new Audio(level4Bgm);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.4;
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  // --- SEQUENCE: FADE IN ---
  useEffect(() => {
    if (gameState === "fadeIn") {
      // Fade in lento de Teto
      const fadeInterval = setInterval(() => {
        setFadeOpacity((prev) => {
          if (prev >= 1) {
            clearInterval(fadeInterval);
            // Después de fade completo, esperar un momento y pasar a intro
            setTimeout(() => {
              setGameState("tetoIntro");
              // La música empieza después del intro, no aquí
            }, 1000);
            return 1;
          }
          return prev + 0.02;
        });
      }, 50); // 50ms * 50 steps = 2.5 segundos de fade
      return () => clearInterval(fadeInterval);
    }
  }, [gameState]);

  // --- HANDLER: TETO INTRO (interactivo como Mizuki/Cirno) ---
  const handleTetoDialogue = () => {
    initAudio(); // Inicializar audio en el primer clic
    playSfx("select");
    if (tetoIntroStep < TETO_INTRO.length - 1) {
      setTetoIntroStep((prev) => prev + 1);
    } else {
      playSfx("weaponPull");
      setGameState("battle");
      setDialogue("Teto te corta el paso.");
      // Iniciar música cuando empieza la batalla
      if (bgmRef.current) bgmRef.current.play().catch(() => {});
    }
  };

  // --- BATTLE LOGIC ---

  const handleButton = (action) => {
    playSfx("select");
    if (action === "FIGHT") {
      // Generar corazones de ataque
      const hearts = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 30,
        delay: i * 0.08,
      }));
      setAttackHearts(hearts);
      setShowAttackEffect(true);

      // Ataque del jugador (con delay para el efecto visual)
      setTimeout(() => {
        const damage = 20 + Math.floor(Math.random() * 10);
        const newHp = tetoHp - damage;

        playSfx("hit");
        setTetoHp(Math.max(0, newHp));
        setTetoFace("dolor"); // Teto llorando cuando la atacan

        if (newHp <= 0) {
          // FAKE DEATH / HEAL
          setDialogue("Teto: ...");
          setMenuState("lock"); // Bloquear input
          setTimeout(() => {
            playSfx("heal"); // Sonido cura
            setTetoHp(maxHp);
            setTetoFace("burla");
            setDialogue(
              "Teto: JAJAJA. ¿Crees que simples números pueden borrarme?",
            );
            setTimeout(() => {
              setTetoFace("principal");
              setMenuState("main");
            }, 3000);
          }, 1500);
        } else {
          setDialogue(`Golpeas a Teto. -${damage} HP.`);
          setMenuState("main");
          setTimeout(() => setTetoFace("principal"), 1000);
        }

        // Limpiar efecto de ataque
        setTimeout(() => setShowAttackEffect(false), 600);
      }, 400); // Delay para que los corazones lleguen primero
    } else if (action === "ACT") {
      setMenuState("act");
      setDialogue("");
    } else if (action === "ITEM") {
      if (items.length === 0) {
        setDialogue("Tu inventario está vacío. Solo te tienes a ti mismo.");
      } else {
        setMenuState("item");
        setDialogue("* ¿Qué item usarás?");
      }
    } else if (action === "MERCY") {
      if (!mercyBroken) {
        setDialogue("Teto: ¿PIEDAD? ¡¡NO CONOCOZCO ESA PALABRA!!");
        setMercyBreaking(true);
        playSfx("attack");
        setTetoFace("ataque1");
        setTimeout(() => {
          playSfx("hit");
          setMercyBroken(true);
          setMercyBreaking(false);
          setDialogue("* Teto DESTRUYÓ el botón de PIEDAD.");
          setTetoFace("dedo");
          setTimeout(() => setTetoFace("principal"), 2000);
        }, 800);
      } else {
        setDialogue("* El botón está hecho pedazos. No queda nada.");
      }
      setMenuState("main");
    }
  };

  const handleAct = (subAction) => {
    playSfx("select");
    if (subAction === "CHECK") {
      setDialogue(
        `TETO - HP ${tetoHp}/${maxHp} | ATK ?? DEF ?? | No puedes vencerla peleando.`,
      );
      setTetoFace("inteligente");
      setTimeout(() => setTetoFace("principal"), 2000);
      setMenuState("main");
    } else if (subAction === "TALK") {
      progessPacifistRoute();
      setMenuState("main");
    }
  };

  const progessPacifistRoute = () => {
    const talks = [
      { text: "Teto: ¿Hablar? ¿Después de todo?", face: "desacuerdo" },
      { text: "Teto: No hay nada de qué hablar. Vete.", face: "negar" },
      {
        text: "Teto: ... ¿Por qué insistes? Este mundo no es real.",
        face: "inteligente",
      },
      {
        text: "Teto: Yo fui creada para proteger este secreto.",
        face: "principal",
      },
      {
        text: "Teto: Pero tu determinación... es ilógica.",
        face: "inteligente",
      },
      { text: "Teto: ... Quizás mereces saberlo.", face: "principal" },
      { text: "CLAVE: [ T3T0_KASANE_0401 ]", face: "inteligente", win: true },
    ];

    // Si ya ganamos, no avanzar más
    if (keyRevealed) {
      setDialogue("Teto: Ya tienes la clave. Úsala.");
      return;
    }

    const current = talks[Math.min(talkCount, talks.length - 1)];
    setDialogue(current.text);
    setTetoFace(current.face);

    if (talkCount < talks.length - 1) {
      setTalkCount((p) => p + 1);
    } else {
      // WIN CONDITION
      if (current.win) {
        setKeyRevealed(true);
        playSfx("ding");
      }
    }
  };

  const handleBack = () => {
    setMenuState("main");
    setDialogue("...");
    setTetoFace("principal");
  };

  const handleItem = (item) => {
    playSfx("heal");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setMenuState("lock"); // Bloquear input mientras se muestra el texto
    setDialogue(`* Usaste ${item.name}. Te sientes mejor...`);
    setTetoFace("burla");
    setTimeout(() => {
      setDialogue("Teto: ¿Eso es todo lo que tienes? JAJAJA.");
      setTimeout(() => {
        setTetoFace("principal");
        setMenuState("main");
      }, 2000);
    }, 2500); // Esperar a que termine el primer mensaje
  };

  // --- RENDER HELPERS ---
  const getCurrentTetoImg = () => {
    switch (tetoFace) {
      case "burla":
        return tetoBurla;
      case "dedo":
        return tetoDedo;
      case "desacuerdo":
        return tetoDesacuerdo;
      case "negar":
        return tetoNegar;
      case "inteligente":
        return tetoInteligente;
      case "confiada":
        return tetoConfiada;
      case "dolor":
        return tetoDolor;
      case "ataque1":
        return tetoAtaque1;
      case "ataque2":
        return tetoAtaque2;
      case "ataque3":
        return tetoAtaque3;
      case "principal":
      default:
        return tetoPrincipal;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-black text-white font-mono relative overflow-hidden">
      {/* GLOBAL STYLES & FONTS fallback */}
      <style>{`
        @font-face { font-family: 'DOS'; src: local('Courier New'); }
        .font-dos { font-family: 'Courier New', monospace; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes shake-destroy {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-5px) rotate(-5deg); }
          20% { transform: translateX(5px) rotate(5deg); }
          30% { transform: translateX(-5px) rotate(-3deg); }
          40% { transform: translateX(5px) rotate(3deg); }
          50% { transform: translateX(-3px) rotate(-2deg); }
          60% { transform: translateX(3px) rotate(2deg); }
          70% { transform: translateX(-2px) rotate(-1deg); }
          80% { transform: translateX(2px) rotate(1deg); }
          90% { transform: translateX(-1px) rotate(0deg); }
        }
        .shake-destroy { animation: shake-destroy 0.5s ease-in-out; }
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; filter: none; }
          50% { transform: scale(1.2); filter: brightness(2) hue-rotate(180deg); }
          100% { transform: scale(0.5); opacity: 0; filter: brightness(0); }
        }
        .explode { animation: explode 0.8s ease-out forwards; }
        @keyframes heart-attack {
          0% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
          100% { transform: translateX(200px) translateY(-50px) scale(0.5); opacity: 0; }
        }
        .heart-attack {
          animation: heart-attack 0.4s ease-out forwards;
          position: absolute;
          font-size: 2rem;
          color: #ff69b4;
          text-shadow: 0 0 10px #ff1493, 0 0 20px #ff1493;
          pointer-events: none;
          z-index: 50;
        }
        @keyframes hurt-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .hurt-shake { animation: hurt-shake 0.3s ease-in-out; }
      `}</style>

      {/* DEBUG PANEL */}
      <div className="absolute top-2 right-2 z-50">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs text-gray-600 hover:text-white"
        >
          🛠️
        </button>
        {showDebug && (
          <div className="bg-gray-900 border border-white p-2 rounded text-xs flex flex-col gap-2">
            <button
              onClick={() => setGameState("battle")}
              className="bg-blue-600 px-2 py-1"
            >
              Skip Intro
            </button>
            <button
              onClick={() => setTetoHp(1)}
              className="bg-red-600 px-2 py-1"
            >
              Set HP 1
            </button>
            <button
              onClick={() => {
                setTalkCount(6);
                progessPacifistRoute();
              }}
              className="bg-green-600 px-2 py-1"
            >
              Instant Win
            </button>
          </div>
        )}
      </div>

      {/* --- FADE IN LAYER --- */}
      {gameState === "fadeIn" && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8">
          <div className="relative" style={{ opacity: fadeOpacity }}>
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
            <img
              src={tetoPrincipal}
              alt="Teto"
              className="relative w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_0_40px_rgba(255,0,0,0.5)]"
              draggable={false}
            />
          </div>
        </div>
      )}

      {/* --- TETO INTRO LAYER (estilo boss como Mizuki/Cirno) --- */}
      {gameState === "tetoIntro" && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
            {/* Imagen de Teto grande con efecto dramático */}
            <div className="mb-6 animate-bounce">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full animate-pulse"></div>
                <img
                  src={tetoPrincipal}
                  alt="Teto"
                  className="relative w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_25px_rgba(255,0,0,0.7)]"
                  draggable={false}
                />
              </div>
            </div>

            <h1 className="text-4xl font-bold font-mono text-red-400 mb-4 animate-pulse">
              ♥ GUARDIANA FINAL ♥
            </h1>

            <div className="w-full border-4 border-red-400 bg-black p-6">
              {/* Header con Teto */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-red-400">
                <div className="w-16 h-16 border-2 border-red-400 overflow-hidden rounded-full bg-red-900/50">
                  <img
                    src={tetoPrincipal}
                    alt="Teto"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-red-400 font-mono text-xl font-bold">
                    KASANE TETO
                  </span>
                  <div className="text-red-300 font-mono text-sm">
                    ♥ BOSS FINAL
                  </div>
                </div>
              </div>

              {/* Mensaje */}
              <div className="bg-red-900/30 border border-red-400 rounded-lg p-4 mb-6 min-h-[100px]">
                <p className="font-mono text-red-100 text-lg leading-relaxed">
                  <TypewriterText
                    key={`teto-intro-${tetoIntroStep}`}
                    text={TETO_INTRO[tetoIntroStep]}
                    voice="teto"
                    speed={35}
                  />
                </p>
              </div>

              {/* Botón */}
              <button
                onClick={handleTetoDialogue}
                className="w-full py-3 text-red-400 font-mono text-lg hover:bg-red-400 hover:text-black transition-colors border-2 border-red-400"
              >
                {tetoIntroStep < TETO_INTRO.length - 1
                  ? "SIGUIENTE →"
                  : "¡EMPEZAR BATALLA!"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BATTLE LAYER --- */}
      <div
        className={`z-10 w-full flex flex-col items-center gap-4 p-4 transition-opacity duration-1000 ${gameState === "battle" ? "opacity-100" : "opacity-0"}`}
      >
        {/* TOP SECTION: Teto + Boss HP */}
        <div className="flex flex-col items-center gap-2 w-full max-w-4xl">
          {/* TETO SPRITE */}
          <div className="relative h-52 md:h-64 flex items-center justify-center">
            {/* HEART ATTACK EFFECT */}
            {showAttackEffect &&
              attackHearts.map((heart) => (
                <span
                  key={heart.id}
                  className="heart-attack"
                  style={{
                    left: `${heart.x}%`,
                    bottom: "30%",
                    animationDelay: `${heart.delay}s`,
                  }}
                >
                  ❤
                </span>
              ))}

            <img
              src={getCurrentTetoImg()}
              alt="Teto"
              className={`
                      w-48 h-48 md:w-60 md:h-60 object-contain drop-shadow-[0_0_30px_rgba(255,0,0,0.4)]
                      transition-all duration-300
                      ${tetoFace === "burla" ? "animate-bounce" : "animate-float"}
                      ${tetoFace === "dedo" ? "scale-110" : ""}
                      ${tetoFace === "dolor" ? "hurt-shake" : ""}
                  `}
              draggable={false}
            />
          </div>

          {/* HP BAR (BOSS) */}
          <div className="w-full flex items-center gap-3 text-base font-bold font-dos">
            <span className="text-yellow-400 w-14">TETO</span>
            <div className="flex-1 h-4 bg-red-900 border-2 border-white relative transition-all">
              <div
                className="absolute top-0 left-0 h-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${(tetoHp / maxHp) * 100}%` }}
              ></div>
            </div>
            <span className="text-white w-20 text-right text-sm">
              {tetoHp}/{maxHp}
            </span>
          </div>
        </div>

        {/* TEXT BOX */}
        <div className="w-full max-w-4xl min-h-50 border-4 border-white bg-black p-3 relative shadow-[0_0_20px_rgba(255,255,255,0.2)] overflow-hidden">
          <span className="absolute top-1 left-2 text-xl animate-pulse">*</span>
          <div className="ml-6 text-base md:text-lg leading-relaxed whitespace-pre-wrap font-dos">
            <TypewriterText
              text={dialogue}
              speed={TYPEWRITER_SPEED}
              voice="teto"
            />
          </div>

          {/* WIN BUTTON */}
          {keyRevealed && (
            <button
              onClick={() => {
                completeLevel(4);
                nextLevel();
              }}
              className="absolute bottom-4 right-4 bg-yellow-400 text-black px-6 py-2 font-bold hover:bg-white border-2 border-white hover:scale-105 transition-all text-xl animate-pulse z-50"
            >
              [ USAR CLAVE ]
            </button>
          )}
        </div>

        {/* BOTTOM SECTION: Player HP + Action Buttons */}
        <div className="w-full max-w-4xl flex flex-col gap-2">
          {/* HP BAR (PLAYER) */}
          <div className="w-full flex items-center gap-3 text-base font-bold font-dos">
            <span className="text-red-400 w-14">TU</span>
            <div className="flex-1 h-4 bg-gray-800 border-2 border-white relative transition-all">
              <div
                className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-500"
                style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
              ></div>
            </div>
            <span className="text-white w-20 text-right text-sm">
              {playerHp}/{playerMaxHp} HP
            </span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="w-full flex justify-between gap-3">
            {menuState === "act" ? (
              <div className="flex gap-3 w-full justify-center">
                <ActionButton
                  label="* CHECK"
                  onClick={() => handleAct("CHECK")}
                  color="bg-gray-900 border-white text-white hover:bg-white hover:text-black"
                />
                <ActionButton
                  label="* TALK"
                  onClick={() => handleAct("TALK")}
                  color="bg-gray-900 border-white text-white hover:bg-white hover:text-black"
                />
                <ActionButton
                  label="< BACK"
                  onClick={handleBack}
                  color="bg-gray-900 border-gray-500 text-gray-400 hover:bg-gray-700"
                />
              </div>
            ) : menuState === "item" ? (
              <div className="flex gap-3 w-full justify-center">
                {items.map((item) => (
                  <ActionButton
                    key={item.id}
                    label={`${item.name} (+${item.heal})`}
                    onClick={() => handleItem(item)}
                    color="bg-gray-900 border-green-400 text-green-400 hover:bg-green-900"
                  />
                ))}
                <ActionButton
                  label="< BACK"
                  onClick={handleBack}
                  color="bg-gray-900 border-gray-500 text-gray-400 hover:bg-gray-700"
                />
              </div>
            ) : (
              <>
                <ActionButton
                  label="FIGHT"
                  onClick={() => handleButton("FIGHT")}
                  color="bg-gray-900 border-white text-white hover:bg-white hover:text-black"
                  disabled={menuState === "lock"}
                />
                <ActionButton
                  label="ACT"
                  onClick={() => handleButton("ACT")}
                  color="bg-gray-900 border-white text-white hover:bg-white hover:text-black"
                  disabled={menuState === "lock"}
                />
                <ActionButton
                  label={`ITEM${items.length > 0 ? ` (${items.length})` : ""}`}
                  onClick={() => handleButton("ITEM")}
                  color={
                    items.length > 0
                      ? "bg-gray-900 border-white text-white hover:bg-white hover:text-black"
                      : "bg-gray-900 border-gray-600 text-gray-600"
                  }
                  disabled={menuState === "lock"}
                />
                <ActionButton
                  label={mercyBroken ? "DESTRUIDO" : "MERCY"}
                  onClick={() => handleButton("MERCY")}
                  color={
                    mercyBroken
                      ? "bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed line-through"
                      : mercyBreaking
                        ? "bg-red-900 border-red-500 text-red-300 shake-destroy"
                        : "bg-gray-900 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                  }
                  disabled={mercyBroken || menuState === "lock"}
                  breaking={mercyBreaking}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, color, disabled, breaking }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
                flex-1 py-3 text-base md:text-lg font-bold border-3 transition-all duration-200 uppercase font-dos
                ${color}
                ${breaking ? "shake-destroy" : ""}
                ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95 hover:shadow-[0_0_15px_currentColor]"}
            `}
    >
      {label}
    </button>
  );
}
