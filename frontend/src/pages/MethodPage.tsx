// frontend/src/pages/MethodPage.tsx
import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Database, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Award,
  Layers,
  History
} from 'lucide-react';

export const MethodPage: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest">
          <BookOpen className="w-3.5 h-3.5" />
          <span>System Documentation & Integrity Protocol</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-display mt-1">
          Methodology, Leakage Audit & Attribution
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl">
          Complete mathematical framing, data provenance, zero-leakage temporal feature guarantees, and academic context for BoxOffice Oracle.
        </p>
      </div>

      {/* 1. Academic Context */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-100 font-bold font-display text-lg">
          <Award className="w-5 h-5 text-amber-500" />
          <h2>Academic Affiliation & Context</h2>
        </div>
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 leading-relaxed space-y-2">
          <p>
            <strong>BoxOffice Oracle</strong> was engineered as an industry-grade Capstone Project (CBP 2026–27) within the <strong>Department of Information Technology</strong> at <strong>VNR Vignana Jyothi Institute of Engineering & Technology (VNRVJIET)</strong>.
          </p>
          <p className="text-zinc-400">
            The project addresses the high-uncertainty economic domain of theatrical filmmaking, translating data mining principles (OLAP, Association Rule Mining, Partition Clustering, Calibrated Ensembles, and Resampled Hypothesis Testing) into an actionable, interactive decision-support system.
          </p>
        </div>
      </section>

      {/* 2. Theatrical Commercial Hit Definition */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-100 font-bold font-display text-lg">
          <Scale className="w-5 h-5 text-emerald-500" />
          <h2>Ground-Truth Commercial Hit Definition</h2>
        </div>
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3 text-xs leading-relaxed">
          <p className="text-zinc-300">
            In film economics, theatrical box-office revenue does not translate 100% to studio gross. Exhibitors (movie theaters) retain approximately 45% to 55% of all box-office ticket receipts (known in industry accounting as the <em>theater split</em>).
          </p>

          {/* Mathematical Formula Box */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono space-y-2">
            <span className="text-[11px] text-zinc-500 uppercase">Commercial Success Metric</span>
            <div className="text-base text-amber-400 font-bold tracking-wide">
              ROI = Worldwide Box-Office Revenue / Production Budget &ge; 2.0
            </div>
            <p className="text-[11px] text-zinc-400">
              Films achieving &ge; 2.0x ROI are labeled <strong>Hit</strong> (N = 1,799 / 56.15%). Films with ROI &lt; 2.0x are labeled <strong>Flop</strong> (N = 1,405 / 43.85%).
            </p>
          </div>

          <p className="text-zinc-400">
            A 2.0x multiplier is the established theatrical benchmark where studio theatrical rentals cover initial capital expenditure.
          </p>
        </div>
      </section>

      {/* 3. The Zero-Leakage Protocol */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-100 font-bold font-display text-lg">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h2>The Zero-Leakage Protocol & Audit Safeguards</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Card A: Pre-Release Isolation */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono uppercase text-[11px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Strict Pre-Release Isolation</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Model A predictors are strictly restricted to attributes observable prior to production greenlight (budget, genres, scheduled release date, runtime, production companies, top-3 cast, director, franchise flag). Target revenue and post-release ratings are completely omitted.
            </p>
          </div>

          {/* Card B: Temporal Star Power */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono uppercase text-[11px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>2. Temporal Star Power (No Lookahead)</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Star power for actors and directors is computed strictly from films whose release date is <em>strictly prior</em> to the candidate film's release date. A 2010 film cannot access 2012 box-office results, eliminating lookahead bias.
            </p>
          </div>

          {/* Card C: Franchise Leakage Fix */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono uppercase text-[11px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>3. Franchise Retroactivity Fix</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              TMDb attaches <code>belongs_to_collection</code> retroactively. We enforce that <code>franchise = 1</code> only if another film in that collection was released strictly earlier. First instalments (e.g. <em>Saw 2004</em>, <em>Insidious 2010</em>) count as originals (0).
            </p>
          </div>

          {/* Card D: Out-of-Fold Honesty */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono uppercase text-[11px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>4. Out-of-Fold Cross-Validated Calibration</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              When inspecting movies from the training set, the frontend presents <code>out_of_fold_probability</code> as the headline metric. In-sample probabilities are isolated behind a disclosure toggle to guard against overfitting illusions.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TMDb Mandatory Attribution Notice */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-100 font-bold font-display text-lg">
          <Database className="w-5 h-5 text-blue-400" />
          <h2>TMDb Data Attribution & Usage Terms</h2>
        </div>
        <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-950/20 space-y-3 text-xs leading-relaxed">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              Mandatory Legal Notice
            </span>
          </div>
          <blockquote className="p-3 rounded-lg bg-zinc-950/80 border-l-4 border-blue-500 italic text-zinc-200">
            "This product uses the TMDb API but is not endorsed or certified by TMDb."
          </blockquote>
          <p className="text-zinc-400">
            All historical film metadata, poster references, budget and revenue figures, cast listings, and crew profiles originate from The Movie Database (TMDb) via public educational data dumps.
          </p>
        </div>
      </section>

      {/* 5. Limitations & Boundary Conditions */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-100 font-bold font-display text-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2>Known Model Limitations</h2>
        </div>
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3 text-xs text-zinc-300 leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Shared Cinematic Universes:</strong> Franchise identification operates at the TMDb Collection level. Shared cross-over universes without a common collection ID (e.g. <em>The Avengers 2012</em> following separate character films) are classified as originals.
            </li>
            <li>
              <strong>Post-Release Nature of Model B:</strong> Features such as <code>vote_count</code> and <code>popularity</code> are post-release engagement snapshots (recorded in 2017) and partly proxy for theatrical audience scale. Consequently, Model B serves an explanatory diagnostic function rather than a pre-release greenlight forecast.
            </li>
            <li>
              <strong>Ancillary Revenue Channels:</strong> Modern studio revenue includes streaming licenses, physical media, television syndication, and merchandising, which are absent from public box-office datasets.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};
