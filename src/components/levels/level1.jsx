import { useState, useEffect } from "react";
import { useGame } from "../../context/GameContext";
// IMPORTANTE: Importamos la imagen desde tu carpeta assets para que Vite la encuentre
import mikuImg from '../../assets/Miku.png'; 
// TUS IMÁGENES REALES (Según tu captura)
import reimuImg from '../../assets/lv1/reimu.png';
import marisaImg from '../../assets/lv1/marisa.png';
import sakuyaImg from '../../assets/lv1/sakuya.png'; // <--- CAMBIO: Usamos Sakuya
import flandreImg from '../../assets/lv1/flandre.png';
import yuyukoImg from '../../assets/lv1/yuyuko.png'; // <--- CAMBIO: Usamos Yuyuko
import koishiImg from '../../assets/lv1/koishi.png';

/* DATA CORREGIDA */
const FUMO_DATA = [
  { 
    id: 1, 
    src: reimuImg, 
    name: "Reimu Hakurei", 
    funnyQuote: "Donación aceptada." 
  },
  { 
    id: 2, 
    src: marisaImg, 
    name: "Marisa Kirisame", 
    funnyQuote: "¡Solo lo tomé prestado!" 
  },
  { 
    id: 3, 
    src: sakuyaImg, // <--- Sakuya en lugar de Remilia
    name: "Sakuya Izayoi", 
    funnyQuote: "Limpieza completa." 
  },
  { 
    id: 4, 
    src: flandreImg, 
    name: "Flandre Scarlet", 
    funnyQuote: "¡Se rompió!" 
  },
  { 
    id: 5, 
    src: yuyukoImg, // <--- Yuyuko en lugar de Satori
    name: "Yuyuko Saigyouji", 
    funnyQuote: "¿Eso se come?" 
  },
  { 
    id: 6, 
    src: koishiImg, 
    name: "Koishi Komeiji", 
    funnyQuote: "¿Mi par? ¿Dónde?" 
  },
];
const TIME_LIMIT = 50;

// DIÁLOGO: REGLAS DIRECTAS
const MIKU_RULES = [
  "Miku: ¡Atención! Para romper esta barrera, necesitamos velocidad.",
  "Regla 1: Encuentra todos los pares de Fumos idénticos.",
  "Regla 2: Tienes 50 segundos exactos. Si el contador llega a cero, pierdes una vida.",
  "Regla 3: El sistema es inestable. Las cartas se moverán si te tardas mucho.",
  "Miku: Eso es todo. ¡Demuestra tu memoria y desbloquea el nivel!"
];

