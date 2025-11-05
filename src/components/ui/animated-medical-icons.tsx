import { motion } from 'framer-motion';

export function HeartbeatAnimation() {
  return (
    <svg
      width="200"
      height="60"
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <motion.path
        d="M0 30 L40 30 L50 10 L60 50 L70 30 L200 30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 2, ease: 'easeInOut', repeat: Infinity },
          opacity: { duration: 0.5 },
        }}
        className="text-teal-500"
      />
    </svg>
  );
}

export function HeartPulse() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 2.4,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
      className="relative"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-red-500"
      >
        <motion.path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          fill="currentColor"
          animate={{
            fill: ['#ef4444', '#dc2626', '#ef4444'],
          }}
          transition={{
            duration: 2.4,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        />
      </svg>
    </motion.div>
  );
}

export function DNAWave() {
  return (
    <svg
      width="100%"
      height="100"
      viewBox="0 0 1200 100"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 w-full opacity-10"
    >
      <motion.path
        d="M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="text-teal-500"
        animate={{
          d: [
            'M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50',
            'M0,50 Q150,80 300,50 T600,50 T900,50 T1200,50',
            'M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50',
          ],
        }}
        transition={{
          duration: 4,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
      <motion.path
        d="M0,50 Q150,80 300,50 T600,50 T900,50 T1200,50"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="text-cyan-400"
        animate={{
          d: [
            'M0,50 Q150,80 300,50 T600,50 T900,50 T1200,50',
            'M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50',
            'M0,50 Q150,80 300,50 T600,50 T900,50 T1200,50',
          ],
        }}
        transition={{
          duration: 4,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
    </svg>
  );
}

export function ParticleBackground() {
  const particles = Array.from({ length: 20 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-teal-500/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export function MedicalShieldIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M32 4L8 14V28C8 42 18 54 32 60C46 54 56 42 56 28V14L32 4Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="text-teal-500"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      <motion.path
        d="M32 20V40M22 30H42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-teal-600"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: 'easeInOut' }}
      />
    </svg>
  );
}

export function AIChipIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.rect
        x="16"
        y="16"
        width="32"
        height="32"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        className="text-cyan-500"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <motion.circle
        cx="32"
        cy="32"
        r="8"
        fill="currentColor"
        className="text-cyan-400"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {[0, 1, 2, 3].map((i) => (
        <motion.line
          key={i}
          x1={i % 2 === 0 ? '16' : '48'}
          y1={i < 2 ? '24' : '40'}
          x2={i % 2 === 0 ? '8' : '56'}
          y2={i < 2 ? '24' : '40'}
          stroke="currentColor"
          strokeWidth="2"
          className="text-cyan-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
        />
      ))}
    </svg>
  );
}

export function WaveformBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="wave"
          x="0"
          y="0"
          width="100"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <motion.path
            d="M0,25 Q12.5,10 25,25 T50,25 T75,25 T100,25"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className="text-teal-500"
            animate={{
              d: [
                'M0,25 Q12.5,10 25,25 T50,25 T75,25 T100,25',
                'M0,25 Q12.5,40 25,25 T50,25 T75,25 T100,25',
                'M0,25 Q12.5,10 25,25 T50,25 T75,25 T100,25',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wave)" />
    </svg>
  );
}
