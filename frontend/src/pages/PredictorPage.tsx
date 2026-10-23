// frontend/src/pages/PredictorPage.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Clapperboard, 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Clock, 
  Building2,
  Film
} from 'lucide-react';
import { api } from '../api/client';
import { MovieInput, PredictResponse, MovieSearchItem } from '../types/api';
import { ProbabilityGauge } from '../components/ProbabilityGauge';
import { FactorCard } from '../components/FactorCard';
import { PeopleAutocomplete } from '../components/PeopleAutocomplete';
import { MovieSearchModal } from '../components/MovieSearchModal';

const GENRES_LIST = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
  'Thriller', 'War', 'Western'
];

const TOP_STUDIOS = [
  'Warner Bros.', 'Universal Pictures', 'Paramount Pictures',
  'Twentieth Century Fox Film Corporation', 'Columbia Pictures',
  'Walt Disney Pictures', 'New Line Cinema', 'Metro-Goldwyn-Mayer (MGM)',
  'Touchstone Pictures', 'TriStar Pictures'
];

const DEFAULT_MOVIE: MovieInput = {
  title: 'Untitled Project',
  budget: 45000000,
  genres: ['Action', 'Thriller'],
  release_date: '2026-07-17',
  runtime: 110,
  original_language: 'en',
  production_companies: ['Warner Bros.'],
  director: 'Christopher Nolan',
  cast: ['Leonardo DiCaprio', 'Tom Hardy'],
  franchise: 0,
  vote_average: null,
  vote_count: null,
  popularity: null,
};

