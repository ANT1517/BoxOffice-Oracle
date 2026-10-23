// frontend/src/api/client.ts
// Fully typed API client for BoxOffice Oracle backend

import {
  ClusterInfo,
  ClustersResponse,
  EDAResponse,
  MetaResponse,
  MovieInput,
  MovieSearchItem,
  ModelsResponse,
  OlapQueryRequest,
  OlapQueryResponse,
  PersonSearchItem,
  PredictResponse,
  RulesQueryResponse,
  WhatIfRequest,
  WhatIfResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) {
        if (typeof errData.detail === 'string') {
          errMessage = errData.detail;
        } else if (Array.isArray(errData.detail)) {
          errMessage = errData.detail.map((e: any) => `${e.loc?.join('.') || 'param'}: ${e.msg}`).join(', ');
        }
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; models_loaded: Record<string, boolean>; dataset_rows: number; total_people_indexed: number; total_movies_indexed: number }>(`${BASE_URL}/health`),

  // Metadata vocabularies & thresholds
  getMeta: () => fetchJson<MetaResponse>(`${BASE_URL}/meta`),

  // People fuzzy search
  searchPeople: (query: string, role?: string) => {
    const params = new URLSearchParams({ q: query });
    if (role) params.set('role', role);
    return fetchJson<PersonSearchItem[]>(`${BASE_URL}/people/search?${params.toString()}`);
  },

  // Dataset movies search
  searchMovies: (query: string, limit = 8) => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    return fetchJson<MovieSearchItem[]>(`${BASE_URL}/movies/search?${params.toString()}`);
  },

  getMovieById: (id: number) => fetchJson<MovieSearchItem>(`${BASE_URL}/movies/${id}`),

  // Predict
  predict: (movie: MovieInput) =>
    fetchJson<PredictResponse>(`${BASE_URL}/predict`, {
      method: 'POST',
      body: JSON.stringify(movie),
    }),

  // What-If
  whatIf: (req: WhatIfRequest) =>
    fetchJson<WhatIfResponse>(`${BASE_URL}/whatif`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // Insights (EDA)
  getEDA: () => fetchJson<EDAResponse>(`${BASE_URL}/insights/eda`),

  // OLAP
  getOLAPPresets: () => fetchJson<Record<string, any>>(`${BASE_URL}/olap/presets`),

  queryOLAP: (req: OlapQueryRequest) =>
    fetchJson<OlapQueryResponse>(`${BASE_URL}/olap/query`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  // Association Rules
  getRules: (params?: {
    consequent?: string;
    prerelease_only?: boolean;
    min_lift?: number;
    sort?: string;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.consequent) q.set('consequent', params.consequent);
    if (params?.prerelease_only !== undefined) q.set('prerelease_only', String(params.prerelease_only));
    if (params?.min_lift !== undefined) q.set('min_lift', String(params.min_lift));
    if (params?.sort) q.set('sort', params.sort);
    if (params?.limit) q.set('limit', String(params.limit));
    return fetchJson<RulesQueryResponse>(`${BASE_URL}/rules?${q.toString()}`);
  },

  // Clusters
  getClusters: () => fetchJson<ClustersResponse>(`${BASE_URL}/clusters`),

  // Models benchmark & significance
  getModels: () => fetchJson<ModelsResponse>(`${BASE_URL}/models`),
};
