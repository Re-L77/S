import { useEffect, useState } from "react";

// Tipos de modal con sus estilos
const MODAL_TYPES = {
  start: {
    borderColor: "border-teto-red",
    glowColor: "shadow-[0_0_30px_rgba(255,51,102,0.5)]",
    icon: "🎮",
    bgGradient: "from-black via-gray-900 to-black",
  },
  win: {
    borderColor: "border-green-400",
    glowColor: "shadow-[0_0_30px_rgba(74,222,128,0.5)]",
    icon: "🎉",
    bgGradient: "from-black via-green-950 to-black",
  },
  lose: {
    borderColor: "border-red-500",
    glowColor: "shadow-[0_0_30px_rgba(239,68,68,0.5)]",
    icon: "💀",
    bgGradient: "from-black via-red-950 to-black",
  },
  damage: {
    borderColor: "border-yellow-500",
    glowColor: "shadow-[0_0_30px_rgba(234,179,8,0.5)]",
    icon: "💔",
    bgGradient: "from-black via-yellow-950 to-black",
  },
  info: {
    borderColor: "border-blue-400",
    glowColor: "shadow-[0_0_30px_rgba(96,165,250,0.5)]",
    icon: "ℹ️",
    bgGradient: "from-black via-blue-950 to-black",
  },
};

export default function GameModal({
  isOpen,
  onClose,
  type = "info",
  title,
  subtitle,
  buttonText = "CONTINUAR",
  autoClose = 0, // ms para cerrar automáticamente (0 = no auto cerrar)
  showButton = true,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const modalStyle = MODAL_TYPES[type] || MODAL_TYPES.info;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Pequeño delay para la animación de entrada
      setTimeout(() => setIsAnimating(true), 50);

      // Auto cerrar si está configurado
      if (autoClose > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoClose);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating ? "bg-black/80 backdrop-blur-sm" : "bg-black/0"
      }`}
    >
      <style>{`
        @keyframes modal-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-10px) rotate(-1deg); }
          20% { transform: translateX(10px) rotate(1deg); }
          30% { transform: translateX(-10px) rotate(-1deg); }
          40% { transform: translateX(10px) rotate(1deg); }
          50% { transform: translateX(-5px) rotate(-0.5deg); }
          60% { transform: translateX(5px) rotate(0.5deg); }
          70% { transform: translateX(-5px) rotate(-0.5deg); }
          80% { transform: translateX(5px) rotate(0.5deg); }
          90% { transform: translateX(-2px) rotate(0deg); }
        }
        @keyframes glitch-text {
          0%, 100% { text-shadow: 2px 0 #ff0000, -2px 0 #00ffff; }
          25% { text-shadow: -2px 0 #ff0000, 2px 0 #00ffff; }
          50% { text-shadow: 2px 2px #ff0000, -2px -2px #00ffff; }
          75% { text-shadow: -2px -2px #ff0000, 2px 2px #00ffff; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .modal-damage { animation: modal-shake 0.5s ease-in-out; }
        .glitch-title { animation: glitch-text 0.3s infinite; }
        .pulse-icon { animation: pulse-glow 1s infinite; }
      `}</style>

      <div
        className={`
          relative max-w-md w-full mx-4 p-8 bg-gradient-to-b ${modalStyle.bgGradient}
          border-4 ${modalStyle.borderColor} ${modalStyle.glowColor}
          transition-all duration-300 transform
          ${isAnimating ? "scale-100 opacity-100" : "scale-75 opacity-0"}
          ${type === "damage" ? "modal-damage" : ""}
        `}
      >
        {/* Decoración de esquinas */}
        <div
          className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${modalStyle.borderColor}`}
        />
        <div
          className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${modalStyle.borderColor}`}
        />
        <div
          className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${modalStyle.borderColor}`}
        />
        <div
          className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${modalStyle.borderColor}`}
        />

        {/* Contenido */}
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icono */}
          <div className="text-6xl pulse-icon">{modalStyle.icon}</div>

          {/* Título */}
          <h2
            className={`text-3xl font-bold font-mono uppercase tracking-wider ${
              type === "damage" || type === "lose"
                ? "glitch-title text-red-400"
                : "text-white"
            }`}
          >
            {title}
          </h2>

          {/* Subtítulo */}
          {subtitle && (
            <p className="text-gray-300 font-mono text-sm">{subtitle}</p>
          )}

          {/* Botón */}
          {showButton && (
            <button
              onClick={handleClose}
              className={`
                mt-4 px-8 py-3 font-mono font-bold uppercase tracking-wider
                border-2 ${modalStyle.borderColor} bg-black
                hover:bg-white hover:text-black transition-all duration-200
                ${type === "win" ? "text-green-400" : type === "lose" || type === "damage" ? "text-red-400" : "text-teto-red"}
              `}
            >
              {buttonText}
            </button>
          )}
        </div>

        {/* Líneas decorativas animadas */}
        <div className="absolute -top-1 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
        <div className="absolute -bottom-1 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
      </div>
    </div>
  );
}
