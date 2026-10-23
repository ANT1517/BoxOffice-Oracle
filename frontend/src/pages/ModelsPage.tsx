// frontend/src/pages/ModelsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Layers, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  GitBranch, 
  BarChart2, 
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { api } from '../api/client';
import { ModelsResponse, AlgorithmMetrics } from '../types/api';

const ALGO_DISPLAY_NAMES: Record<string, string> = {
  ZeroR: 'ZeroR (Majority Baseline)',
  ID3: 'ID3 (Entropy Decision Tree)',
  CART: 'CART (Gini Decision Tree)',
  CategoricalNB: 'Categorical Naive Bayes',
  GaussianNB: 'Gaussian Naive Bayes',
  KNN: 'K-Nearest Neighbors (KNN)',
  RandomForest: 'Random Forest Ensemble (Production)',
};

export const ModelsPage: React.FC = () => {
  const [activeModelTab, setActiveModelTab] = useState<'Model_A' | 'Model_B'>('Model_A');
  const [showTreeJson, setShowTreeJson] = useState<boolean>(false);

  const { data: modelsData, isLoading } = useQuery<ModelsResponse>({
    queryKey: ['models-benchmark'],
    queryFn: api.getModels,
  });

  const currentMetrics = modelsData?.metrics?.[activeModelTab] || {};
  const significanceData = modelsData?.significance;
  const importanceData = modelsData?.importance?.[activeModelTab];

  // Accuracy comparison chart data
  const chartData = Object.entries(currentMetrics).map(([algo, m]) => ({
    name: algo === 'RandomForest' ? 'Random Forest' : algo,
    fullName: ALGO_DISPLAY_NAMES[algo] || algo,
    accuracy: Number((m.accuracy * 100).toFixed(1)),
    f1: Number((m.weighted_f1 * 100).toFixed(1)),
    rocAuc: Number((m.roc_auc * 100).toFixed(1)),
    isProduction: algo === 'RandomForest',
    isBaseline: algo === 'ZeroR',
  }));

  // Feature importance items
  const miFeatures = importanceData?.top_mutual_information || [];
  const rfFeatures = importanceData?.top_rf_impurity_mdi || [];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            <span>Empirical Validation & Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-display mt-1">
            Algorithmic Benchmark & Cross-Validation Audits
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
            Exhaustive performance ledger comparing 6 classification algorithms evaluated under repeated 10-fold cross-validation with paired folds and Nadeau–Bengio corrected resampled t-tests.
          </p>
        </div>

        {/* Model A vs Model B Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveModelTab('Model_A')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeModelTab === 'Model_A'
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Model A (Pre-Release)
          </button>
          <button
            type="button"
            onClick={() => setActiveModelTab('Model_B')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeModelTab === 'Model_B'
                ? 'bg-purple-500 text-zinc-100 shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Model B (Post-Release)
          </button>
        </div>
      </div>

      {/* CRITICAL: "What Changed" Franchise Leakage Fix Callout Banner */}
      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/25 flex items-start gap-3.5 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-300 font-display uppercase tracking-wider text-[11px]">
            Audit Note: What Changed in Model A Benchmark
          </span>
          <p className="text-zinc-200 leading-relaxed">
            <strong>Franchise leakage fixed:</strong> Model A Random Forest accuracy changed from <strong>65.7% to 61.6%</strong> after restricting the franchise indicator strictly to sequels/later instalments released after an earlier film in the same collection. First instalments (e.g., <em>Saw 2004</em>, <em>Insidious 2010</em>, <em>The Matrix 1999</em>, <em>Iron Man 2008</em>) were reset from 1 to 0, completely eliminating retroactive hit-label contamination.
          </p>
        </div>
      </div>

      {/* SECTION 1: ACCURACY CHART & COMPARISON TABLE */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100 font-display">
            Cross-Validated Accuracy Benchmark ({activeModelTab === 'Model_A' ? 'Pre-Release' : 'Post-Release'})
          </h2>
          <span className="text-xs font-mono text-zinc-400">
            Dashed line: 56.2% ZeroR baseline
          </span>
        </div>

        {/* Recharts Bar Chart with 56.2% ZeroR Baseline */}
        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                />
                <YAxis domain={[40, 90]} stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11 }} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono space-y-1">
                          <span className="font-bold text-zinc-100 block">{d.fullName}</span>
                          <div className="text-amber-400">Accuracy: <strong>{d.accuracy}%</strong></div>
                          <div className="text-zinc-300">Weighted F1: {d.f1}%</div>
                          <div className="text-zinc-300">ROC-AUC: {d.rocAuc}%</div>
                          {d.isProduction && (
                            <span className="text-emerald-400 font-bold block pt-1 text-[10px]">
                              ★ Calibrated Production Model
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* CRITICAL: 56.2% ZeroR Baseline line */}
                <ReferenceLine
                  y={56.21}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: '56.2% ZeroR Majority Baseline',
                    fill: '#ef4444',
                    fontSize: 11,
                    position: 'top',
                  }}
                />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isProduction
                          ? activeModelTab === 'Model_A' ? '#f59e0b' : '#a855f7'
                          : entry.isBaseline
                          ? '#ef4444'
                          : '#71717a'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complete Benchmark Table */}
        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 font-display">
              10-Fold Cross-Validation Performance Ledger
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">N=3,204 films • Paired stratified folds</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase bg-zinc-950/40">
                <tr>
                  <th className="p-3">Algorithm</th>
                  <th className="p-3 text-right">Accuracy</th>
                  <th className="p-3 text-right">Precision</th>
                  <th className="p-3 text-right">Recall</th>
                  <th className="p-3 text-right">F1 (Hit)</th>
                  <th className="p-3 text-right">Weighted F1</th>
                  <th className="p-3 text-right">ROC-AUC</th>
                  <th className="p-3 text-right">Cohen Kappa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {Object.entries(currentMetrics).map(([algo, m]) => {
                  const isProd = algo === 'RandomForest';
                  const isBase = algo === 'ZeroR';

                  return (
                    <tr
                      key={algo}
                      className={`hover:bg-zinc-800/40 transition-colors ${
                        isProd ? 'bg-amber-500/10 font-bold' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isProd && <span className="text-amber-400">★</span>}
                          <span className={isProd ? 'text-amber-300' : 'text-zinc-200'}>
                            {ALGO_DISPLAY_NAMES[algo] || algo}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-zinc-100">
                        {(m.accuracy * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right text-zinc-300">{(m.precision * 100).toFixed(1)}%</td>
                      <td className="p-3 text-right text-zinc-300">{(m.recall * 100).toFixed(1)}%</td>
                      <td className="p-3 text-right text-zinc-300">{(m.f1_hit * 100).toFixed(1)}%</td>
                      <td className="p-3 text-right text-zinc-100">{(m.weighted_f1 * 100).toFixed(1)}%</td>
                      <td className="p-3 text-right text-amber-400">{(m.roc_auc * 100).toFixed(1)}%</td>
                      <td className="p-3 text-right text-zinc-300">{m.cohen_kappa.toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: STATISTICAL SIGNIFICANCE (NADEAU-BENGIO) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 font-display flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Nadeau–Bengio Resampled Significance Tests</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Corrects for non-independent repeated cross-validation folds (variance inflation correction factor: 1/K + 1/(1-train_ratio)).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tests vs Baseline */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-zinc-300">
              Classifiers vs ZeroR Majority Baseline ({activeModelTab})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase">
                  <tr>
                    <th className="pb-2">Algorithm</th>
                    <th className="pb-2 text-right">&Delta; F1</th>
                    <th className="pb-2 text-right">t-stat</th>
                    <th className="pb-2 text-right">p-value</th>
                    <th className="pb-2 text-center">Sig (p&lt;0.05)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {significanceData &&
                    Object.entries(
                      activeModelTab === 'Model_A'
                        ? significanceData.vs_baseline_model_A
                        : significanceData.vs_baseline_model_B
                    ).map(([algo, res]) => (
                      <tr key={algo} className="hover:bg-zinc-800/40">
                        <td className="py-2 text-zinc-300">{algo}</td>
                        <td className="py-2 text-right font-bold text-emerald-400">
                          +{(res.diff_vs_baseline * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 text-right text-zinc-400">{res.t_stat.toFixed(2)}</td>
                        <td className="py-2 text-right text-zinc-400">
                          {res.p_value < 0.001 ? '< 0.001' : res.p_value.toFixed(4)}
                        </td>
                        <td className="py-2 text-center">
                          {res.significant_at_0_05 ? (
                            <span className="text-[10px] text-emerald-400 font-bold">YES ★</span>
                          ) : (
                            <span className="text-[10px] text-zinc-500">NO</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model B vs Model A Head-to-Head */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-zinc-300">
              Model B vs Model A Paired Delta (&Delta; B &minus; A)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase">
                  <tr>
                    <th className="pb-2">Algorithm</th>
                    <th className="pb-2 text-right">&Delta; F1 (B &minus; A)</th>
                    <th className="pb-2 text-right">t-stat</th>
                    <th className="pb-2 text-right">p-value</th>
                    <th className="pb-2 text-center">Sig (p&lt;0.05)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {significanceData?.model_A_vs_model_B &&
                    Object.entries(significanceData.model_A_vs_model_B).map(([algo, res]) => (
                      <tr key={algo} className="hover:bg-zinc-800/40">
                        <td className="py-2 text-zinc-300">{algo}</td>
                        <td className="py-2 text-right font-bold text-purple-400">
                          +{(res.delta_B_minus_A * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 text-right text-zinc-400">{res.t_stat.toFixed(2)}</td>
                        <td className="py-2 text-right text-zinc-400">
                          {res.p_value < 0.001 ? '< 0.001' : res.p_value.toFixed(4)}
                        </td>
                        <td className="py-2 text-center">
                          {res.significant_at_0_05 ? (
                            <span className="text-[10px] text-emerald-400 font-bold">YES ★</span>
                          ) : (
                            <span className="text-[10px] text-zinc-500">NO</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-zinc-400 pt-1">
              Adding post-release engagement signals (vote_count, popularity) generates highly statistically significant predictive gains across every complex classifier (p &lt; 0.001).
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: FEATURE IMPORTANCE RANKINGS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 font-display flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-500" />
            <span>Feature Importance Comparison ({activeModelTab})</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Non-linear Mutual Information vs Random Forest Mean Decrease in Impurity (MDI).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mutual Information */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-zinc-300">
              Top Mutual Information with Hit/Flop Target
            </h3>
            <div className="space-y-2">
              {miFeatures.slice(0, 7).map(([feat, score], idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-200">{feat}</span>
                    <span className="text-amber-400 font-bold">{score.toFixed(4)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(score * 300, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Random Forest MDI */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-zinc-300">
              Random Forest Gini Impurity (MDI)
            </h3>
            <div className="space-y-2">
              {rfFeatures.slice(0, 7).map(([feat, score], idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-200">{feat}</span>
                    <span className="text-emerald-400 font-bold">{(score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${score * 100 * 3}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: MODEL CARD LIMITATIONS */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 space-y-3">
        <h3 className="text-sm font-bold text-zinc-200 font-display flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-500" />
          <span>Operational Model Card Limitations</span>
        </h3>
        <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-zinc-200">Post-Release Explanatory Boundary:</strong> vote_count and popularity are post-release engagement snapshots (2017) and partly proxy for audience size, so Model B is explanatory, not a pre-release forecast.
          </li>
          <li>
            <strong className="text-zinc-200">Shared Universe Scope:</strong> Franchise is defined per TMDb collection; shared universes (e.g. <em>The Avengers 2012</em> after <em>Iron Man</em>) are not captured, so such films count as originals.
          </li>
          <li>
            <strong className="text-zinc-200">Theatrical Baseline Cutoff:</strong> The Hit label threshold (<strong className="text-zinc-200">ROI &ge; 2.0x</strong>) reflects traditional theatrical exhibition splits (~50% exhibitor retainage). Home entertainment and streaming ancillary revenues are unobserved.
          </li>
        </ul>
      </div>
    </div>
  );
};
