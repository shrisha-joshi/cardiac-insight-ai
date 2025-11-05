import { motion } from 'framer-motion';
import { HealthSimulationDashboard } from '@/components/ui/health-simulation-dashboard';
import { AIConfidenceMeter } from '@/components/ui/ai-confidence-meter';
import { EmergencyPrepCard } from '@/components/ui/emergency-prep-card';
import { Activity, Brain, Heart, TrendingUp } from 'lucide-react';

export default function HealthSimulationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-teal-500/5">
      {/* Header Section */}
      <motion.div
        className="container mx-auto px-4 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Activity className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
              Real-time Health Monitoring
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Health Simulation
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience a living dashboard with real-time simulated health metrics powered by AI
          </p>
        </div>

        {/* Main Health Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-12"
        >
          <HealthSimulationDashboard />
        </motion.div>

        {/* AI Confidence & Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* AI Confidence Meter */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="glass dark:glass-dark rounded-2xl border border-teal-500/20 p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-5 h-5 text-teal-500" />
                <h3 className="text-lg font-bold">AI Analysis Confidence</h3>
              </div>
              <AIConfidenceMeter confidence={92.8} />
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Model Accuracy</span>
                  <span className="font-bold text-emerald-500">98.2%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Points Analyzed</span>
                  <span className="font-bold">12,458</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Processing Time</span>
                  <span className="font-bold text-teal-500">~0.3s</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-4"
          >
            <div className="glass dark:glass-dark rounded-xl border border-teal-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <Heart className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Cardiovascular Health Score</h4>
                  <p className="text-xs text-muted-foreground">Based on 14 vital indicators</p>
                </div>
                <div className="text-2xl font-black text-emerald-500">8.7/10</div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: '87%' }}
                  transition={{ delay: 0.8, duration: 1 }}
                />
              </div>
            </div>

            <div className="glass dark:glass-dark rounded-xl border border-teal-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Risk Prediction Accuracy</h4>
                  <p className="text-xs text-muted-foreground">Validated against clinical data</p>
                </div>
                <div className="text-2xl font-black text-teal-500">94%</div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: '94%' }}
                  transition={{ delay: 1, duration: 1 }}
                />
              </div>
            </div>

            <div className="glass dark:glass-dark rounded-xl border border-teal-500/20 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Neural Network Depth</h4>
                  <p className="text-xs text-muted-foreground">Multi-layer analysis</p>
                </div>
                <div className="text-2xl font-black text-blue-500">7 Layers</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Emergency Preparedness */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <EmergencyPrepCard />
        </motion.div>
      </motion.div>
    </div>
  );
}
