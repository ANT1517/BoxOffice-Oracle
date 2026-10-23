// frontend/src/types/api.ts
// Typed interfaces strictly matching FastAPI Pydantic schemas

export interface MovieInput {
  id?: number | null;
  title?: string;
  budget: number;
  genres: string[];
  release_date: string;
  runtime: number;
  original_language: string;
  production_companies?: string[];
  cast?: string[];
  director?: string;
  franchise: number;
  vote_average?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
}

export interface FactorContribution {
  feature: string;
  current_value: any;
  reference_value: any;
  delta_probability: number;
  impact: 'positive' | 'negative';
}

export interface PredictResponse {
  title: string;
  model_used: 'Model_A' | 'Model_B';
  label: 'Hit' | 'Flop';
  hit_probability: number;
  in_sample_probability?: number | null;
  in_sample_label?: 'Hit' | 'Flop' | null;
  in_sample_risk_tier?: string | null;
  out_of_fold_probability?: number | null;
  risk_tier: string;
  confidence_score: number;
  top_factors: FactorContribution[];
  derived_features: Record<string, any>;
  warnings: string[];
}

export interface WhatIfRequest {
  movie: MovieInput;
  varying_field: string;
  values: any[];
}

export interface WhatIfItem {
  value: any;
  hit_probability: number;
  label: string;
  delta_vs_base: number;
}

export interface WhatIfResponse {
  varying_field: string;
  base_hit_probability: number;
  base_label: string;
  results: WhatIfItem[];
}

export interface PersonSearchItem {
  name: string;
  roles: string[];
  film_count: number;
  last_film_year: number | null;
  avg_past_revenue: number;
  past_hit_rate: number;
}

export interface MovieSearchItem {
  id: number;
  title: string;
  release_date: string;
  budget: number;
  revenue: number;
  roi_ratio: number;
  label: string;
  primary_genre: string;
  genres: string[];
  director: string;
  cast: string[];
  production_companies: string[];
  original_language: string;
  runtime: number;
  franchise: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
  oof_hit_probability_A?: number | null;
  oof_hit_probability_B?: number | null;
  movie_input: MovieInput;
}

export interface MetaResponse {
  app_name: string;
  version: string;
  hit_threshold_roi: number;
  genres: { top_genres: string[]; primary_genres: string[] };
  studios: { top_10: string[]; all_studios_count: number };
  languages: { total_languages: number; languages: { code: string; count: number; is_english: boolean }[] };
  season_definitions: Record<string, string>;
  budget_tier_cutoffs: { Low: string; Medium: string; High: string };
}

export interface EDAResponse {
  summary: Record<string, any>;
  class_distribution: { total: number; Hit: number; Flop: number; hit_rate: number };
  histograms: Record<string, { bins: number[]; counts: number[] }>;
  hit_rates: Record<string, Record<string, { count: number; hit_rate: number }>>;
  scatter: { title: string; budget: number; revenue: number; roi: number; label: string }[];
}

export interface OLAPOperationPreset {
  operation: string;
  description: string;
  data: any[];
  [key: string]: any;
}

export interface OlapQueryRequest {
  dimensions: string[];
  measures: string[];
  filters?: Record<string, any>;
}

export interface OlapQueryResponse {
  dimensions: string[];
  measures: string[];
  records: Record<string, any>[];
  total_records: number;
  low_confidence_count: number;
  small_sample_count: number;
}

export interface AssociationRuleItem {
  antecedent: string[];
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
  uses_post_release: boolean;
  is_hit_rule: boolean;
}

export interface RulesQueryResponse {
  total_matched: number;
  limit: number;
  prerelease_only: boolean;
  consequent_filter: string | null;
  rules: AssociationRuleItem[];
  benchmark: {
    dataset_rows: number;
    apriori: { avg_time_sec: number; itemsets_found: number };
    fpgrowth: { avg_time_sec: number; itemsets_found: number };
    rules_identical: boolean;
    rule_count: number;
  };
  summary: {
    total_rules: number;
    hit_rules_count: number;
    flop_rules_count: number;
    prerelease_rules_count: number;
  };
}

export interface RulesResponse {
  total_rules: number;
  hit_rules_count: number;
  flop_rules_count: number;
  prerelease_rules_count: number;
  top_5_hit_rules: AssociationRuleItem[];
  top_5_flop_rules: AssociationRuleItem[];
  all_rules: AssociationRuleItem[];
  prerelease_rules: AssociationRuleItem[];
  benchmark: {
    dataset_rows: number;
    apriori: { avg_time_sec: number; itemsets_found: number };
    fpgrowth: { avg_time_sec: number; itemsets_found: number };
    rules_identical: boolean;
    rule_count: number;
  };
}

export interface ClusterCentroid {
  log_budget: number;
  runtime: number;
  cast_avg_past_revenue: number;
  vote_average: number;
  popularity: number;
  [key: string]: number;
}

export interface ClusterInfo {
  cluster_id: number;
  name: string;
  size: number;
  size_pct: number;
  hit_count: number;
  hit_rate: number;
  median_roi: number;
  centroid: ClusterCentroid;
  sample_films: string[];
}

export interface ClustersResponse {
  kmeans: {
    k_selected: number;
    clusters: ClusterInfo[];
    evaluation: { k: number; sse: number; silhouette: number }[];
  };
  hierarchical: {
    linkages_evaluated: Record<string, { ari_vs_kmeans: number }>;
  };
}

export interface AlgorithmMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_hit: number;
  weighted_f1: number;
  roc_auc: number;
  cohen_kappa: number;
  confusion_matrix: number[][];
  best_k?: number;
  tuned_min_samples_leaf?: number;
  tuned_max_depth?: number | null;
}

export interface ModelsResponse {
  metrics: {
    Model_A: Record<string, AlgorithmMetrics>;
    Model_B: Record<string, AlgorithmMetrics>;
  };
  significance: {
    vs_baseline_model_A: Record<string, { mean_f1: number; diff_vs_baseline: number; t_stat: number; p_value: number; significant_at_0_05: boolean }>;
    vs_baseline_model_B: Record<string, { mean_f1: number; diff_vs_baseline: number; t_stat: number; p_value: number; significant_at_0_05: boolean }>;
    model_A_vs_model_B: Record<string, { mean_f1_model_A: number; mean_f1_model_B: number; delta_B_minus_A: number; t_stat: number; p_value: number; significant_at_0_05: boolean }>;
  };
  importance: {
    Model_A: {
      top_mutual_information: [string, number][];
      top_rf_impurity_mdi: [string, number][];
      top_permutation_importance: [string, number][];
    };
    Model_B: {
      top_mutual_information: [string, number][];
      top_rf_impurity_mdi: [string, number][];
      top_permutation_importance: [string, number][];
    };
  };
  model_card: Record<string, any>;
  decision_tree_A: any;
}
