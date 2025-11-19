import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormPaginationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  stepTitles?: string[];
}

export function FormPagination({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
  stepTitles = [],
}: FormPaginationProps) {
  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{
              scale: currentStep === index + 1 ? 1.2 : 1,
              opacity: currentStep === index + 1 ? 1 : 0.5,
            }}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              currentStep === index + 1
                ? 'w-12 bg-gradient-to-r from-teal-500 to-emerald-500'
                : currentStep > index + 1
                ? 'w-8 bg-teal-400 dark:bg-teal-600'
                : 'w-2 bg-gray-300 dark:bg-gray-600'
            )}
          />
        ))}
      </div>

      {/* Step Title */}
      {stepTitles[currentStep - 1] && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep} of {totalSteps}
          </p>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-1">
            {stepTitles[currentStep - 1]}
          </h3>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 mt-8">
        <Button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious || currentStep === 1}
          variant="outline"
          size="lg"
          className="rounded-full h-14 w-14 p-0 border-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentStep === totalSteps ? 'Review & Submit' : 'Continue'}
          </p>
        </div>

        <Button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || currentStep === totalSteps}
          className="rounded-full h-14 w-14 p-0 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
}

// Animated step container
interface StepContainerProps {
  children: React.ReactNode;
  currentStep: number;
  stepNumber: number;
}

export function StepContainer({ children, currentStep, stepNumber }: StepContainerProps) {
  return (
    <AnimatePresence mode="wait">
      {currentStep === stepNumber && (
        <motion.div
          key={stepNumber}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
