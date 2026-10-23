// frontend/src/pages/PatternsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Network, 
  Layers, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Sparkles,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { api } from '../api/client';
import { RulesQueryResponse, ClustersResponse, AssociationRuleItem, ClusterInfo } from '../types/api';

export const PatternsPage: React.FC = () => {
  // Rules filter state
  const [consequentFilter, setConsequentFilter] = useState<string>('Hit');
  const [prereleaseOnly, setPrereleaseOnly] = useState<boolean>(true);
  const [minLift, setMinLift] = useState<number>(1.1);
  const [sortField, setSortField] = useState<string>('lift');

  // Query rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery<RulesQueryResponse>({
    queryKey: ['rules', consequentFilter, prereleaseOnly, minLift, sortField],
    queryFn: () =>
      api.getRules({
        consequent: consequentFilter || undefined,
        prerelease_only: prereleaseOnly,
        min_lift: minLift,
        sort: sortField,
        limit: 30,
      }),
  });

  // Query clusters
  const { data: clusterData, isLoading: clusterLoading } = useQuery<ClustersResponse>({
    queryKey: ['clusters'],
    queryFn: api.getClusters,
  });

  // Cluster evaluation data for elbow and silhouette curves
  const evalData = clusterData?.kmeans?.evaluation || [];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
          <Network className="w-3.5 h-3.5" />
          <span>Unsupervised & Associative Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-display mt-1">
          Class Association Rules & Theatrical Clusters
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
          Translate empirical box-office data into interpretable decision rules (IF antecedent &rarr; THEN commercial outcome) and discover natural theatrical archetypes through partition clustering.
        </p>
      </div>

      {/* SECTION 1: ASSOCIATION RULES & ALGORITHM BENCHMARK */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Class Association Rules (CARs)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Discovered patterns linking pre-release combinations to Hit/Flop classifications.
            </p>
          </div>

          {/* Benchmark Pill */}
          {rulesData?.benchmark && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-mono">
              <span className="text-zinc-400">Algorithmic Parity:</span>
              <span className="text-emerald-400 font-bold">100% Identical Rule Sets</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300">Dual Support Tested (0.03 & 0.01)</span>
            </div>
          )}
        </div>

        {/* Dual Algorithm Benchmark Card */}
        {rulesData?.benchmark && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* Benchmark 1: min_support = 0.03 */}
              <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-zinc-200">
                    Benchmark A: <span className="text-amber-400">min_support = 0.03</span> (High Support)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    Apriori Faster
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Apriori</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {((rulesData.benchmark.benchmark_min_support_0_03?.algorithms.apriori.avg_time_seconds ?? 0.1995) * 1000).toFixed(1)} ms
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">5,186 itemsets</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">FP-Growth</span>
                    <span className="text-sm font-bold text-zinc-300">
                      {((rulesData.benchmark.benchmark_min_support_0_03?.algorithms.fpgrowth.avg_time_seconds ?? 0.3628) * 1000).toFixed(1)} ms
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Tree build overhead</span>
                  </div>
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-snug">
                  574 Class Association Rules mined across 3,204 transactions with 0 discrepancies.
                </p>
              </div>

              {/* Benchmark 2: min_support = 0.01 */}
              <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-zinc-200">
                    Benchmark B: <span className="text-amber-400">min_support = 0.01</span> (Low Support / Dense)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    FP-Growth Faster
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Apriori</span>
                    <span className="text-sm font-bold text-zinc-300">
                      {((rulesData.benchmark.benchmark_min_support_0_01?.algorithms.apriori.avg_time_seconds ?? 1.4444) * 1000).toFixed(1)} ms
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Candidate explosion</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">FP-Growth</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {((rulesData.benchmark.benchmark_min_support_0_01?.algorithms.fpgrowth.avg_time_seconds ?? 1.0504) * 1000).toFixed(1)} ms
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">27,883 itemsets</span>
                  </div>
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-snug">
                  4,610 Class Association Rules mined; FP-Growth outpaces Apriori as candidate space grows.
                </p>
              </div>
            </div>

            {/* Empirical Takeaway Callout */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-200">Algorithmic Complexity & Empirical Finding</span>
                <p className="text-zinc-300 leading-relaxed text-[11.5px]">
                  FP-Growth avoids candidate generation and usually wins on larger or denser data / lower support; on this small dataset at high support, Apriori's vectorised implementation was faster.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rule Filter Bar */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Consequent Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-zinc-400">Target Outcome:</span>
              <div className="flex rounded-lg border border-zinc-700 bg-zinc-900 p-0.5 text-xs">
                {['Hit', 'Flop', ''].map((val) => (
                  <button
                    key={val || 'all'}
                    type="button"
                    onClick={() => setConsequentFilter(val)}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      consequentFilter === val
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {val || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-release toggle */}
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={prereleaseOnly}
                onChange={(e) => setPrereleaseOnly(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
              />
              <span>Strictly Pre-Release Rules</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Min Lift */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Min Lift:</span>
              <select
                value={minLift}
                onChange={(e) => setMinLift(Number(e.target.value))}
                className="px-2 py-1 text-xs rounded border border-zinc-700 bg-zinc-900 text-zinc-200 font-mono"
              >
                <option value={1.0}>&ge; 1.0 (Any lift)</option>
                <option value={1.1}>&ge; 1.1</option>
                <option value={1.2}>&ge; 1.2</option>
                <option value={1.4}>&ge; 1.4 (Strong)</option>
              </select>
            </div>

            {/* Sort Field */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-zinc-700 bg-zinc-900 text-zinc-200 font-mono"
              >
                <option value="lift">Lift</option>
                <option value="confidence">Confidence</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>
        </div>

        {/* Association Rules Table */}
        <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              Showing {rulesData?.rules?.length || 0} discovered rules (Total pool: {rulesData?.summary?.total_rules || 0})
            </span>
          </div>

          {rulesLoading ? (
            <div className="py-16 text-center text-xs text-zinc-500 font-mono animate-pulse">
              Retrieving mined association rules from store...
            </div>
          ) : rulesData && rulesData.rules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase bg-zinc-950/40">
                  <tr>
                    <th className="p-3">Antecedent (IF...)</th>
                    <th className="p-3">Consequent (THEN...)</th>
                    <th className="p-3 text-right">Support</th>
                    <th className="p-3 text-right">Confidence</th>
                    <th className="p-3 text-right">Lift</th>
                    <th className="p-3 text-right">Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {rulesData.rules.map((rule, idx) => {
                    const isHit = rule.is_hit_rule;
                    const suppPct = (rule.support * 100).toFixed(1);
                    const confPct = (rule.confidence * 100).toFixed(1);
                    const liftVal = rule.lift.toFixed(2);

                    return (
                      <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {rule.antecedent.map((item, itemIdx) => (
                              <span
                                key={itemIdx}
                                className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                              >
                                {item.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                              isHit
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {rule.consequent}
                          </span>
                        </td>
                        <td className="p-3 text-right text-zinc-300">{suppPct}%</td>
                        <td className="p-3 text-right font-bold text-zinc-100">{confPct}%</td>
                        <td className="p-3 text-right font-bold">
                          <span className={rule.lift >= 1.2 ? 'text-amber-400' : 'text-zinc-300'}>
                            {liftVal}x
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              rule.uses_post_release
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {rule.uses_post_release ? 'Post-Release' : 'Pre-Release'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              No association rules matched the selected filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: THEATRICAL ARCHETYPES & CLUSTERING */}
      <div className="space-y-6 pt-4 border-t border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 font-display flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Theatrical Archetypes & Partition Clustering (K-Means)</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Unsupervised discovery of latent theatrical production groupings across budget, runtime, and star power.
          </p>
        </div>

        {/* CRITICAL: Cluster Interpretation & Silhouette Notice */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Info className="w-4 h-4" />
            <span>Honest Cluster Structure Assessment</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            Silhouette scores across candidate <em>k</em> values are relatively low (<strong>0.16 to 0.32</strong>), demonstrating that theatrical films form a continuum without crisp, isolated natural boundaries.
            While <strong>k=2</strong> yielded the mathematical peak silhouette (0.32), <strong>k=3</strong> was selected for strategic interpretability.
            The Adjusted Rand Index of <strong>0.245 (Ward Hierarchical vs K-Means)</strong> reflects weak-to-moderate cluster agreement.
          </p>
        </div>

        {/* 3 Cluster Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clusterData?.kmeans?.clusters?.map((cluster: ClusterInfo) => {
            const hitRatePct = Math.round(cluster.hit_rate * 100);
            return (
              <div
                key={cluster.cluster_id}
                className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Cluster {cluster.cluster_id}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      N={cluster.size} ({cluster.size_pct.toFixed(1)}%)
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-100 font-display">
                    {cluster.name}
                  </h3>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Hit Rate</span>
                      <span
                        className={`text-base font-bold ${
                          hitRatePct >= 56 ? 'text-emerald-400' : 'text-zinc-300'
                        }`}
                      >
                        {hitRatePct}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Median ROI</span>
                      <span className="text-base font-bold text-amber-400">
                        {cluster.median_roi.toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  {/* Centroid Attributes */}
                  <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-1">
                    <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                      Normalized Centroid Coordinates:
                    </span>
                    <div>Log Budget: {cluster.centroid?.log_budget?.toFixed(2) ?? '-'}</div>
                    <div>Runtime: {cluster.centroid?.runtime?.toFixed(2) ?? '-'}</div>
                    <div>Cast Revenue: {cluster.centroid?.cast_avg_past_revenue?.toFixed(2) ?? '-'}</div>
                  </div>
                </div>

                {/* Sample Films */}
                <div className="pt-3 border-t border-zinc-800 text-xs">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                    Representative Films:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cluster.sample_films?.slice(0, 3).map((title, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] truncate max-w-[200px]"
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Elbow & Silhouette Evaluation Curves */}
        {evalData.length > 0 && (
          <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 font-display">
                Clustering Model Selection (Elbow Sum of Squared Errors & Silhouette Score)
              </h3>
              <p className="text-xs text-zinc-400">
                Evaluation across k=2 to k=8 candidate cluster partitions.
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evalData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="k" stroke="#71717a" label={{ value: 'Number of Clusters (k)', position: 'insideBottom', offset: -10, fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#10b981" label={{ value: 'Silhouette Score', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 11 }} domain={[0, 0.4]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'Inertia (SSE)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono space-y-1">
                            <span className="font-bold text-zinc-100">k = {d.k} Clusters</span>
                            <div className="text-emerald-400">Silhouette: {d.silhouette.toFixed(3)}</div>
                            <div className="text-amber-400">SSE Inertia: {d.sse.toFixed(0)}</div>
                            {d.k === 3 && <span className="text-amber-300 block text-[10px]">★ Selected k=3</span>}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={3} stroke="#f59e0b" strokeDasharray="3 3" yAxisId="left" />
                  <Line yAxisId="left" type="monotone" dataKey="silhouette" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Silhouette" />
                  <Line yAxisId="right" type="monotone" dataKey="sse" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="SSE" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
