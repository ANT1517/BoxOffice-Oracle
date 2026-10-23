// frontend/src/components/FactorCard.tsx
import React from 'react';
import { FactorContribution } from '../types/api';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface FactorCardProps {
  factors: FactorContribution[];
}

const FEATURE_NAMES: Record<string, string> = {
  log_budget: 'Production Budget',
  budget: 'Production Budget',
  cast_avg_past_revenue: 'Cast Star Power (Historical)',
  cast_star_power: 'Cast Star Power (Historical)',
  dir_avg_past_revenue: 'Director Historical Revenue',
  dir_star_power: 'Director Track Record',
  franchise: 'Franchise / Sequel Status',
  genre_target_enc: 'Genre Historical Profitability',
  runtime: 'Film Runtime',
  release_month: 'Release Timing (Month)',
  season: 'Theatrical Season',
  big_studio: 'Major Studio Backing',
  vote_average: 'Audience Rating (Post-Release)',
  vote_count: 'Audience Engagement Count',
  popularity: 'TMDb Popularity Metric',
};

function formatValue(key: string, val: any): string {
  if (val === undefined || val === null) return 'N/A';
  if (typeof val === 'number') {
    if (key.includes('budget') || key.includes('revenue')) {
      if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
      return `$${val.toLocaleString()}`;
    }
    if (key === 'runtime') return `${Math.round(val)} min`;
    if (key === 'franchise' || key === 'big_studio') return val === 1 ? 'Yes' : 'No';
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toFixed(2);
  }
  return String(val);
}

export const FactorCard: React.FC<FactorCardProps> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center text-xs text-zinc-500">
        No factor contributions available for this evaluation.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono flex items-center gap-1.5">
          Key Drivers of Prediction
        </h4>
        <span className="text-[11px] text-zinc-400 italic">
          Compared with a typical film (median value)
        </span>
      </div>

      <div className="space-y-2.5">
        {factors.map((f, idx) => {
          const isPositive = f.impact === 'positive' || f.delta_probability > 0;
          const deltaPct = (Math.abs(f.delta_probability) * 100).toFixed(1);
          const friendlyName = FEATURE_NAMES[f.feature] || f.feature.replace(/_/g, ' ');
          const formattedCurrent = formatValue(f.feature, f.current_value);
          const formattedRef = formatValue(f.feature, f.reference_value);

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all ${
                isPositive
                  ? 'border-emerald-500/20 bg-emerald-950/15 hover:border-emerald-500/40'
                  : 'border-rose-500/20 bg-rose-950/15 hover:border-rose-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 p-1 rounded-md ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200">
                      {friendlyName}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {isPositive ? 'Adds' : 'Subtracts'}{' '}
                      <span className={isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {isPositive ? `+${deltaPct}%` : `-${deltaPct}%`}
                      </span>{' '}
                      hit probability compared with a typical film (median value).
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono text-zinc-300">
                    Input: <span className="font-semibold text-zinc-100">{formattedCurrent}</span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    Typical: {formattedRef}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
