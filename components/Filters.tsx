import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, RotateCcw } from 'lucide-react';
import type { FilterState, SMSDirection, MessageType } from '../types';
import { COUNTRIES, PROVIDERS, DIRECTIONS, MESSAGE_TYPES, type CountryInfo } from '../constants';
import { countryFlag } from '../services/smsUtils';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resultCount: number;
}

/* ── Multi-select dropdown ─────────────────────────────────────────── */

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors
          ${selected.length > 0
            ? 'border-brand-400/40 bg-brand-500/10 text-brand-500 dark:text-brand-400'
            : 'border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {selected.length}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-ink-card border border-slate-200 dark:border-ink-border rounded-xl shadow-xl z-50 overflow-hidden">
          {options.length > 6 && (
            <div className="p-2 border-b border-slate-100 dark:border-ink-border">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full px-2.5 py-1.5 text-sm bg-slate-50 dark:bg-ink-muted rounded-lg border-0 outline-none placeholder:text-slate-400"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors
                  ${selected.includes(opt.value)
                    ? 'bg-brand-500/10 text-brand-500 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0
                  ${selected.includes(opt.value)
                    ? 'bg-brand-500 border-brand-500'
                    : 'border-slate-300 dark:border-slate-600'
                  }`}>
                  {selected.includes(opt.value) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 px-3 py-4 text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Toggle chips ───────────────────────────────────────────────────── */

interface ToggleChipsProps<T extends string> {
  options: { label: string; value: T }[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

function ToggleChips<T extends string>({ options, selected, onChange }: ToggleChipsProps<T>) {
  const toggle = (val: T) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };

  return (
    <div className="flex items-center gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggle(opt.value)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
            ${selected.includes(opt.value)
              ? 'chip-active border-brand-400/25 bg-brand-500/10 text-brand-500 dark:text-brand-400'
              : 'border-slate-200 dark:border-ink-border text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── Main Filters component ─────────────────────────────────────────── */

export const Filters: React.FC<FiltersProps> = ({ filters, setFilters, resultCount }) => {
  const hasFilters = filters.search || filters.countries.length > 0 || filters.providers.length > 0 ||
    filters.direction.length > 0 || filters.messageType.length > 0;

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.iso,
    label: `${countryFlag(c.iso)}  ${c.name}`,
  }));

  const providerOptions = PROVIDERS.map((p) => ({ value: p, label: p }));

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Country + Provider */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search country, provider..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-muted text-sm outline-none
              focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((f) => ({ ...f, search: '' }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <MultiSelect
          label="Country"
          options={countryOptions}
          selected={filters.countries}
          onChange={(countries) => setFilters((f) => ({ ...f, countries }))}
        />

        <MultiSelect
          label="Provider"
          options={providerOptions}
          selected={filters.providers}
          onChange={(providers) => setFilters((f) => ({ ...f, providers }))}
        />
      </div>

      {/* Row 2: Direction + Message Type + Result count + Reset */}
      <div className="flex flex-wrap items-center gap-3">
        <ToggleChips<SMSDirection>
          options={DIRECTIONS}
          selected={filters.direction}
          onChange={(direction) => setFilters((f) => ({ ...f, direction }))}
        />

        <span className="w-px h-5 bg-slate-200 dark:bg-ink-border hidden sm:block" />

        <ToggleChips<MessageType>
          options={MESSAGE_TYPES}
          selected={filters.messageType}
          onChange={(messageType) => setFilters((f) => ({ ...f, messageType }))}
        />

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </span>

          {hasFilters && (
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  countries: [],
                  providers: [],
                  direction: [],
                  messageType: [],
                  minPrice: 0,
                  maxPrice: 1,
                })
              }
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
