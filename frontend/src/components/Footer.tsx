// frontend/src/components/Footer.tsx
import React from 'react';
import { Clapperboard, ExternalLink, ShieldCheck, Database, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950/90 text-zinc-400 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Project Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clapperboard className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-zinc-100 font-display">
                BoxOffice<span className="text-amber-500">Oracle</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              A robust Machine Learning Decision Support System developed for theatrical film commercial feasibility analysis. Evaluates pre-production risk tiers using strictly leakage-free historical distributions and calibrated ensemble classifiers.
            </p>
            <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Zero-Leakage Protocol
              </span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                3,204 Verified TMDb Titles
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              Intelligence Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">
                  Predictive Feasibility Engine
                </Link>
              </li>
              <li>
                <Link to="/whatif" className="hover:text-amber-400 transition-colors">
                  Counterfactual What-If Studio
                </Link>
              </li>
              <li>
                <Link to="/insights" className="hover:text-amber-400 transition-colors">
                  Exploratory Data Analysis & OLAP
                </Link>
              </li>
              <li>
                <Link to="/patterns" className="hover:text-amber-400 transition-colors">
                  Class Association Rules & Clusters
                </Link>
              </li>
              <li>
                <Link to="/models" className="hover:text-amber-400 transition-colors">
                  Algorithmic Benchmark & CV Audits
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic & Attribution Credit */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              Academic Context
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong>VNR Vignana Jyothi Institute of Engineering & Technology</strong><br />
              Department of Information Technology<br />
              Capstone Project (CBP) 2026–27
            </p>
            <div className="pt-2">
              <Link 
                to="/method"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Read Methodology & Audit Logs &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* TMDb Mandatory Attribution & Copyright */}
        <div className="border-t border-zinc-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono text-[10px]">
              TMDb Attribution
            </span>
            <p className="text-zinc-400 italic">
              "This product uses the TMDb API but is not endorsed or certified by TMDb."
            </p>
          </div>
          <p className="text-zinc-400 text-center md:text-right">
            &copy; 2026–2027 BoxOffice Oracle. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
