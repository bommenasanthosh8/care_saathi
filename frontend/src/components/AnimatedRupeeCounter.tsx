import React, { useEffect, useState, useRef } from 'react';

export interface AnimatedRupeeCounterProps {
  value: number;
  prefix?: string;
  duration?: number; // milliseconds
  freeSubsidizedText?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedRupeeCounter: React.FC<AnimatedRupeeCounterProps> = ({
  value,
  prefix = '₹',
  duration = 1200,
  freeSubsidizedText,
  className = '',
  style = {}
}) => {
  // Check reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [displayValue, setDisplayValue] = useState<number>(() => prefersReducedMotion ? value : 0);
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    if (value === 0 && freeSubsidizedText) {
      setDisplayValue(0);
      prevValueRef.current = 0;
      return;
    }

    if (prefersReducedMotion) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = value;
    const change = endVal - startVal;

    if (change === 0) {
      setDisplayValue(endVal);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = Math.round(startVal + change * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(Math.round(endVal));
        prevValueRef.current = Math.round(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, prefersReducedMotion, freeSubsidizedText]);

  if (value === 0 && freeSubsidizedText) {
    return (
      <span className={className} style={style}>
        {freeSubsidizedText}
      </span>
    );
  }

  const formatted = Math.round(displayValue).toLocaleString('en-IN');

  return (
    <span 
      className={`rupee-counter-active ${className}`} 
      style={{ 
        fontVariantNumeric: 'tabular-nums',
        ...style 
      }}
    >
      {prefix}{formatted}
    </span>
  );
};
