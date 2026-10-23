// frontend/src/components/Navbar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Clapperboard, 
  Sliders, 
  BarChart3, 
  Network, 
  Layers, 
  BookOpen, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Background health check
  const { data: health, isSuccess, isError } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });

  const navLinks = [
    { to: '/', label: 'Predictor', icon: Clapperboard },
    { to: '/whatif', label: 'What-If Simulator', icon: Sliders },
    { to: '/insights', label: 'Insights & OLAP', icon: BarChart3 },
    { to: '/patterns', label: 'Patterns & Rules', icon: Network },
    { to: '/models', label: 'Models & Benchmark', icon: Layers },
    { to: '/method', label: 'Methodology', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/80 dark:bg-zinc-950/85 border-b border-zinc-800/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Clapperboard className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-zinc-100 group-hover:text-amber-400 transition-colors font-display">
                  BoxOffice<span className="text-amber-500">Oracle</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  CBP 2026
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium tracking-wide hidden sm:block">
                Theatrical Commercial Intelligence
              </p>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Controls: Health Status & Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* API Health Pill */}
            <div 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border bg-zinc-900/60 border-zinc-800 text-zinc-400"
              title={isSuccess ? `API Online: ${health?.dataset_rows} movies indexed` : isError ? 'Backend Disconnected' : 'Checking status...'}
            >
              <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : isError ? 'bg-rose-500' : 'bg-amber-500'}`} />
              <span className="text-[11px]">
                {isSuccess ? 'API Live' : isError ? 'Offline' : 'Connecting'}
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/50 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800/80 bg-zinc-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};
