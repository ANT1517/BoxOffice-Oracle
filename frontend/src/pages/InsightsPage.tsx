// frontend/src/pages/InsightsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Layers, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  Filter, 
  Play, 
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  ReferenceLine,
  Line,
  ComposedChart
} from 'recharts';
import { api } from '../api/client';
import { EDAResponse, OlapQueryRequest, OlapQueryResponse } from '../types/api';

const PRESET_OPERATIONS = [
  {
    key: 'drilldown',
    title: 'Drilldown',
    description: 'Genre × Season breakdown',
    req: {
      dimensions: ['primary_genre', 'season'],
      measures: ['count', 'hit_rate', 'median_roi'],
    },
  },
  {
    key: 'slice',
    title: 'Slice',
    description: 'Horror films across budget tiers',
    req: {
      dimensions: ['budget_tier'],
      measures: ['count', 'hit_rate', 'median_roi'],
      filters: { primary_genre: 'Horror' },
    },
  },
  {
    key: 'dice',
    title: 'Dice',
    description: 'Summer/Holiday × Big Studios × Action/Adventure',
    req: {
      dimensions: ['primary_genre', 'season'],
      measures: ['count', 'hit_rate', 'median_roi'],
      filters: {
        season: ['Summer', 'Holiday'],
        big_studio: 1,
        primary_genre: ['Action', 'Adventure'],
      },
    },
  },
  {
    key: 'pivot',
    title: 'Pivot',
    description: 'Primary Genre × Release Decade',
    req: {
      dimensions: ['primary_genre', 'decade'],
      measures: ['count', 'hit_rate', 'median_roi'],
    },
  },
  {
    key: 'rollup',
    title: 'Rollup',
    description: 'Overall aggregate summary',
    req: {
      dimensions: ['season'],
      measures: ['count', 'hit_rate', 'median_roi'],
    },
  },
];

const AVAILABLE_DIMENSIONS = [
  'primary_genre',
  'season',
  'budget_tier',
  'runtime_bin',
  'big_studio',
  'franchise',
  'decade',
  'release_month',
];

const AVAILABLE_MEASURES = [
  'count',
  'hit_rate',
  'median_roi',
  'avg_roi',
  'total_revenue',
  'median_budget',
];