export default function Level1() {
  const { nextLevel, takeDamage } = useGame();
  
  // --- ESTADOS ---
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  
  // Estados visuales
  const [shaking, setShaking] = useState([]); 
  const [popping, setPopping] = useState([]);
  
  // Intro
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(0); 
  const [message, setMessage] = useState("Esperando inicio..."); 

  // 1. Inicialización
  useEffect(() => {
    const shuffled = [...FUMO_DATA, ...FUMO_DATA]
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, uniqueId: index }));
    setCards(shuffled);
  }, []);

  // 2. Timer
  useEffect(() => {
    if (showIntro) return; 
    if (solved.length === FUMO_DATA.length) return;

    if (timeLeft <= 0) {
      takeDamage();
      setMessage("¡TIEMPO FUERA! -1 VIDA");
      setTimeLeft(15);
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, solved, takeDamage, showIntro]);

  // 3. Lógica
  useEffect(() => {
    if (flipped.length === 2) {
      setDisabled(true);
      const [first, second] = flipped;

      if (cards[first].id === cards[second].id) {
        setMessage(`¡Correcto! ${cards[first].name} asegurado.`);
        setPopping([first, second]);
        setTimeout(() => {
          setSolved((prev) => [...prev, cards[first].id]);
          setFlipped([]);
          setPopping([]);
          setDisabled(false);
        }, 600);
      } else {
        setMessage("¡Incorrecto!"); 
        setShaking([first, second]);
        setTimeout(() => {
          setFlipped([]);
          setShaking([]);
          setDisabled(false);
        }, 800);
      }
    }
  }, [flipped, cards]);

  // 4. Ganar
  useEffect(() => {
    if (FUMO_DATA.length > 0 && solved.length === FUMO_DATA.length) {
      setMessage("¡NIVEL COMPLETADO!");
      setTimeout(nextLevel, 2000);
    }
  }, [solved, nextLevel]);

  // --- HANDLERS ---
  const handleClick = (index) => {
    if (showIntro || disabled || solved.includes(cards[index].id) || flipped.includes(index)) return;
    setFlipped((prev) => [...prev, index]);
  };

  const handleNextDialogue = () => {
    if (introStep < MIKU_RULES.length - 1) {
      setIntroStep(prev => prev + 1);
    } else {
      startGame();
    }
  };

  const startGame = () => {
    setShowIntro(false);
    setMessage("¡Comienza!");
  };

  // --- GLITCH VISUALS ---
  const isWarning = timeLeft <= 25;
  const isCritical = timeLeft <= 10;
  const boardClass = isCritical ? 'glitch-critical' : isWarning ? 'glitch-warning' : 'board-mover';
  const progress = (timeLeft / TIME_LIMIT) * 100;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl relative">
      
      <style>{`
        @keyframes move-board {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -20px) rotate(2deg); }
          50% { transform: translate(-20px, 10px) rotate(-2deg); }
          75% { transform: translate(20px, 20px) rotate(1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes twitch {
          0% { transform: translate(1px, 1px); }
          20% { transform: translate(-3px, 0px); }
          40% { transform: translate(1px, -1px); }
          60% { transform: translate(-3px, 1px); }
          80% { transform: translate(-1px, -1px); }
          100% { transform: translate(1px, -2px); }
        }
        @keyframes hard-glitch {
          0% { transform: translate(0) skew(0deg); filter: hue-rotate(0deg); }
          20% { transform: translate(-10px, 10px) skew(10deg); filter: hue-rotate(90deg); }
          40% { transform: translate(10px, -10px) skew(-10deg); filter: invert(1); }
          60% { transform: translate(-5px, 5px) skew(5deg); opacity: 0.8; }
          80% { transform: translate(5px, -5px) skew(-5deg); filter: hue-rotate(-90deg); }
          100% { transform: translate(0) skew(0deg); }
        }
        
        .board-mover { animation: move-board 15s ease-in-out infinite; }
        .glitch-warning { animation: twitch 0.5s infinite; border-color: yellow !important; }
        .glitch-critical { animation: hard-glitch 0.2s infinite; border-color: red !important; box-shadow: 0 0 20px red; }
        .card-shake { animation: twitch 0.3s ease-in-out infinite; border-color: red !important; }
        .card-pop { transform: scale(1.3); border-color: #00ff00 !important; box-shadow: 0 0 15px #00ff00; z-index: 100; }
      `}</style>

      {/* HEADER */}
      <div className="flex justify-between w-full font-mono mb-2 px-2 text-sm sm:text-base">
        <span className={`${isCritical ? 'text-red-500 animate-ping' : 'text-teto-red'} font-bold`}>
          {isCritical ? 'ERROR CRÍTICO' : 'NIVEL 1'}
        </span>
        <span className={isCritical ? 'text-red-500 font-bold text-xl' : ''}>{timeLeft}s</span>
      </div>

      {/* BARRA DE TIEMPO */}
      <div className="w-full h-3 border-2 border-white mb-4 bg-gray-900 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${isCritical ? 'bg-red-600' : isWarning ? 'bg-yellow-400' : 'bg-green-400'}`} 
          style={{ width: `${progress}%` }} 
        />
      </div>

      {/* --- TABLERO --- */}
      <div className="relative w-full aspect-square max-w-[400px] border-4 border-white bg-black overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
        
        {/* Cubierta de Intro */}
        {showIntro && <div className="absolute inset-0 bg-black/90 z-10 flex flex-col items-center justify-center gap-4">
            <div className="text-teto-red font-mono text-xl animate-pulse">PAUSA - LEYENDO REGLAS</div>
        </div>}

        {/* JUEGO */}
        <div className={`${boardClass} p-4 bg-gray-800 border-2 border-white rounded-lg transition-all duration-300`}> 
          <div className="grid grid-cols-3 gap-2"> 
            {cards.map((card, index) => {
              const isFlipped = flipped.includes(index) || solved.includes(card.id);
              const isShaking = shaking.includes(index);

              return (
                <div
                  key={card.uniqueId}
                  onClick={() => handleClick(index)}
                  className={`
                    w-12 h-12 sm:w-16 sm:h-16 cursor-pointer
                    border-2 flex items-center justify-center bg-gray-900 transition-all duration-200
                    ${isShaking ? 'card-shake' : ''}
                    ${isFlipped ? "border-teto-red rotate-y-180" : "border-white hover:border-yellow-400"}
                    ${solved.includes(card.id) ? "opacity-20 grayscale border-gray-700" : ""} 
                  `}
                >
                  <div className={`w-full h-full p-1 ${isFlipped ? "block" : "hidden"}`}>
                    <img
                      src={card.src}
                      alt="Fumo"
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
                    />
                    <span className="text-xl hidden">🧸</span>
                  </div>
                  <div className={`text-white font-bold text-lg ${isFlipped ? "hidden" : "block"}`}>?</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- INTERFAZ DE MIKU --- */}
      <div className="mt-4 w-full max-w-[400px] flex gap-2 items-stretch relative">
        
        {/* FOTO DE MIKU */}
        {showIntro && (
          <div className="w-16 h-16 border-2 border-white bg-black overflow-hidden flex-shrink-0">
             <img 
                src={mikuImg}  // <--- Usamos la variable importada
                alt="Miku" 
                className="w-full h-full object-cover"
             />
          </div>
        )}

        {/* CAJA DE TEXTO */}
        <div className="flex-1 border-4 border-white p-3 min-h-[80px] bg-black z-20 relative flex flex-col justify-center">
          
          <p className={`font-mono text-white text-sm ${!showIntro && isCritical ? 'text-red-500 glitch-warning' : ''} typing-effect leading-tight`}>
            {showIntro ? (
               <span>{MIKU_RULES[introStep]}</span>
            ) : (
               <span>* {message}</span>
            )}
          </p>

          {/* BOTÓN */}
          {showIntro && (
            <button 
              onClick={handleNextDialogue}
              className="self-end mt-2 text-teto-red font-mono text-xs hover:text-white hover:underline uppercase"
            >
              [ {introStep < MIKU_RULES.length - 1 ? 'Siguiente' : '¡JUGAR!'} ]
            </button>
          )}
        </div>
      </div>

    </div>
  );
}