import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface CountUpStatsProps {
  value: string;
  duration?: number;
  className?: string;
}

export function CountUpStats({ value, duration = 2, className }: CountUpStatsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState("0");

  // Improved parsing to handle cases like "24/7" correctly
  const match = value.match(/(\d+(\.\d+)?)/);
  const numberStr = match ? match[0] : "";
  const numericValue = parseFloat(numberStr || "0");
  const startIndex = value.indexOf(numberStr);
  
  const prefix = startIndex > -1 ? value.substring(0, startIndex) : "";
  const suffix = startIndex > -1 ? value.substring(startIndex + numberStr.length) : value;
  const isFloat = numberStr.includes(".");

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      let animationFrame: number;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Ease out quart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        const current = numericValue * easeProgress;
        
        const formattedNumber = isFloat 
          ? current.toFixed(1) 
          : Math.floor(current).toString();

        setDisplayValue(`${prefix}${formattedNumber}${suffix}`);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, value, duration, numericValue, suffix, prefix]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