export const InsightsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'eda' | 'olap'>('eda');

  // EDA Data Query
  const { data: eda, isLoading: edaLoading } = useQuery<EDAResponse>({
    queryKey: ['eda-insights'],
    queryFn: api.getEDA,
  });

  // OLAP Custom Query State
  const [olapReq, setOlapReq] = useState<OlapQueryRequest>({
    dimensions: ['primary_genre', 'season'],
    measures: ['count', 'hit_rate', 'median_roi'],
  });
  const [activePreset, setActivePreset] = useState<string>('drilldown');

  // OLAP Execution Query
  const { data: olapData, isLoading: olapLoading, refetch: executeOlap } = useQuery<OlapQueryResponse>({
    queryKey: ['olap-query', olapReq],
    queryFn: () => api.queryOLAP(olapReq),
  });

  const handleApplyPreset = (preset: typeof PRESET_OPERATIONS[0]) => {
    setActivePreset(preset.key);
    setOlapReq(preset.req);
  };

  const toggleDimension = (dim: string) => {
    const current = olapReq.dimensions;
    if (current.includes(dim)) {
      if (current.length > 1) {
        setOlapReq({ ...olapReq, dimensions: current.filter((d) => d !== dim) });
        setActivePreset('custom');
      }
    } else {
      setOlapReq({ ...olapReq, dimensions: [...current, dim] });
      setActivePreset('custom');
    }
  };

  const toggleMeasure = (m: string) => {
    const current = olapReq.measures;
    if (current.includes(m)) {
      if (current.length > 1) {
        setOlapReq({ ...olapReq, measures: current.filter((item) => item !== m) });
        setActivePreset('custom');
      }
    } else {
      setOlapReq({ ...olapReq, measures: [...current, m] });
      setActivePreset('custom');
    }
  };

  // Genre hit rate chart items
  const genreChartData = eda?.hit_rates?.primary_genre
    ? Object.entries(eda.hit_rates.primary_genre)
        .map(([genre, stats]) => ({
          genre,
          hit_rate: Math.round(stats.hit_rate * 100),
          count: stats.count,
        }))
        .sort((a, b) => b.hit_rate - a.hit_rate)
    : [];

  // Season hit rate chart items
  const seasonChartData = eda?.hit_rates?.season
    ? Object.entries(eda.hit_rates.season).map(([season, stats]) => ({
        season,
        hit_rate: Math.round(stats.hit_rate * 100),
        count: stats.count,
      }))
    : [];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Descriptive Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-display mt-1">
            Exploratory Insights & Multidimensional OLAP Cube
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Analyze empirical box-office success rates across 3,204 historical films and query multidimensional aggregations with rollups, drilldowns, slices, and dices.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            onClick={() => setActiveTab('eda')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'eda'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            EDA Distributions
          </button>
          <button
            onClick={() => setActiveTab('olap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'olap'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dynamic OLAP Cube
          </button>
        </div>
      </div>

      {/* TAB 1: EDA VISUALIZATIONS */}
      {activeTab === 'eda' && (
        <div className="space-y-8">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Total Clean Dataset</span>
              <div className="text-2xl font-bold font-display text-zinc-100 mt-1">3,204 Titles</div>
              <p className="text-[11px] text-zinc-400 mt-1">Passing all R1–R9 quality filters</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
              <span className="text-[10px] font-mono uppercase text-emerald-400">Commercial Hits</span>
              <div className="text-2xl font-bold font-display text-emerald-300 mt-1">
                {eda?.class_distribution?.binary?.Hit?.count?.toLocaleString() ?? '1,801'}{' '}
                <span className="text-xs font-mono font-normal">
                  ({(eda?.class_distribution?.binary?.Hit?.percentage ?? 56.21).toFixed(2)}%)
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1">ROI &ge; 2.0x (Baseline ZeroR)</p>
            </div>
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20">
              <span className="text-[10px] font-mono uppercase text-rose-400">Commercial Flops</span>
              <div className="text-2xl font-bold font-display text-rose-300 mt-1">
                {eda?.class_distribution?.binary?.Flop?.count?.toLocaleString() ?? '1,403'}{' '}
                <span className="text-xs font-mono font-normal">
                  ({(eda?.class_distribution?.binary?.Flop?.percentage ?? 43.79).toFixed(2)}%)
                </span>
              </div>
              <p className="text-[11px] text-rose-400/80 mt-1">ROI &lt; 2.0x theatrical deficit</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Median Production Budget</span>
              <div className="text-2xl font-bold font-display text-amber-400 mt-1">$25.0M</div>
              <p className="text-[11px] text-zinc-400 mt-1">Mean: $40.8M (Right-skewed)</p>
            </div>
          </div>

          {/* Missing History Audit Callout */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-zinc-200">Historical Talent Absence Distribution</span>
              <p className="text-zinc-400">
                In this dataset, <strong>1,427 films (44.5%)</strong> have no prior director history and <strong>479 films (15.0%)</strong> have no prior cast history strictly prior to their theatrical release date. Our feature pipeline applies zero-imputation with explicit missingness flags to protect against temporal leakage.
              </p>
            </div>
          </div>

          {/* Charts Row: Genre Hit Rates & Season Hit Rates */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Genre Hit Rates (7 cols) */}
            <div className="lg:col-span-7 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200 font-display">
                    Empirical Hit Rates by Primary Genre
                  </h3>
                  <p className="text-xs text-zinc-400">Percentage of films achieving ROI &ge; 2.0x</p>
                </div>
                <span className="text-xs font-mono text-zinc-400">Sorted by %</span>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genreChartData} margin={{ top: 10, right: 10, left: -15, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="genre"
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis domain={[0, 100]} stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono">
                              <span className="font-bold text-zinc-100">{d.genre}</span>
                              <div className="text-emerald-400 mt-1">Hit Rate: {d.hit_rate}%</div>
                              <div className="text-zinc-400">Sample Count: N={d.count}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={56.21} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '56.2% Avg', fill: '#f59e0b', fontSize: 10 }} />
                    <Bar dataKey="hit_rate" radius={[4, 4, 0, 0]}>
                      {genreChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.hit_rate >= 56 ? '#10b981' : '#71717a'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Season Hit Rates (5 cols) */}
            <div className="lg:col-span-5 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 font-display">
                  Seasonal Corridor Profitability
                </h3>
                <p className="text-xs text-zinc-400">Summer vs Holiday vs Spring/Fall release windows</p>
              </div>

              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="season" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono">
                              <span className="font-bold text-zinc-100">{d.season}</span>
                              <div className="text-amber-400 mt-1">Hit Rate: {d.hit_rate}%</div>
                              <div className="text-zinc-400">Sample Count: N={d.count}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={56.21} stroke="#f59e0b" strokeDasharray="3 3" />
                    <Bar dataKey="hit_rate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Budget vs Revenue Scatter Plot with ROI 2.0x Line */}
          {eda?.scatter && (
            <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200 font-display">
                    Budget vs Worldwide Box-Office Revenue (Sampled Distribution)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Red diagonal marks the commercial break-even threshold (Revenue = 2.0 &times; Budget)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Hit (&ge; 2.0x)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Flop (&lt; 2.0x)
                  </span>
                </div>
              </div>

              <div className="h-96 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      type="number"
                      dataKey="budget"
                      name="Budget"
                      unit="$"
                      stroke="#71717a"
                      tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
                    />
                    <YAxis
                      type="number"
                      dataKey="revenue"
                      name="Revenue"
                      unit="$"
                      stroke="#71717a"
                      tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono space-y-1">
                              <span className="font-bold text-zinc-100">{d.title}</span>
                              <div className="text-zinc-300">Budget: ${(d.budget / 1_000_000).toFixed(1)}M</div>
                              <div className="text-zinc-300">Revenue: ${(d.revenue / 1_000_000).toFixed(1)}M</div>
                              <div className={d.roi >= 2.0 ? 'text-emerald-400' : 'text-rose-400'}>
                                ROI: {d.roi.toFixed(2)}x ({d.label})
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      data={eda.scatter}
                      fill="#10b981"
                      shape={(props: any) => {
                        const isHit = props.payload.label === 'Hit';
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={3.5}
                            fill={isHit ? '#10b981' : '#f43f5e'}
                            opacity={0.65}
                          />
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DYNAMIC MULTIDIMENSIONAL OLAP CUBE */}
      {activeTab === 'olap' && (
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
              Canonical OLAP Cube Operations
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {PRESET_OPERATIONS.map((preset) => {
                const isActive = activePreset === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10'
                        : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-display text-zinc-100">
                        {preset.title}
                      </span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Controls Bar: Dimensions & Measures */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Group By Dimensions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_DIMENSIONS.map((dim) => {
                  const isChecked = olapReq.dimensions.includes(dim);
                  return (
                    <button
                      key={dim}
                      type="button"
                      onClick={() => toggleDimension(dim)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        isChecked
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {dim}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Aggregate Measures (median_roi default to handle extreme skew):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_MEASURES.map((m) => {
                  const isChecked = olapReq.measures.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMeasure(m)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        isChecked
                          ? 'bg-teal-500 text-zinc-950 font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Query Results Table & Charts */}
          <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 font-display flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  <span>Aggregated OLAP Cube Ledger ({olapData?.total_records || 0} Cells)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Small samples (N &lt; 30) flagged. Median ROI clipped at 20x for visualization.
                </p>
              </div>

              {/* Sample warnings summary */}
              <div className="flex items-center gap-2 text-xs font-mono">
                {olapData && olapData.small_sample_count > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {olapData.small_sample_count} small samples (N &lt; 30)
                  </span>
                )}
                {olapData && olapData.low_confidence_count > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {olapData.low_confidence_count} low conf (N &lt; 10)
                  </span>
                )}
              </div>
            </div>

            {olapLoading ? (
              <div className="py-16 text-center text-xs text-zinc-400 font-mono animate-pulse">
                Computing dynamic multi-dimensional aggregation across dataset...
              </div>
            ) : olapData && olapData.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase bg-zinc-950/40">
                    <tr>
                      {olapData.dimensions.map((d) => (
                        <th key={d} className="p-2.5">
                          {d}
                        </th>
                      ))}
                      <th className="p-2.5 text-right">Count (N)</th>
                      <th className="p-2.5 text-right">Hit Rate</th>
                      <th className="p-2.5 text-right">Median ROI</th>
                      {olapData.measures.includes('avg_roi') && (
                        <th className="p-2.5 text-right">Avg ROI</th>
                      )}
                      {olapData.measures.includes('total_revenue') && (
                        <th className="p-2.5 text-right">Total Rev</th>
                      )}
                      <th className="p-2.5 text-center">Reliability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {olapData.records.map((r, idx) => {
                      const isLowConf = r.low_confidence;
                      const isSmall = r.small_sample;
                      const hitRatePct = (r.hit_rate * 100).toFixed(1);
                      const medianRoiDisplay =
                        r.median_roi !== undefined ? `${r.median_roi.toFixed(2)}x` : 'N/A';

                      return (
                        <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                          {olapData.dimensions.map((d) => (
                            <td key={d} className="p-2.5 font-semibold text-zinc-200">
                              {String(r[d] ?? 'All')}
                            </td>
                          ))}
                          <td className="p-2.5 text-right font-bold text-zinc-300">
                            {r.count}
                          </td>
                          <td className="p-2.5 text-right font-bold">
                            <span className={r.hit_rate >= 0.56 ? 'text-emerald-400' : 'text-zinc-400'}>
                              {hitRatePct}%
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-amber-400 font-semibold">
                            {medianRoiDisplay}
                          </td>
                          {olapData.measures.includes('avg_roi') && (
                            <td className="p-2.5 text-right text-zinc-400">
                              {r.avg_roi !== undefined ? `${r.avg_roi.toFixed(1)}x` : '-'}
                            </td>
                          )}
                          {olapData.measures.includes('total_revenue') && (
                            <td className="p-2.5 text-right text-zinc-400">
                              ${(r.total_revenue / 1_000_000).toFixed(0)}M
                            </td>
                          )}
                          <td className="p-2.5 text-center">
                            {isLowConf ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Low Conf (N&lt;10)
                              </span>
                            ) : isSmall ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Small (N&lt;30)
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500">Robust</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                No matching cells found for selected dimensions and filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