export const PredictorPage: React.FC = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [loadedMovieRecord, setLoadedMovieRecord] = useState<MovieSearchItem | null>(null);
  const [showPostRelease, setShowPostRelease] = useState(false);
  const [showInSampleDetails, setShowInSampleDetails] = useState(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, setValue, watch, reset } = useForm<MovieInput>({
    defaultValues: DEFAULT_MOVIE,
  });

  const currentValues = watch();

  // Run initial prediction on mount
  useEffect(() => {
    executePrediction(DEFAULT_MOVIE);
  }, []);

  const executePrediction = async (data: MovieInput) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const payload: MovieInput = {
        ...data,
        budget: Number(data.budget),
        runtime: Number(data.runtime),
        franchise: Number(data.franchise),
        // If loaded movie inputs match, send its id for fair out-of-fold evaluation
        id: loadedMovieRecord ? loadedMovieRecord.id : null,
      };

      if (!showPostRelease) {
        payload.vote_average = null;
        payload.vote_count = null;
        payload.popularity = null;
      } else {
        payload.vote_average = data.vote_average ? Number(data.vote_average) : null;
        payload.vote_count = data.vote_count ? Number(data.vote_count) : null;
        payload.popularity = data.popularity ? Number(data.popularity) : null;
      }

      const res = await api.predict(payload);
      setPrediction(res);
    } catch (err: any) {
      setApiError(err.message || 'Failed to generate prediction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLoadedMovie = (movie: MovieSearchItem) => {
    setLoadedMovieRecord(movie);
    const inp = movie.movie_input;
    setValue('title', inp.title || movie.title);
    setValue('budget', inp.budget);
    setValue('genres', inp.genres || []);
    setValue('release_date', inp.release_date);
    setValue('runtime', inp.runtime);
    setValue('original_language', inp.original_language || 'en');
    setValue('production_companies', inp.production_companies || []);
    setValue('director', inp.director || '');
    setValue('cast', inp.cast || []);
    setValue('franchise', inp.franchise);

    if (inp.vote_average || inp.vote_count || inp.popularity) {
      setValue('vote_average', inp.vote_average);
      setValue('vote_count', inp.vote_count);
      setValue('popularity', inp.popularity);
      setShowPostRelease(true);
    } else {
      setShowPostRelease(false);
    }

    // Trigger prediction with movie ID attached
    executePrediction({
      ...inp,
      id: movie.id,
    });
  };

  const handleReset = () => {
    setLoadedMovieRecord(null);
    setShowPostRelease(false);
    reset(DEFAULT_MOVIE);
    executePrediction(DEFAULT_MOVIE);
  };

  const setBudgetQuick = (amount: number) => {
    setValue('budget', amount);
  };

  const toggleGenre = (genre: string) => {
    const current = currentValues.genres || [];
    if (current.includes(genre)) {
      if (current.length > 1) {
        setValue('genres', current.filter((g) => g !== genre));
      }
    } else {
      setValue('genres', [...current, genre]);
    }
  };

  const toggleStudio = (studio: string) => {
    const current = currentValues.production_companies || [];
    if (current.includes(studio)) {
      setValue('production_companies', current.filter((s) => s !== studio));
    } else {
      setValue('production_companies', [...current, studio]);
    }
  };

  const handleGoToWhatIf = () => {
    navigate('/whatif', {
      state: { movie: currentValues },
    });
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-Release Feasibility Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-display mt-1">
            Commercial Box-Office Predictor
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Evaluate whether a feature film project will achieve commercial success (<strong className="text-zinc-200">ROI &ge; 2.0x</strong>) prior to greenlight, using leakage-audited historical distributions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm transition-all"
          >
            <Film className="w-4 h-4" />
            <span>Load a Real Movie</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dataset Notice if a historical movie is loaded */}
      {loadedMovieRecord && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-zinc-100">{loadedMovieRecord.title}</span> loaded from verified dataset.
              <span className="text-zinc-400 ml-2">
                Actual Theatrical ROI: <strong className="text-zinc-200">{loadedMovieRecord.roi_ratio.toFixed(2)}x</strong> ({loadedMovieRecord.label}).
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px] border border-amber-500/20">
            Out-of-Fold Evaluation Active
          </span>
        </div>
      )}

      {/* Main Grid: Form Left, Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 sm:p-6 space-y-6">
          <form onSubmit={handleSubmit(executePrediction)} className="space-y-6">
            {/* Title & Language Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                  Project Working Title
                </label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="e.g., Dune: Part Three"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                  Language
                </label>
                <Controller
                  name="original_language"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="en">English (en)</option>
                      <option value="fr">French (fr)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="de">German (de)</option>
                      <option value="hi">Hindi (hi)</option>
                      <option value="ja">Japanese (ja)</option>
                      <option value="zh">Chinese (zh)</option>
                      <option value="ko">Korean (ko)</option>
                      <option value="other">Other / Foreign</option>
                    </select>
                  )}
                />
              </div>
            </div>

            {/* Budget Row with Quick Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  Production Budget (USD)
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  ${(Number(currentValues.budget || 0) / 1_000_000).toFixed(1)} Million
                </span>
              </div>
              <Controller
                name="budget"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    step={1000000}
                    min={100000}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono"
                  />
                )}
              />
              {/* Quick Budget Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-zinc-500 uppercase font-mono mr-1">Presets:</span>
                {[
                  { label: '$5M (Indie)', val: 5000000 },
                  { label: '$25M (Mid)', val: 25000000 },
                  { label: '$65M (Studio)', val: 65000000 },
                  { label: '$150M (Tentpole)', val: 150000000 },
                  { label: '$250M (Mega)', val: 250000000 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setBudgetQuick(preset.val)}
                    className="px-2 py-0.5 rounded text-[11px] font-mono border border-zinc-700 hover:border-amber-500/50 hover:bg-zinc-800 text-zinc-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres Multi-select Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                  Genres (Primary genre: {currentValues.genres?.[0] || 'None'})
                </label>
                <span className="text-[11px] text-zinc-400">
                  Select 1 or more
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GENRES_LIST.map((g) => {
                  const isSelected = currentValues.genres?.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
                          : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 border border-zinc-700/60'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date and Runtime Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Theatrical Release Date
                </label>
                <Controller
                  name="release_date"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Runtime (Minutes)
                  </label>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {currentValues.runtime} min
                  </span>
                </div>
                <Controller
                  name="runtime"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <input
                        {...field}
                        type="range"
                        min={60}
                        max={240}
                        step={5}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Production Companies Multi-select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                Production Studios (Big-10 Studio Backing)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TOP_STUDIOS.map((studio) => {
                  const isSelected = currentValues.production_companies?.includes(studio);
                  return (
                    <button
                      key={studio}
                      type="button"
                      onClick={() => toggleStudio(studio)}
                      className={`px-2 py-1 rounded text-[11px] transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {studio.replace(' Pictures', '').replace(' Film Corporation', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Director Autocomplete */}
            <PeopleAutocomplete
              label="Director"
              placeholder="Search historical director (e.g. Christopher Nolan, James Cameron)..."
              role="director"
              maxSelections={1}
              selected={currentValues.director ? [currentValues.director] : []}
              onChange={(names) => setValue('director', names[0] || '')}
              helperText="Leakage-safe historical track record strictly prior to release"
            />

            {/* Cast Autocomplete */}
            <PeopleAutocomplete
              label="Top-3 Billed Cast Members"
              placeholder="Search historical actor (e.g. Leonardo DiCaprio, Tom Cruise)..."
              role="actor"
              maxSelections={3}
              selected={currentValues.cast || []}
              onChange={(names) => setValue('cast', names)}
              helperText="Average past theatrical revenue strictly prior to release"
            />

            {/* CRITICAL: Franchise Toggle with Precise Label & Clarification */}
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200 font-display">
                    Sequel or later instalment of an existing franchise
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Important: Original franchise starters (e.g. <em>Saw 2004</em>, <em>Insidious 2010</em>, <em>Iron Man 2008</em>) count as <strong>No</strong> at release time to prevent outcome leakage.
                  </p>
                </div>
                <Controller
                  name="franchise"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value === 1}
                      onClick={() => field.onChange(field.value === 1 ? 0 : 1)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        field.value === 1 ? 'bg-amber-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          field.value === 1 ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  )}
                />
              </div>
            </div>

            {/* Optional Model B Accordion */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPostRelease(!showPostRelease)}
                className="w-full px-4 py-3 bg-zinc-900/80 hover:bg-zinc-800/80 flex items-center justify-between text-xs font-medium text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]">
                    Model B
                  </span>
                  <span>Post-Release Audience Signals (Explanatory Model)</span>
                </div>
                {showPostRelease ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {showPostRelease && (
                <div className="p-4 bg-zinc-950/40 border-t border-zinc-800 space-y-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Methodology Note:</strong> vote_count and popularity are post-release engagement snapshots (2017) and partly proxy for audience size. Model B is explanatory, not a pre-release forecast.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-zinc-400">Audience Rating (1-10)</label>
                      <Controller
                        name="vote_average"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            step="0.1"
                            min="1.0"
                            max="10.0"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            placeholder="e.g. 7.5"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-zinc-400">Audience Vote Count</label>
                      <Controller
                        name="vote_count"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="0"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            placeholder="e.g. 4500"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-zinc-400">TMDb Popularity Score</label>
                      <Controller
                        name="popularity"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            step="0.1"
                            min="0"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            placeholder="e.g. 35.0"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {apiError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Computing Calibrated Probability...</span>
                </>
              ) : (
                <>
                  <Clapperboard className="w-4 h-4 text-zinc-950" />
                  <span>Run Commercial Feasibility Analysis</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Prediction Results Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5 sm:p-6 space-y-6 backdrop-blur-md shadow-xl sticky top-24">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Decision Support Output
                  </span>
                  <h3 className="text-base font-bold text-zinc-100 font-display">
                    {prediction.title || 'Evaluated Title'}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      prediction.model_used === 'Model_A'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    }`}
                  >
                    {prediction.model_used === 'Model_A' ? 'Model A (Pre-Release)' : 'Model B (Post-Release)'}
                  </span>
                </div>
              </div>

              {/* Calibrated Probability Gauge */}
              {/* CRITICAL: Uses headline probability which matches out_of_fold_probability for dataset films */}
              <ProbabilityGauge
                probability={prediction.hit_probability}
                label={prediction.label}
                riskTier={prediction.risk_tier}
              />

              {/* Honest Out-of-fold Notice vs In-sample fit */}
              {prediction.out_of_fold_probability !== null && prediction.out_of_fold_probability !== undefined && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      Fair Out-of-Fold Evaluation
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowInSampleDetails(!showInSampleDetails)}
                      className="text-[11px] text-amber-400 hover:underline font-mono"
                    >
                      {showInSampleDetails ? 'Hide in-sample fit' : 'Show in-sample fit'}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    This movie was part of the 3,204-film training set. The headline {Math.round(prediction.hit_probability * 100)}% estimate is strictly out-of-fold cross-validated to avoid optimistic training leakage.
                  </p>

                  {/* Collapsible in-sample details */}
                  {showInSampleDetails && prediction.in_sample_probability != null && (
                    <div className="pt-2 border-t border-amber-500/20 text-[11px] space-y-1 font-mono text-zinc-400">
                      <div className="flex justify-between">
                        <span>In-Sample Model Fit:</span>
                        <span className="text-zinc-200 font-bold">
                          {Math.round(prediction.in_sample_probability * 100)}% ({prediction.in_sample_label})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>In-Sample Risk Tier:</span>
                        <span className="text-zinc-200">{prediction.in_sample_risk_tier}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block italic">
                        Notice how the in-sample probability fits training data more optimistically than out-of-fold cross-validation.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Derived Features Summary Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] font-mono">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Season</span>
                  <span className="text-zinc-200 font-semibold">{prediction.derived_features.season}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Budget Tier</span>
                  <span className="text-zinc-200 font-semibold">{prediction.derived_features.budget_tier}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Big Studio</span>
                  <span className="text-zinc-200 font-semibold">{prediction.derived_features.big_studio ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Cast Star Power</span>
                  <span className="text-zinc-200 font-semibold">
                    ${(prediction.derived_features.cast_avg_past_revenue / 1_000_000).toFixed(1)}M
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Dir Star Power</span>
                  <span className="text-zinc-200 font-semibold">
                    ${(prediction.derived_features.dir_avg_past_revenue / 1_000_000).toFixed(1)}M
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Franchise Status</span>
                  <span className="text-zinc-200 font-semibold">{prediction.derived_features.franchise === 1 ? 'Sequel' : 'Original'}</span>
                </div>
              </div>

              {/* Explanation Factors (phrased as compared with typical film) */}
              <FactorCard factors={prediction.top_factors} />

              {/* Warnings Box */}
              {prediction.warnings && prediction.warnings.length > 0 && (
                <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/50 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Model Reliability Advisories
                  </span>
                  <ul className="space-y-1 text-[11px] text-zinc-400 list-disc list-inside">
                    {prediction.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What-If CTA Button */}
              <button
                type="button"
                onClick={handleGoToWhatIf}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Parameter Variations in What-If Studio &rarr;</span>
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800 p-8 text-center text-zinc-500 text-xs">
              Configure parameters on the left and submit to generate commercial prediction.
            </div>
          )}
        </div>
      </div>

      {/* Historical Movie Search Modal */}
      <MovieSearchModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelectMovie={handleSelectLoadedMovie}
      />
    </div>
  );
};
