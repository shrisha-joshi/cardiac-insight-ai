import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'teal' | 'emerald' | 'rose' | 'amber' | 'purple';
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'teal',
  delay = 0,
}: StatCardProps) {
  const colorConfig = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      text: 'text-blue-500',
      bg: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/20',
    },
    teal: {
      gradient: 'from-teal-500 to-emerald-500',
      text: 'text-teal-500',
      bg: 'from-teal-500/10 to-emerald-500/10',
      border: 'border-teal-500/20',
    },
    emerald: {
      gradient: 'from-emerald-500 to-teal-500',
      text: 'text-emerald-500',
      bg: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/20',
    },
    rose: {
      gradient: 'from-rose-500 to-pink-500',
      text: 'text-rose-500',
      bg: 'from-rose-500/10 to-pink-500/10',
      border: 'border-rose-500/20',
    },
    amber: {
      gradient: 'from-amber-500 to-orange-500',
      text: 'text-amber-500',
      bg: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
    },
    purple: {
      gradient: 'from-purple-500 to-pink-500',
      text: 'text-purple-500',
      bg: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/20',
    },
  };

  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className={`glass dark:glass-dark border ${config.border} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}>
        {/* Background gradient on hover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />

        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.2, type: 'spring' }}
                className="text-3xl font-black"
              >
                {value}
              </motion.div>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>

            {/* Icon with animated background */}
            <motion.div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
              animate={{
                boxShadow: [
                  '0 4px 15px rgba(20, 184, 166, 0.2)',
                  '0 6px 20px rgba(20, 184, 166, 0.4)',
                  '0 4px 15px rgba(20, 184, 166, 0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>
          </div>

          {/* Trend indicator */}
          {trend && trendValue && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={`font-medium ${
                  trend === 'up'
                    ? 'text-emerald-500'
                    : trend === 'down'
                    ? 'text-rose-500'
                    : 'text-muted-foreground'
                }`}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </CardContent>

        {/* Bottom accent line */}
        <motion.div
          className={`h-1 bg-gradient-to-r ${config.gradient}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: delay + 0.3 }}
        />
      </Card>
    </motion.div>
  );
}

interface StatsGridProps {
  children: ReactNode;
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {children}
    </div>
  );
}
