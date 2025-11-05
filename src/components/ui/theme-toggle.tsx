import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative w-10 h-10 rounded-full overflow-hidden"
      >
        <motion.div
          initial={false}
          animate={{
            rotate: theme === 'dark' ? 180 : 0,
            scale: theme === 'dark' ? 0 : 1,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="h-5 w-5 text-yellow-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            rotate: theme === 'light' ? 180 : 0,
            scale: theme === 'light' ? 0 : 1,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="h-5 w-5 text-blue-400" />
        </motion.div>
      </Button>
    </motion.div>
  );
}
