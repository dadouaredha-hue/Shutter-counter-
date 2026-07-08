import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface HealthGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function HealthGauge({ score, size = 160, strokeWidth = 8, className }: HealthGaugeProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStatusColor = (s: number) => {
    if (s > 70) return '#00FF66';
    if (s > 30) return '#FF8A00';
    return '#EF4444';
  };

  const color = getStatusColor(score);
  const textColorClass = score > 70 ? 'text-[#00FF66]' : score > 30 ? 'text-[#FF8A00]' : 'text-[#EF4444]';

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Pulsing Background Effects */}
      <motion.div
        className="absolute rounded-full"
        style={{ 
          width: size - strokeWidth * 2, 
          height: size - strokeWidth * 2,
          backgroundColor: `${color}15`,
        }}
        animate={{ 
          scale: [1, 1.2, 1.4],
          opacity: [0.5, 0.2, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />

      <motion.div
        className="absolute rounded-full border border-dashed"
        style={{ 
          width: size + 20, 
          height: size + 20,
          borderColor: `${color}30`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* SVG Progress Circle */}
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          style={{ strokeDasharray: circumference }}
          className="drop-shadow-[0_0_8px_currentColor]"
        />
      </svg>

      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center z-20">
        <span className={cn("text-3xl font-display font-bold cyber-text-glow", textColorClass)}>
          {Math.round(score)}%
        </span>
        <span className="text-[9px] font-mono tracking-widest text-zinc-400 mt-1 uppercase">Wear Level</span>
      </div>
    </div>
  );
}
