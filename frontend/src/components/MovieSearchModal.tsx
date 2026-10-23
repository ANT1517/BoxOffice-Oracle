// frontend/src/components/MovieSearchModal.tsx
import React, { useState, useEffect } from 'react';
import { Search, X, Film, CheckCircle, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';
import { api } from '../api/client';
import { MovieSearchItem } from '../types/api';

interface MovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: MovieSearchItem) => void;
}

export const MovieSearchModal: React.FC<MovieSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MovieSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial popular samples when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const matches = await api.searchMovies('The', 8);
        setResults(matches);
      } catch (err) {
        console.error('Failed to load initial movies:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen || searchQuery.trim().length === 0) return;

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const matches = await api.searchMovies(searchQuery.trim(), 12);
        setResults(matches);
      } catch (err) {
        console.error('Error searching movies:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 font-display">
                Load Historical TMDb Movie
              </h3>
              <p className="text-xs text-zinc-400">
                Select a verified title to evaluate out-of-fold predictions vs actual theatrical outcome.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 3,204 titles (e.g., Avatar, Inception, Paranormal Activity, Iron Man)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-zinc-800/40">
          {isLoading && (
            <div className="py-12 text-center text-xs text-zinc-400 font-mono animate-pulse">
              Querying verified dataset index...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="py-12 text-center text-xs text-zinc-400">
              No matching verified movies found for "{searchQuery}".
            </div>
          )}

          {!isLoading && results.map((movie) => {
            const isHit = movie.label === 'Hit';
            const budgetM = (movie.budget / 1_000_000).toFixed(1);
            const revenueM = (movie.revenue / 1_000_000).toFixed(1);

            return (
              <div
                key={movie.id}
                onClick={() => {
                  onSelectMovie(movie);
                  onClose();
                }}
                className="pt-2.5 first:pt-0 group cursor-pointer"
              >
                <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-amber-500/40 transition-all flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                        {movie.title}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        ({movie.release_date ? movie.release_date.slice(0, 4) : 'N/A'})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider border ${
                          isHit
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        Actual: {movie.label} ({movie.roi_ratio.toFixed(2)}x ROI)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                      <span>Budget: ${budgetM}M</span>
                      <span>•</span>
                      <span>Revenue: ${revenueM}M</span>
                      <span>•</span>
                      <span className="text-zinc-300">{movie.primary_genre || 'Drama'}</span>
                      {movie.director && (
                        <>
                          <span>•</span>
                          <span>Dir: {movie.director}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Load</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Note */}
        <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 text-center">
          <span className="text-[11px] text-zinc-400">
            Films loaded from the training set automatically display fair <strong>out-of-fold calibrated probabilities</strong>.
          </span>
        </div>
      </div>
    </div>
  );
};
