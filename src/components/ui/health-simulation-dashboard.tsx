import { motion } from 'framer-motion';
import { Activity, Droplets, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export function HealthSimulationDashboard() {
  const [heartRate, setHeartRate] = useState(78);
  const [showHydrationTip, setShowHydrationTip] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate realistic heart rate fluctuation (75-82 BPM)
      setHeartRate(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newRate = prev + change;
        return Math.max(75, Math.min(82, newRate));
      });
    }, 1500);

    // Show hydration tip after 5 seconds
    const tipTimer = setTimeout(() => setShowHydrationTip(true), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(tipTimer);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass dark:glass-dark rounded-2xl border border-teal-500/20 p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Activity className="w-5 h-5 text-teal-500" />
          </motion.div>
          <h3 className="text-lg font-bold">Real-time Health Simulation</h3>
          <motion.div
            className="ml-auto px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs font-medium text-teal-500">● LIVE</span>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Heart Rate Ticker */}
          <motion.div
            className="glass dark:glass-dark rounded-xl p-4 border border-teal-500/10"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-medium text-muted-foreground">Heart Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={heartRate}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent"
              >
                {heartRate}
              </motion.span>
              <span className="text-sm text-muted-foreground">BPM</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                  animate={{ width: `${((heartRate - 60) / 40) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </div>
          </motion.div>

          {/* Blood Pressure */}
          <motion.div
            className="glass dark:glass-dark rounded-xl p-4 border border-teal-500/10"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground">Blood Pressure</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                120/80
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <motion.div
                className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-xs font-medium text-emerald-500">Normal Range ✓</span>
              </motion.div>
            </div>
          </motion.div>

          {/* AI Suggestion */}
          <motion.div
            className="glass dark:glass-dark rounded-xl p-4 border border-teal-500/10 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: showHydrationTip ? 1 : 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">AI Insight</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: showHydrationTip ? 1 : 0, y: showHydrationTip ? 0 : 10 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs leading-relaxed text-foreground">
                Hydration level optimal — maintain intake 💧
              </p>
              <motion.div
                className="absolute -bottom-1 -right-1 w-20 h-20 bg-blue-500/5 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Activity Indicator */}
        <motion.div
          className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-teal-500"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span>Monitoring vital signs...</span>
        </motion.div>
      </div>
    </div>
  );
}
