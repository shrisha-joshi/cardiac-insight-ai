import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export function MedicalFloatingParticles() {
  const ref = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const { scrollYProgress } = useScroll();
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 0.8, 0.4, 0.2]);

  useEffect(() => {
    // Generate particles like blood cells
    const newParticles: Particle[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2, // 2-6px
      duration: Math.random() * 15 + 10, // 10-25s
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <motion.div
      ref={ref}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Soft glow filter */}
          <filter id="particle-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for particles */}
          <radialGradient id="particle-gradient">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
          </radialGradient>
        </defs>

        {particles.map((particle) => (
          <motion.g key={particle.id}>
            {/* Main particle (blood cell shape - slightly elongated) */}
            <motion.ellipse
              cx={`${particle.x}%`}
              cy={`${particle.y}%`}
              rx={particle.size}
              ry={particle.size * 0.7}
              fill="url(#particle-gradient)"
              filter="url(#particle-glow)"
              initial={{
                x: 0,
                y: 0,
                rotate: Math.random() * 360,
              }}
              animate={{
                x: [0, Math.random() * 50 - 25, Math.random() * 50 - 25, 0],
                y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
                rotate: [
                  Math.random() * 360,
                  Math.random() * 360,
                  Math.random() * 360,
                  Math.random() * 360,
                ],
                opacity: [0.3, 0.7, 0.5, 0.3],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Particle trail/glow */}
            <motion.circle
              cx={`${particle.x}%`}
              cy={`${particle.y}%`}
              r={particle.size * 1.5}
              fill="#14B8A6"
              opacity="0.1"
              filter="url(#particle-glow)"
              animate={{
                x: [0, Math.random() * 50 - 25, Math.random() * 50 - 25, 0],
                y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
                scale: [1, 1.3, 1.1, 1],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.g>
        ))}

        {/* Occasional pulse waves */}
        {[...Array(5)].map((_, i) => (
          <motion.circle
            key={`pulse-${i}`}
            cx="50%"
            cy="50%"
            r="20"
            fill="none"
            stroke="#14B8A6"
            strokeWidth="1"
            strokeOpacity="0.3"
            initial={{ r: 20, opacity: 0.3 }}
            animate={{
              r: [20, 200],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 4,
              delay: i * 2.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
}
