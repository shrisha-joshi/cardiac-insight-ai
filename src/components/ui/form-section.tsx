import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
  delay?: number;
  accent?: 'blue' | 'teal' | 'emerald' | 'rose' | 'purple' | 'amber';
}

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
  delay = 0,
  accent = 'teal',
}: FormSectionProps) {
  const accentColors = {
    blue: 'text-blue-500',
    teal: 'text-teal-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    purple: 'text-purple-500',
    amber: 'text-amber-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <Card className="glass dark:glass-dark border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className={`p-2 rounded-lg bg-${accent}-500/10 border border-${accent}-500/20`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon className={`w-5 h-5 ${accentColors[accent]}`} />
            </motion.div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          </div>
          {description && (
            <CardDescription className="text-base">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

interface FormFieldGroupProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}

export function FormFieldGroup({ children, columns = 2 }: FormFieldGroupProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return <div className={`grid ${gridCols[columns]} gap-6`}>{children}</div>;
}
