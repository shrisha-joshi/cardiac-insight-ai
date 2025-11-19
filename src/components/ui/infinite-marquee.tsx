import { motion } from "framer-motion";
import { Activity, Shield, Zap, Brain, CheckCircle2, Database, Lock, HeartPulse } from "lucide-react";

const items = [
  { icon: Activity, text: "98.5% Prediction Accuracy" },
  { icon: Shield, text: "HIPAA-Compliant Security" },
  { icon: Brain, text: "Advanced Neural Networks" },
  { icon: Zap, text: "Real-time Analysis" },
  { icon: Database, text: "Encrypted Data Storage" },
  { icon: CheckCircle2, text: "Clinically Validated Models" },
  { icon: Lock, text: "Private & Secure" },
  { icon: HeartPulse, text: "Early Warning System" },
];

export function InfiniteMarquee() {
  return (
    <div className="relative flex overflow-hidden py-6 sm:py-8 bg-muted/30 dark:bg-white/5 border-y border-teal-500/10 backdrop-blur-sm">
      {/* Fade gradients on sides */}
      <div className="absolute inset-y-0 left-0 z-10 w-20 sm:w-40 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 z-10 w-20 sm:w-40 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
      
      <motion.div
        className="flex gap-16 sm:gap-32 items-center whitespace-nowrap will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 45,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {/* Duplicate items 4 times to ensure smooth scrolling on wide screens */}
        {[...items, ...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 group cursor-default">
            <div className="p-2 rounded-full bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-500" />
            </div>
            <span className="text-sm sm:text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {item.text}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
