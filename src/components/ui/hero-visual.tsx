import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HeroVisualProps {
  isPulsing?: boolean;
}

export function HeroVisual({ isPulsing = false }: HeroVisualProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Animated ECG Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1200 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M0 250 L200 250 L220 200 L240 300 L260 100 L280 250 L500 250 L520 220 L540 280 L560 150 L580 250 L800 250 L820 200 L840 300 L860 100 L880 250 L1200 250"
          stroke="url(#ecg-gradient)"
          strokeWidth={isPulsing ? "4" : "3"}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: isPulsing ? 0.4 : 0.2,
            strokeWidth: isPulsing ? [3, 4, 3] : 3
          }}
          transition={{
            pathLength: { duration: isPulsing ? 1.5 : 3, ease: "easeInOut", repeat: Infinity },
            opacity: { duration: 0.3 },
            strokeWidth: { duration: 0.6, repeat: isPulsing ? Infinity : 0 }
          }}
        />
        <defs>
          <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0" />
            <stop offset="50%" stopColor={isPulsing ? "#14B8A6" : "#14B8A6"} stopOpacity={isPulsing ? "1" : "1"} />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating 3D Heart with Neural Network */}
      <motion.div
        className="relative z-10 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          y: isPulsing ? [0, -25, 0] : [0, -20, 0],
          rotateY: [0, 10, 0, -10, 0],
        }}
        transition={{
          duration: isPulsing ? 4 : 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          translateX: mousePosition.x,
          translateY: mousePosition.y,
        }}
      >
        {/* Glow Effects */}
        <motion.div
          className="absolute inset-0 blur-3xl"
          animate={{
            scale: isPulsing ? [1, 1.3, 1] : [1, 1.2, 1],
            opacity: isPulsing ? [0.4, 0.6, 0.4] : [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: isPulsing ? 2 : 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-64 h-64 bg-teal-500/50 rounded-full" />
        </motion.div>

        {/* 3D Heart SVG */}
        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-20"
        >
          {/* Neural Network Connections */}
          <g opacity="0.6">
            <motion.circle
              cx="150"
              cy="80"
              r="4"
              fill="#14B8A6"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="220"
              cy="150"
              r="4"
              fill="#14B8A6"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.circle
              cx="80"
              cy="150"
              r="4"
              fill="#14B8A6"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
            <motion.circle
              cx="150"
              cy="220"
              r="4"
              fill="#14B8A6"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            />

            {/* Neural Lines with Data Packets */}
            <motion.line
              x1="150"
              y1="80"
              x2="150"
              y2="130"
              stroke="#14B8A6"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.circle r="2" fill="#fff">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path="M150,80 L150,130"
              />
            </motion.circle>

            <motion.line
              x1="220"
              y1="150"
              x2="170"
              y2="150"
              stroke="#14B8A6"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.circle r="2" fill="#fff">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path="M220,150 L170,150"
                begin="0.5s"
              />
            </motion.circle>

            <motion.line
              x1="80"
              y1="150"
              x2="130"
              y2="150"
              stroke="#14B8A6"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
            <motion.circle r="2" fill="#fff">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path="M80,150 L130,150"
                begin="1s"
              />
            </motion.circle>

            <motion.line
              x1="150"
              y1="220"
              x2="150"
              y2="170"
              stroke="#14B8A6"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            />
            <motion.circle r="2" fill="#fff">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path="M150,220 L150,170"
                begin="1.5s"
              />
            </motion.circle>
          </g>

          {/* 3D Heart Base */}
          <motion.path
            d="M150,250 C100,220 50,170 50,120 C50,90 65,70 85,70 C110,70 130,90 150,110 C170,90 190,70 215,70 C235,70 250,90 250,120 C250,170 200,220 150,250 Z"
            fill="url(#heart-gradient)"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1, 0.95, 1],
              opacity: 1 
            }}
            transition={{
              scale: {
                duration: isHovered ? 0.8 : 2.4,
                repeat: Infinity,
                ease: "easeInOut"
              },
              opacity: { duration: 0.5 }
            }}
          />

          {/* Heart Highlight - 3D Effect */}
          <motion.path
            d="M150,110 C130,90 110,70 85,70 C75,70 66,75 60,83 C70,73 80,70 85,70 C110,70 130,90 150,110 Z"
            fill="url(#highlight-gradient)"
            opacity="0.8"
            animate={{
              opacity: [0.8, 0.5, 0.8],
            }}
            transition={{
              duration: isHovered ? 0.8 : 2.4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Heart Shadow - 3D Depth */}
          <motion.path
            d="M150,240 C200,210 240,170 248,130 C250,150 240,180 200,210 C180,225 165,235 150,250 C135,235 120,225 100,210 C60,180 50,150 52,130 C60,170 100,210 150,240 Z"
            fill="url(#shadow-gradient)"
            opacity="0.3"
          />

          {/* AI Pulse Rings */}
          <motion.circle
            cx="150"
            cy="150"
            r="100"
            stroke="url(#pulse-gradient)"
            strokeWidth="2"
            fill="none"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ 
              scale: [0.8, 1.5, 1.5],
              opacity: [0.8, 0.3, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <motion.circle
            cx="150"
            cy="150"
            r="100"
            stroke="url(#pulse-gradient)"
            strokeWidth="2"
            fill="none"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ 
              scale: [0.8, 1.5, 1.5],
              opacity: [0.8, 0.3, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut",
              delay: 1
            }}
          />
          <motion.circle
            cx="150"
            cy="150"
            r="100"
            stroke="url(#pulse-gradient)"
            strokeWidth="2"
            fill="none"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ 
              scale: [0.8, 1.5, 1.5],
              opacity: [0.8, 0.3, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeOut",
              delay: 2
            }}
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <motion.stop 
                offset="0%" 
                initial={{ stopColor: "#14B8A6" }}
                animate={{ stopColor: isHovered ? "#F43F5E" : "#14B8A6" }}
                transition={{ duration: 0.5 }}
              />
              <motion.stop 
                offset="50%" 
                initial={{ stopColor: "#0D9488" }}
                animate={{ stopColor: isHovered ? "#BE123C" : "#0D9488" }}
                transition={{ duration: 0.5 }}
              />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
            <linearGradient id="highlight-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="shadow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
            </linearGradient>
            <radialGradient id="pulse-gradient">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="1" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Floating Data Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-teal-400/60 rounded-full blur-sm"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>

      {/* Orbiting AI Nodes */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${angle}deg) translate(180px) rotate(-${angle}deg)`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
