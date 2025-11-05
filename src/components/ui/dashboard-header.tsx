import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, Star, Brain } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardHeaderProps {
  tier: 'basic' | 'premium' | 'professional';
  title: string;
  description: string;
  icon: ReactNode;
  titleClassName?: string;
}

export function DashboardHeader({ tier, title, description, icon, titleClassName }: DashboardHeaderProps) {
  const tierConfig = {
    basic: {
      badge: { text: 'Free Tier', icon: Star, gradient: 'from-blue-500 to-cyan-500' },
      titleGradient: 'from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400',
      bgGradient: 'from-blue-500/10 via-transparent to-cyan-500/10',
    },
    premium: {
      badge: { text: 'Premium', icon: Crown, gradient: 'from-teal-500 to-emerald-500' },
      titleGradient: 'from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400',
      bgGradient: 'from-teal-500/10 via-transparent to-emerald-500/10',
    },
    professional: {
      badge: { text: 'Professional', icon: Brain, gradient: 'from-purple-500 to-pink-500' },
      titleGradient: 'from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400',
      bgGradient: 'from-purple-500/10 via-transparent to-pink-500/10',
    },
  };

  const config = tierConfig[tier];
  const BadgeIcon = config.badge.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl glass dark:glass-dark border border-border/50 mb-8">
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`} />
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            {/* Animated Icon */}
            <motion.div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${config.badge.gradient} flex items-center justify-center shadow-2xl`}
              animate={{
                boxShadow: [
                  '0 10px 30px rgba(20, 184, 166, 0.3)',
                  '0 15px 40px rgba(20, 184, 166, 0.5)',
                  '0 10px 30px rgba(20, 184, 166, 0.3)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {icon}
              </motion.div>
            </motion.div>

            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-3"
              >
                <Badge className={`bg-gradient-to-r ${config.badge.gradient} text-white border-0 shadow-lg px-4 py-1`}>
                  <BadgeIcon className="w-3 h-3 mr-2" />
                  {config.badge.text}
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-3xl md:text-4xl lg:text-5xl font-black mb-3 bg-gradient-to-r ${config.titleGradient} bg-clip-text text-transparent`}
              >
                {title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base md:text-lg text-muted-foreground max-w-2xl"
              >
                {description}
              </motion.p>
            </div>
          </div>

          {/* Premium Features Badge (for premium+ tiers) */}
          {tier !== 'basic' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-teal-500" />
                <span>Advanced Features Enabled</span>
              </div>
              {tier === 'professional' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span>Clinical Tools Available</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom glow line */}
      <motion.div
        className={`h-1 bg-gradient-to-r ${config.badge.gradient}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </div>
  );
}
