import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Heart } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  tier?: 'basic' | 'premium' | 'professional';
}

export function LoadingState({ message = 'Loading...', tier = 'premium' }: LoadingStateProps) {
  const gradients = {
    basic: 'from-blue-500 to-cyan-500',
    premium: 'from-teal-500 to-emerald-500',
    professional: 'from-purple-500 to-pink-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-teal-500/5 to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass dark:glass-dark border-border/50 shadow-2xl w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Animated heart icon */}
              <motion.div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradients[tier]} flex items-center justify-center shadow-2xl`}
                animate={{
                  boxShadow: [
                    '0 10px 30px rgba(20, 184, 166, 0.3)',
                    '0 20px 50px rgba(20, 184, 166, 0.6)',
                    '0 10px 30px rgba(20, 184, 166, 0.3)',
                  ],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Heart className="w-10 h-10 text-white" fill="white" />
                </motion.div>
              </motion.div>

              {/* Spinning loader */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-8 h-8 text-teal-500" />
              </motion.div>

              {/* Loading text */}
              <div className="text-center space-y-2">
                <motion.p
                  className="text-lg font-semibold"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {message}
                </motion.p>
                <p className="text-sm text-muted-foreground">Please wait a moment</p>
              </div>

              {/* Animated dots */}
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-teal-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Skeleton loader for content
export function SkeletonCard() {
  return (
    <Card className="glass dark:glass-dark border-border/50">
      <CardContent className="p-6 space-y-4">
        <motion.div
          className="h-4 bg-muted rounded animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="h-4 bg-muted rounded w-3/4 animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="h-4 bg-muted rounded w-1/2 animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
      </CardContent>
    </Card>
  );
}
