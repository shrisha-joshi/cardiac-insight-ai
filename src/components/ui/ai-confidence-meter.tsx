import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AIConfidenceMeterProps {
  confidence?: number;
}

export function AIConfidenceMeter({ confidence = 92.8 }: AIConfidenceMeterProps) {
  const [displayConfidence, setDisplayConfidence] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 0.8;
        if (current >= confidence) {
          setDisplayConfidence(confidence);
          clearInterval(interval);
        } else {
          setDisplayConfidence(current);
        }
      }, 10);
      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [confidence]);

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (displayConfidence / 100) * circumference;

  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Outer Glow Ring */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        animate={{
          boxShadow: [
            '0 0 20px rgba(13, 148, 136, 0.3)',
            '0 0 40px rgba(13, 148, 136, 0.5)',
            '0 0 20px rgba(13, 148, 136, 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Main SVG */}
      <svg className="relative z-10 transform -rotate-90" width="192" height="192">
        {/* Background Circle */}
        <circle
          cx="96"
          cy="96"
          r="70"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/20"
        />

        {/* Progress Circle */}
        <motion.circle
          cx="96"
          cy="96"
          r="70"
          fill="none"
          stroke="url(#confidence-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Micro-pulse dots */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const radian = ((angle - 90) * Math.PI) / 180;
          const x = 96 + 70 * Math.cos(radian);
          const y = 96 + 70 * Math.sin(radian);
          
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#14B8A6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: displayConfidence >= (angle / 360) * 100 ? [1, 1.5, 1] : 0,
                opacity: displayConfidence >= (angle / 360) * 100 ? [0.6, 1, 0.6] : 0,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          );
        })}

        <defs>
          <linearGradient id="confidence-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-xs font-medium text-muted-foreground mb-1">AI Confidence</div>
          <div className="text-3xl font-black bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
            {displayConfidence.toFixed(1)}%
          </div>
          <motion.div
            className="flex items-center justify-center gap-1 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-500 font-medium">High</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Rotating Pulse Effect */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-teal-500/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <motion.div
          className="absolute top-0 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-teal-500 shadow-lg shadow-teal-500/50"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
}
