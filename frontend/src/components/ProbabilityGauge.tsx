// frontend/src/components/ProbabilityGauge.tsx
import React from 'react';

interface ProbabilityGaugeProps {
  probability: number; // 0.0 to 1.0
  label: 'Hit' | 'Flop';
  riskTier: string;
  size?: number;
}

export const ProbabilityGauge: React.FC<ProbabilityGaugeProps> = ({
  probability,
  label,
  riskTier,
  size = 200,
}) => {
  const percentage = Math.round(probability * 100);

  // SVG arc calculation
  // Radius and stroke width
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  
  // Semicircle perimeter (pi * r)
  const arcLength = Math.PI * radius;
  // Stroke dashoffset corresponding to probability (from 0 to 180 degrees)
  const strokeDashoffset = arcLength * (1 - probability);

  // Determine color theme based on probability
  const getColorStyles = () => {
    if (probability >= 0.75) {
      return {
        text: 'text-emerald-400',
        stroke: '#10b981',
        bgStroke: 'rgba(16, 185, 129, 0.15)',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        glow: 'glow-emerald',
      };
    } else if (probability >= 0.60) {
      return {
        text: 'text-teal-400',
        stroke: '#14b8a6',
        bgStroke: 'rgba(20, 184, 166, 0.15)',
        badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
        glow: '',
      };
    } else if (probability >= 0.45) {
      return {
        text: 'text-amber-400',
        stroke: '#f59e0b',
        bgStroke: 'rgba(245, 158, 11, 0.15)',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        glow: 'glow-amber',
      };
    } else if (probability >= 0.30) {
      return {
        text: 'text-orange-400',
        stroke: '#f97316',
        bgStroke: 'rgba(249, 115, 22, 0.15)',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        glow: '',
      };
    } else {
      return {
        text: 'text-rose-400',
        stroke: '#f43f5e',
        bgStroke: 'rgba(244, 63, 94, 0.15)',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        glow: 'glow-rose',
      };
    }
  };

  const theme = getColorStyles();

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size / 2 + 30 }}>
        <svg
          width={size}
          height={size / 2 + 20}
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
          className="overflow-visible"
        >
          {/* Background track arc (180 to 360 deg) */}
          <path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
            fill="none"
            stroke={theme.bgStroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active probability arc */}
          <path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className={`text-4xl font-extrabold tracking-tight font-display ${theme.text}`}>
            {percentage}%
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-0.5">
            Hit Probability
          </span>
        </div>
      </div>

      {/* Label and Risk Tier Badges */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${theme.badge} ${theme.glow}`}
          >
            {label} Expected
          </span>
        </div>
        <p className="text-xs font-medium text-zinc-300 dark:text-zinc-400 text-center">
          Tier: <span className="text-zinc-100 font-semibold">{riskTier}</span>
        </p>
      </div>
    </div>
  );
};
