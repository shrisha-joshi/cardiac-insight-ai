import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function NeuralBackgroundMesh() {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();

  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.15, 0.05]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={ref}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="cursor-glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid Lines */}
        {[...Array(12)].map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={`${(i * 100) / 12}%`}
            y1="0%"
            x2={`${(i * 100) / 12}%`}
            y2="100%"
            stroke="#14B8A6"
            strokeWidth="1"
            strokeOpacity="0.1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: i * 0.1 }}
          />
        ))}

        {[...Array(8)].map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1="0%"
            y1={`${(i * 100) / 8}%`}
            x2="100%"
            y2={`${(i * 100) / 8}%`}
            stroke="#14B8A6"
            strokeWidth="1"
            strokeOpacity="0.1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: i * 0.1 }}
          />
        ))}

        {/* Neural Connection Lines */}
        {[...Array(20)].map((_, i) => {
          const x1 = Math.random() * 100;
          const y1 = Math.random() * 100;
          const x2 = Math.random() * 100;
          const y2 = Math.random() * 100;

          return (
            <motion.line
              key={`neural-${i}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="url(#neural-gradient)"
              strokeWidth="1"
              strokeOpacity="0.2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
              transition={{
                duration: 4,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          );
        })}

        {/* Neural Nodes */}
        {[...Array(30)].map((_, i) => {
          const cx = Math.random() * 100;
          const cy = Math.random() * 100;

          return (
            <motion.circle
              key={`node-${i}`}
              cx={`${cx}%`}
              cy={`${cy}%`}
              r="2"
              fill="#14B8A6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
          );
        })}

        {/* Cursor Glow Effect */}
        <motion.circle
          cx={mousePosition.x}
          cy={mousePosition.y}
          r="100"
          fill="url(#cursor-glow)"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />

        <defs>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0" />
            <stop offset="50%" stopColor="#14B8A6" stopOpacity="1" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
