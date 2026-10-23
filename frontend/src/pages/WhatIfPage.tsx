// frontend/src/pages/WhatIfPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  Sparkles, 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Clock, 
  Film,
  Building2,
  User,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { api } from '../api/client';
import { MovieInput, WhatIfResponse, WhatIfItem } from '../types/api';

const DEFAULT_BASE_MOVIE: MovieInput = {
  title: 'Project Apex',
  budget: 50000000,
  genres: ['Science Fiction', 'Action'],
  release_date: '2026-05-15',
  runtime: 115,
  original_language: 'en',
  production_companies: ['Warner Bros.'],
  director: 'Denis Villeneuve',
  cast: ['Timothée Chalamet', 'Zendaya'],
  franchise: 0,
};

interface DimensionConfig {
  label: string;
  field: string;
  icon: any;
  description: string;
  candidateValues: { label: string; value: any }[];
}

const DIMENSIONS: DimensionConfig[] = [
  {
    label: 'Production Budget',
    field: 'budget',
    icon: DollarSign,
    description: 'Vary capital expenditure to find the optimal ROI sweet spot without overcapitalizing.',
    candidateValues: [
      { label: '$10M (Micro)', value: 10000000 },
      { label: '$25M (Low)', value: 25000000 },
      { label: '$50M (Mid)', value: 50000000 },
      { label: '$85M (High)', value: 85000000 },
      { label: '$130M (Studio)', value: 130000000 },
      { label: '$180M (Tentpole)', value: 180000000 },
      { label: '$250M (Mega)', value: 250000000 },
    ],
  },
  {
    label: 'Theatrical Release Month',
    field: 'release_date',
    icon: Calendar,
    description: 'Compare theatrical release windows across competitive seasonal corridors.',
    candidateValues: [
      { label: 'Jan (Winter Dump)', value: '2026-01-16' },
      { label: 'Feb (Valentine/Presidents)', value: '2026-02-13' },
      { label: 'May (Summer Kickoff)', value: '2026-05-08' },
      { label: 'Jul (Peak Summer)', value: '2026-07-17' },
      { label: 'Sep (Fall Slump)', value: '2026-09-18' },
      { label: 'Oct (Spooky Pre-Holiday)', value: '2026-10-16' },
      { label: 'Nov (Thanksgiving Corridor)', value: '2026-11-20' },
      { label: 'Dec (Holiday Corridor)', value: '2026-12-18' },
    ],
  },
  {
    label: 'Runtime Duration',
    field: 'runtime',
    icon: Clock,
    description: 'Assess how length affects daily theatrical screening turnover and pacing.',
    candidateValues: [
      { label: '85 min (Tight/Fast)', value: 85 },
      { label: '95 min (Standard)', value: 95 },
      { label: '110 min (Ideal Drama/Action)', value: 110 },
      { label: '125 min (Extended)', value: 125 },
      { label: '145 min (Epic Scope)', value: 145 },
      { label: '170 min (Marathon)', value: 170 },
    ],
  },
  {
    label: 'Franchise Continuity',
    field: 'franchise',
    icon: Film,
    description: 'Measure the commercial lift of an established IP sequel versus an original instalment.',
    candidateValues: [
      { label: 'Original Intellectual Property (0)', value: 0 },
      { label: 'Sequel / Later Franchise Instalment (1)', value: 1 },
    ],
  },
  {
    label: 'Studio Scale',
    field: 'production_companies',
    icon: Building2,
    description: 'Compare distribution and marketing clout between independent and major studios.',
    candidateValues: [
      { label: 'Independent / Boutique Studio', value: [] },
      { label: 'Warner Bros. Pictures', value: ['Warner Bros.'] },
      { label: 'Universal Pictures', value: ['Universal Pictures'] },
      { label: 'Walt Disney Pictures', value: ['Walt Disney Pictures'] },
      { label: 'Paramount Pictures', value: ['Paramount Pictures'] },
    ],
  },
  {
    label: 'Director Track Record',
    field: 'director',
    icon: User,
    description: 'Evaluate historical director box-office pedigree on greenlight probability.',
    candidateValues: [
      { label: 'First-time / Indie Debut (No History)', value: '' },
      { label: 'Denis Villeneuve', value: 'Denis Villeneuve' },
      { label: 'Christopher Nolan', value: 'Christopher Nolan' },
      { label: 'James Cameron', value: 'James Cameron' },
      { label: 'Steven Spielberg', value: 'Steven Spielberg' },
      { label: 'Ridley Scott', value: 'Ridley Scott' },
    ],
  },
];

