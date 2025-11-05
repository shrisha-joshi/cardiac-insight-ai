import { motion } from 'framer-motion';
import { AlertTriangle, Heart, Phone, Shield } from 'lucide-react';
import { Card } from './card';

export function EmergencyPrepCard() {
  return (
    <Card className="glass dark:glass-dark border-rose-500/20 p-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />

      {/* Pulsing alert indicator */}
      <motion.div
        className="absolute top-4 right-4"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
      </motion.div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <Shield className="w-6 h-6 text-rose-500" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              Emergency Preparedness
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-sm text-muted-foreground">Your safety is our priority</p>
          </div>
        </div>

        {/* Steps during chest pain */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm font-bold text-rose-500">
              1
            </div>
            <div>
              <p className="font-semibold text-sm">Stop all activity immediately</p>
              <p className="text-xs text-muted-foreground">Sit or lie down in a comfortable position</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm font-bold text-rose-500">
              2
            </div>
            <div>
              <p className="font-semibold text-sm">Take prescribed medication</p>
              <p className="text-xs text-muted-foreground">
                If you have nitroglycerin, take as directed
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm font-bold text-rose-500">
              3
            </div>
            <div>
              <p className="font-semibold text-sm">Call emergency services</p>
              <p className="text-xs text-muted-foreground">
                Don't wait - call immediately if symptoms persist
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Call Button */}
        <motion.button
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold flex items-center justify-center gap-3 shadow-2xl shadow-rose-500/30 border border-rose-400/50"
          whileHover={{ scale: 1.02, boxShadow: '0 20px 50px rgba(244, 63, 94, 0.4)' }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Phone className="w-5 h-5" />
          </motion.div>
          <span>Quick Dial Emergency (911)</span>
        </motion.button>

        {/* Warning signs */}
        <div className="mt-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <Heart className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                Warning Signs:
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chest discomfort, shortness of breath, nausea, cold sweat, pain radiating to
                arms/jaw/back, lightheadedness
              </p>
            </div>
          </div>
        </div>

        {/* Trust badge */}
        <motion.div
          className="mt-4 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-teal-500" />
            Verified by medical professionals
          </span>
        </motion.div>
      </div>
    </Card>
  );
}
