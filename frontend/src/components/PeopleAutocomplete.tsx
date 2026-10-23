// frontend/src/components/PeopleAutocomplete.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X, Check, Film, DollarSign, Award } from 'lucide-react';
import { api } from '../api/client';
import { PersonSearchItem } from '../types/api';

interface PeopleAutocompleteProps {
  label: string;
  placeholder?: string;
  role: 'actor' | 'director';
  maxSelections?: number;
  selected: string[];
  onChange: (names: string[]) => void;
  helperText?: string;
}

export const PeopleAutocomplete: React.FC<PeopleAutocompleteProps> = ({
  label,
  placeholder = 'Type to search or add custom name...',
  role,
  maxSelections = 1,
  selected,
  onChange,
  helperText,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const matches = await api.searchPeople(query.trim(), role);
        setResults(matches);
      } catch (err) {
        console.error('Error searching people:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, role]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    if (maxSelections === 1) {
      onChange([name]);
      setIsOpen(false);
      setQuery('');
    } else {
      if (!selected.includes(name) && selected.length < maxSelections) {
        onChange([...selected, name]);
      }
      setQuery('');
      if (selected.length + 1 >= maxSelections) {
        setIsOpen(false);
      }
    }
  };

  const handleRemove = (nameToRemove: string) => {
    onChange(selected.filter(n => n !== nameToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        handleSelect(query.trim());
      }
    }
  };

  const isMaxReached = selected.length >= maxSelections;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
          {label} {maxSelections > 1 ? `(${selected.length}/${maxSelections})` : ''}
        </label>
        {helperText && <span className="text-[11px] text-zinc-400">{helperText}</span>}
      </div>

      {/* Selected Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
            >
              <User className="w-3 h-3 text-amber-400" />
              <span>{name}</span>
              <button
                type="button"
                onClick={() => handleRemove(name)}
                className="hover:text-amber-100 hover:bg-amber-500/20 rounded p-0.5 transition-colors"
                aria-label={`Remove ${name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input (disabled if max reached) */}
      {!isMaxReached ? (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-700/80 bg-zinc-900/80 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
          />

          {/* Autocomplete Dropdown */}
          {isOpen && (query.trim().length >= 1 || results.length > 0) && (
            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900/95 backdrop-blur-md shadow-xl z-30 divide-y divide-zinc-800/80">
              {isLoading && (
                <div className="p-3 text-xs text-zinc-400 text-center animate-pulse">
                  Searching historical database...
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider bg-zinc-950/60">
                    Historical Database Records ({role === 'actor' ? 'Cast' : 'Director'})
                  </div>
                  {results.map((person) => {
                    const isAlreadySelected = selected.includes(person.name);
                    const hitPct = Math.round(person.past_hit_rate * 100);
                    const avgRevMillions = (person.avg_past_revenue / 1_000_000).toFixed(1);

                    return (
                      <button
                        key={person.name}
                        type="button"
                        disabled={isAlreadySelected}
                        onClick={() => handleSelect(person.name)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-3 hover:bg-zinc-800/60 transition-colors ${
                          isAlreadySelected ? 'opacity-40 cursor-not-allowed bg-zinc-950/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-zinc-200">{person.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                              <span className="flex items-center gap-0.5">
                                <Film className="w-2.5 h-2.5" />
                                {person.film_count} {person.film_count === 1 ? 'film' : 'films'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-emerald-400">
                                <Award className="w-2.5 h-2.5" />
                                {hitPct}% hit rate
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <DollarSign className="w-2.5 h-2.5" />
                                ${avgRevMillions}M avg rev
                              </span>
                            </div>
                          </div>
                        </div>

                        {isAlreadySelected ? (
                          <Check className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <span className="text-[10px] text-amber-400 font-mono">Select</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Custom option when query isn't empty */}
              {!isLoading && query.trim().length > 0 && !results.some(r => r.name.toLowerCase() === query.trim().toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => handleSelect(query.trim())}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-amber-500/10 text-amber-300 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Add "<strong>{query.trim()}</strong>" (New / No Historical Record)</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Press Enter</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-zinc-500 italic">
          Maximum selections reached. Remove an item above to change.
        </div>
      )}
    </div>
  );
};
