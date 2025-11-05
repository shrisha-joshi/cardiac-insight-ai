import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LucideIcon, Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function ActionButton({
  children,
  onClick,
  icon: Icon,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
}: ActionButtonProps) {
  const variants = {
    primary: {
      gradient: 'from-teal-500 to-emerald-500',
      hover: 'from-teal-600 to-emerald-600',
      shadow: 'shadow-teal-500/30',
      hoverShadow: 'hover:shadow-teal-500/50',
    },
    secondary: {
      gradient: 'from-blue-500 to-cyan-500',
      hover: 'from-blue-600 to-cyan-600',
      shadow: 'shadow-blue-500/30',
      hoverShadow: 'hover:shadow-blue-500/50',
    },
    success: {
      gradient: 'from-emerald-500 to-green-500',
      hover: 'from-emerald-600 to-green-600',
      shadow: 'shadow-emerald-500/30',
      hoverShadow: 'hover:shadow-emerald-500/50',
    },
    warning: {
      gradient: 'from-amber-500 to-orange-500',
      hover: 'from-amber-600 to-orange-600',
      shadow: 'shadow-amber-500/30',
      hoverShadow: 'hover:shadow-amber-500/50',
    },
    danger: {
      gradient: 'from-rose-500 to-red-500',
      hover: 'from-rose-600 to-red-600',
      shadow: 'shadow-rose-500/30',
      hoverShadow: 'hover:shadow-rose-500/50',
    },
  };

  const sizes = {
    sm: 'px-6 py-2 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-10 py-4 text-lg',
  };

  const config = variants[variant];

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={fullWidth ? 'w-full' : 'inline-block'}
    >
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          relative overflow-hidden font-semibold
          bg-gradient-to-r ${config.gradient} 
          hover:${config.hover}
          shadow-lg ${config.shadow} ${config.hoverShadow}
          transition-all duration-300
          border-0
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Shimmer effect */}
        {!disabled && !loading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        )}

        {/* Button content */}
        <span className="flex items-center justify-center gap-2 relative z-10">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            Icon && <Icon className="w-5 h-5" />
          )}
          {children}
        </span>
      </Button>
    </motion.div>
  );
}