export const WhatIfPage: React.FC = () => {
  const location = useLocation();
  const [baseMovie, setBaseMovie] = useState<MovieInput>(() => {
    return (location.state as any)?.movie || DEFAULT_BASE_MOVIE;
  });

  const [selectedDimension, setSelectedDimension] = useState<DimensionConfig>(DIMENSIONS[0]);
  const [simulation, setSimulation] = useState<WhatIfResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run simulation whenever dimension or baseMovie changes
  useEffect(() => {
    const runSimulation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const values = selectedDimension.candidateValues.map((c) => c.value);
        const res = await api.whatIf({
          movie: baseMovie,
          varying_field: selectedDimension.field,
          values: values,
        });
        setSimulation(res);
      } catch (err: any) {
        setError(err.message || 'Simulation execution failed');
      } finally {
        setIsLoading(false);
      }
    };

    runSimulation();
  }, [selectedDimension, baseMovie]);

  // Format chart items
  const chartData = simulation
    ? simulation.results.map((r, idx) => {
        const candidateMeta = selectedDimension.candidateValues[idx];
        const isBase =
          JSON.stringify(r.value) === JSON.stringify((baseMovie as any)[selectedDimension.field]);
        return {
          name: candidateMeta?.label || String(r.value),
          probability: Math.round(r.hit_probability * 100),
          delta: (r.delta_vs_base * 100).toFixed(1),
          label: r.label,
          isBase,
        };
      })
    : [];

  const basePct = simulation ? Math.round(simulation.base_hit_probability * 100) : 50;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
            <Sliders className="w-3.5 h-3.5" />
            <span>Sensitivity Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-display mt-1">
            Counterfactual What-If Simulator
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Isolate and vary a single production variable while holding all other movie characteristics constant to observe marginal changes in commercial hit probability.
          </p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Predictor</span>
        </Link>
      </div>

      {/* Base Movie Snapshot Card */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Simulation Baseline
            </span>
            <span className="text-sm font-bold text-zinc-100 font-display">
              {baseMovie.title || 'Baseline Project'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono text-zinc-400">
            <span>Budget: ${(baseMovie.budget / 1_000_000).toFixed(1)}M</span>
            <span>•</span>
            <span>Genres: {baseMovie.genres?.join(', ') || 'N/A'}</span>
            <span>•</span>
            <span>Date: {baseMovie.release_date}</span>
            <span>•</span>
            <span>Dir: {baseMovie.director || 'None'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Baseline Hit Prob</span>
            <span className="text-xl font-extrabold text-amber-400 font-display">
              {basePct}%
            </span>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${
              basePct >= 50
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {basePct >= 50 ? 'Hit' : 'Flop'}
          </span>
        </div>
      </div>

      {/* Dimension Selector Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          Select Variable Dimension to Manipulate
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {DIMENSIONS.map((dim) => {
            const isSelected = selectedDimension.field === dim.field;
            const Icon = dim.icon;
            return (
              <button
                key={dim.field}
                type="button"
                onClick={() => setSelectedDimension(dim)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`} />
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <span className="text-xs font-bold leading-tight">{dim.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-400 italic pt-1">{selectedDimension.description}</p>
      </div>

      {/* Main Simulation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Interactive Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 font-display flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Sensitivity Response Curve</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Amber bar = baseline film configuration
            </span>
          </div>

          {isLoading ? (
            <div className="h-72 flex items-center justify-center text-xs text-zinc-500 font-mono animate-pulse">
              Running counterfactual inference across parameter grid...
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-900/95 shadow-xl text-xs space-y-1">
                            <span className="font-bold text-zinc-100 block">{data.name}</span>
                            <div className="font-mono text-amber-400">
                              Hit Probability: <strong>{data.probability}%</strong> ({data.label})
                            </div>
                            <div className="font-mono text-zinc-400">
                              Delta vs Baseline: {Number(data.delta) >= 0 ? `+${data.delta}%` : `${data.delta}%`}
                            </div>
                            {data.isBase && (
                              <span className="text-[10px] text-amber-300 font-bold block pt-0.5">
                                ★ Current Baseline Value
                              </span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: '50% Hit Cutoff', fill: '#ef4444', fontSize: 10, position: 'right' }}
                  />
                  <ReferenceLine
                    y={basePct}
                    stroke="#f59e0b"
                    strokeDasharray="2 2"
                    label={{ value: `Base (${basePct}%)`, fill: '#f59e0b', fontSize: 10, position: 'left' }}
                  />
                  <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isBase
                            ? '#f59e0b' // Amber for base
                            : entry.probability >= 50
                            ? '#10b981' // Emerald for hit
                            : '#71717a' // Zinc for flop
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-xs text-zinc-500">
              No simulation results.
            </div>
          )}
        </div>

        {/* Detailed Breakdown Table (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-zinc-200 font-display">
            Scenario Evaluation Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase">
                <tr>
                  <th className="pb-2">Candidate Option</th>
                  <th className="pb-2 text-right">Hit Prob</th>
                  <th className="pb-2 text-right">&Delta; vs Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {simulation?.results.map((r, idx) => {
                  const meta = selectedDimension.candidateValues[idx];
                  const deltaPct = (r.delta_vs_base * 100).toFixed(1);
                  const isPositive = r.delta_vs_base > 0;
                  const isBase =
                    JSON.stringify(r.value) ===
                    JSON.stringify((baseMovie as any)[selectedDimension.field]);

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        isBase ? 'bg-amber-500/10 font-bold' : ''
                      }`}
                    >
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          {isBase && <span className="text-amber-400 text-xs">★</span>}
                          <span className={isBase ? 'text-amber-300' : 'text-zinc-300'}>
                            {meta?.label || String(r.value)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-bold">
                        <span
                          className={
                            r.hit_probability >= 0.5 ? 'text-emerald-400' : 'text-zinc-400'
                          }
                        >
                          {Math.round(r.hit_probability * 100)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {isBase ? (
                          <span className="text-zinc-500">Baseline</span>
                        ) : (
                          <span
                            className={`flex items-center justify-end gap-0.5 ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {isPositive ? `+${deltaPct}%` : `${deltaPct}%`}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Strategic Insight Takeaway */}
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-1.5 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              Strategic Takeaway
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Varying <strong>{selectedDimension.label}</strong> demonstrates how capital allocation and release window timing directly adjust the risk profile without altering source material.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
