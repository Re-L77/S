import { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { useAudio } from "../../context/AudioContext";
import TypewriterText from "../ui/TypewriterText";

// --- CONFIGURACIÓN ---
const SONG_START_TIME = 4.0; 
const LANES = ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"];
const ICONS = { ArrowLeft: "←", ArrowDown: "↓", ArrowUp: "↑", ArrowRight: "→" };
const COLORS = {
  ArrowLeft:  "bg-gradient-to-t from-pink-500 to-pink-300 shadow-[0_0_20px_#ec4899]",
  ArrowDown:  "bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-[0_0_20px_#06b6d4]",
  ArrowUp:    "bg-gradient-to-t from-green-500 to-green-300 shadow-[0_0_20px_#22c55e]",
  ArrowRight: "bg-gradient-to-t from-yellow-500 to-yellow-300 shadow-[0_0_20px_#eab308]"
};

export default function RhythmEngine({ videoSrc, difficulty }) {
  const { completeLevel } = useGame();
  const { playSfx, initAudio } = useAudio();
  const videoRef = useRef(null);

  // Estados
  const [gameState, setGameState] = useState("intro"); 
  const [count, setCount] = useState(3); 
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [generatedChart, setGeneratedChart] = useState([]);
  const [activeNotes, setActiveNotes] = useState([]);
  
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(1);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("text-white");
  const [pressedLanes, setPressedLanes] = useState({});

  const settings = {
    easy:   { energyMult: 1.5, minGap: 0.60, speed: 2.2 }, 
    normal: { energyMult: 1.3, minGap: 0.40, speed: 1.8 }, 
    hard:   { energyMult: 1.15, minGap: 0.25, speed: 1.2 } 
  }[difficulty];

  // --- 1. ANÁLISIS ---
  const analyzeAudio = async () => {
    initAudio(); 
    setGameState("analyzing");
    
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch(videoSrc);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      const rawData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const chart = [];
      const bufferSize = Math.floor(sampleRate * 0.05); 
      let lastNoteTime = 0;

      for (let i = 0; i < rawData.length; i += bufferSize) {
        let sum = 0;
        for (let j = 0; j < bufferSize && i + j < rawData.length; j++) {
            sum += rawData[i + j] * rawData[i + j];
        }
        const rms = Math.sqrt(sum / bufferSize);
        if (i % (bufferSize * 50) === 0) setAnalyzeProgress(Math.round((i / rawData.length) * 100));
        const time = i / sampleRate;

        if (time > SONG_START_TIME) {
            const noiseFloor = 0.05; 
            if (rms > noiseFloor && rms > (0.1 * settings.energyMult)) {
                 if (time - lastNoteTime > settings.minGap) {
                    const lane = LANES[Math.floor(Math.random() * LANES.length)];
                    chart.push({ id: Math.random(), hitTime: time, key: lane, hit: false });
                    lastNoteTime = time;
                 }
            }
        }
      }

      setGeneratedChart(chart);
      setMaxScore(chart.length * 1000);
      setGameState("tutorial"); 

    } catch (e) {
      console.error("Error:", e);
      setGameState("tutorial"); 
    }
  };

  // --- 2. COUNTDOWN ---
  useEffect(() => {
      if (gameState === "countdown") {
          const timer = setInterval(() => {
              setCount((prev) => {
                  if (prev <= 1) {
                      clearInterval(timer);
                      setGameState("playing");
                      if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play();
                      }
                      return 0;
                  }
                  playSfx("select"); 
                  return prev - 1;
              });
          }, 1000);
          return () => clearInterval(timer);
      }
  }, [gameState, playSfx]);

  // --- 3. GAME LOOP ---
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId;
    const loop = () => {
      if (!videoRef.current) return;
      const now = videoRef.current.currentTime;

      const visibleNotes = generatedChart.filter(n => {
        const spawnTime = n.hitTime - settings.speed;
        return now >= spawnTime && now <= n.hitTime + 0.5 && !n.hit;
      });
      setActiveNotes(visibleNotes);

      visibleNotes.forEach(n => {
         const missWindow = difficulty === 'hard' ? 0.15 : 0.25;
         if (now > n.hitTime + missWindow && !n.hit) {
             handleResult("MISS", 0);
             n.hit = true;
         }
      });

      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [gameState, generatedChart]);

  // --- 4. INPUT ---
  const handleResult = (type, points) => {
    setFeedback(type);
    if (type === "PERFECT") setFeedbackColor("text-yellow-300 drop-shadow-[0_0_15px_#fde047]");
    else if (type === "GREAT") setFeedbackColor("text-cyan-300 drop-shadow-[0_0_15px_#67e8f9]");
    else setFeedbackColor("text-gray-500");

    if (type === "MISS") setCombo(0);
    else {
        setCombo(c => c + 1);
        setScore(s => s + points);
        playSfx("ding");
    }
    setTimeout(() => setFeedback(""), 250);
  };

  const handleKeyDown = (e) => {
    if (gameState === "intro") { if(e.key === "Enter") setGameState("idle"); return; }
    
    // CAMBIO: Permitir iniciar desde tutorial con Enter también
    if (gameState === "tutorial" && e.key === "Enter") {
        setCount(3);
        setGameState("countdown");
        return;
    }

    if (gameState !== "playing" || !LANES.includes(e.key)) return;
    
    setPressedLanes(prev => ({ ...prev, [e.key]: true }));
    setTimeout(() => setPressedLanes(prev => ({ ...prev, [e.key]: false })), 100);

    const now = videoRef.current.currentTime;
    const target = activeNotes
        .filter(n => n.key === e.key && !n.hit)
        .sort((a, b) => Math.abs(a.hitTime - now) - Math.abs(b.hitTime - now))[0];

    if (target) {
        const diff = Math.abs(target.hitTime - now);
        const hitWindow = difficulty === 'easy' ? 0.5 : 0.35;
        if (diff < hitWindow) { 
            target.hit = true;
            if (diff < 0.1) handleResult("PERFECT", 1000);
            else handleResult("GREAT", 500);
        }
    }
  };

  useEffect(() => { 
    window.addEventListener("keydown", handleKeyDown); 
    return () => window.removeEventListener("keydown", handleKeyDown); 
  }, [gameState, activeNotes]);

  const percentage = Math.round((score / (maxScore || 1)) * 100);
  const isPass = percentage >= 60;

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden font-sans select-none border-b-4 border-cyan-500 shadow-2xl">
      
      <video ref={videoRef} src={videoSrc} crossOrigin="anonymous"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${gameState === "playing" ? "opacity-30" : "opacity-0"}`}
        onEnded={() => setGameState("results")}
      />
      
      <div className={`absolute inset-0 transition-colors duration-1000 ${gameState === "playing" ? "bg-transparent" : "bg-black"}`} />

      {/* --- ESTADOS --- */}

      {/* 1. INTRO NARRATIVA */}
      {gameState === "intro" && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-50 p-10">
              <div className="max-w-3xl w-full border-l-4 border-cyan-500 pl-6 animate-fadeIn">
                  <h2 className="text-gray-500 text-sm uppercase tracking-[0.5em] mb-4">Inicializando Sistema...</h2>
                  <div className="text-2xl md:text-3xl text-white font-mono leading-relaxed mb-8">
                      <TypewriterText text="Miku: Detecto actividad en el archivo. Teto protegió este recuerdo con una secuencia lógica." voice="miku" speed={30} />
                  </div>
                  <div className="flex gap-4 items-center animate-pulse">
                      <span className="text-cyan-400 text-xl">▶</span>
                      <button onClick={() => setGameState("idle")} className="text-white text-xl uppercase tracking-widest hover:text-cyan-400 transition-colors">
                          [ENTER] START MISSION
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 2. IDLE */}
      {gameState === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
           <h1 className="text-6xl font-black text-white mb-2 tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
               DATA <span className="text-cyan-400">SYNC</span>
           </h1>
           <p className="text-gray-500 text-sm tracking-[0.5em] uppercase mb-10">Difficulty: {difficulty}</p>
           <button onClick={analyzeAudio} className="px-12 py-5 border-2 border-white text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300">
              [ ANALYZE & START ]
                <p>(Click Here)</p>
           </button>
        </div>
      )}

      {/* 3. ANALYZING */}
      {gameState === "analyzing" && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
            <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-cyan-500 transition-all duration-100" style={{ width: `${analyzeProgress}%` }}></div>
            </div>
            <p className="text-cyan-400 font-mono text-xs animate-pulse">CARGANDO SECUENCIA... {analyzeProgress}%</p>
        </div>
      )}

      {/* 4. TUTORIAL / INSTRUCCIONES (MODIFICADO) */}
      {gameState === "tutorial" && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
            <div className="border-4 border-white p-8 max-w-2xl w-full text-center bg-black shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <h2 className="text-4xl font-black text-cyan-400 mb-8 tracking-widest uppercase">Instrucciones</h2>
                
                {/* Controles Visuales */}
                <div className="flex justify-center gap-8 mb-8">
                    {LANES.map(lane => (
                        <div key={lane} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 border-2 border-gray-500 flex items-center justify-center text-3xl text-white font-bold rounded-md">
                                {ICONS[lane]}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Explicación Simplificada Visualmente */}
                <div className="text-left space-y-4 mb-8 text-gray-300 font-mono text-sm border-t border-gray-700 pt-6">
                    <p>1. <span className="text-white font-bold">CONTROLES:</span> Usa las flechas de tu teclado.</p>
                    <p>2. <span className="text-white font-bold">ACCIÓN:</span> Presiona la tecla exacta cuando la barra de color toque el receptor abajo.</p>
                    <p>3. <span className="text-yellow-400 font-bold">META:</span> Supera el <span className="text-white text-lg">60%</span> de precisión.</p>
                </div>

                {/* BOTÓN DE CLIC ESPECÍFICO */}
                <div className="animate-bounce mb-2 text-cyan-400 text-xs uppercase tracking-widest">
                    ▼ HAZ CLIC AQUÍ PARA COMENZAR ▼
                </div>
                <button 
                    onClick={() => { setCount(3); setGameState("countdown"); }}
                    className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-2xl uppercase tracking-widest transition-all shadow-[0_0_20px_#06b6d4]"
                >
                    [ INICIAR CUENTA ATRÁS ]
                </button>
            </div>
        </div>
      )}

      {/* 5. COUNTDOWN */}
      {gameState === "countdown" && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md">
           <div key={count} className="text-[150px] font-black italic text-cyan-400 drop-shadow-[0_0_50px_#06b6d4] animate-bounce-short">
               {count}
           </div>
        </div>
      )}

      {/* 6. PLAYING (HUD & HIGHWAY) */}
      {gameState === "playing" && (
        <>
            <div className="absolute top-4 right-6 z-20 text-right">
                <div className="text-5xl font-black italic text-white tracking-tighter drop-shadow-md">{score.toLocaleString()}</div>
                <div className="text-xs text-cyan-400 font-bold tracking-[0.2em] uppercase">Score</div>
            </div>

            <div className="absolute inset-0 flex justify-center items-end perspective-[900px]">
                <div className="relative w-full max-w-lg h-full flex transform-style-3d rotate-x-[25deg] origin-bottom pb-8">
                    {LANES.map((lane) => (
                        <div key={lane} className="relative flex-1 border-r border-white/5 first:border-l bg-gradient-to-b from-transparent via-black/40 to-black/80">
                            <div className={`absolute inset-0 bg-gradient-to-t ${pressedLanes[lane] ? "from-white/10 to-transparent duration-75" : "from-transparent to-transparent duration-300"}`} />
                            <div className="absolute bottom-[15%] left-0 w-full h-2 bg-white/50 shadow-[0_0_15px_white] z-20">
                                <span className={`absolute -bottom-10 left-1/2 -translate-x-1/2 text-2xl font-black transition-all duration-75 ${pressedLanes[lane] ? "text-cyan-300 scale-125" : "text-white/20"}`}>
                                    {ICONS[lane]}
                                </span>
                            </div>
                            {activeNotes.filter(n => n.key === lane).map(n => {
                                const timeUntilHit = n.hitTime - videoRef.current.currentTime;
                                const progress = 1 - (timeUntilHit / settings.speed);
                                if (progress < 0 || progress > 1.2) return null;
                                return (
                                    <div 
                                        key={n.id}
                                        className={`absolute left-[5%] w-[90%] h-4 rounded-full ${COLORS[lane]}`}
                                        style={{ 
                                            top: `${progress * 85}%`, 
                                            transform: `scaleX(${0.5 + progress * 0.5})`,
                                            opacity: progress > 1 ? 0 : progress < 0.1 ? progress * 10 : 1,
                                            zIndex: 10
                                        }} 
                                    >
                                        <div className="absolute inset-0 bg-white/50 blur-[2px] rounded-full" />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-50">
                <h2 className={`text-7xl font-black italic tracking-tighter ${feedbackColor} animate-bounce-short`}>
                    {feedback}
                </h2>
                {combo > 5 && (
                    <div className="mt-2 animate-pulse">
                        <span className="text-5xl font-black text-white italic drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">{combo}</span>
                        <div className="text-xs font-bold text-cyan-300 uppercase tracking-[0.5em] mt-1">Combo</div>
                    </div>
                )}
            </div>
        </>
      )}

      {/* 7. RESULTADOS */}
      {gameState === "results" && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 animate-fadeIn text-center">
            <h2 className="text-6xl font-black text-white italic mb-2 tracking-tighter">COMPLETE</h2>
            <div className="w-24 h-1 bg-cyan-500 mb-8 mx-auto"></div>
            
            <div className="grid grid-cols-2 gap-x-16 gap-y-6 text-right mb-10">
                <span className="text-gray-400 font-bold uppercase text-sm tracking-widest">Score</span>
                <span className="text-white text-4xl font-black italic">{score.toLocaleString()}</span>
                
                <span className="text-gray-400 font-bold uppercase text-sm tracking-widest">Accuracy</span>
                <span className={`text-4xl font-black italic ${isPass ? "text-green-400" : "text-red-500"}`}>{percentage}%</span>
            </div>

            {isPass ? (
                <button onClick={() => completeLevel(3)} className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-cyan-400 hover:scale-105 transition-all">
                    NEXT LEVEL &gt;
                </button>
            ) : (
                <button onClick={() => { setGameState("idle"); setScore(0); setCount(3); }} className="px-10 py-4 border-2 border-red-500 text-red-500 font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                    RETRY
                </button>
            )}
        </div>
      )}
    </div>
  );
}