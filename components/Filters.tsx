import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, ChevronDown, RotateCcw } from 'lucide-react';
import type { FilterState, SMSDirection, MessageType } from '../types';
import { COUNTRIES, PROVIDERS, DIRECTIONS, MESSAGE_TYPES } from '../constants';
import { countryFlag } from '../services/smsUtils';
import { Tooltip } from './ui';

interface FiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resultCount: number;
}

/* ── Tooltip content for chips ─────────────────────────────────── */

const DIRECTION_TIPS: Record<string, string> = {
  outbound: 'Messages your app sends to users — like OTP codes or alerts',
  inbound: 'Messages users send back to your number',
};

const MESSAGE_TYPE_TIPS: Record<string, string> = {
  sms: 'Standard text messages — up to 160 characters',
  mms: 'Rich messages with images, video, or audio',
  whatsapp: 'WhatsApp Business API — per-conversation pricing',
  rcs: 'Rich Communication Services — next-gen SMS with rich media',
};

/* ── Removable chip ────────────────────────────────────────────── */

const FilterChip: React.FC<{
  label: string;
  onRemove: () => void;
}> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-xs font-medium
    bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-400/25
    transition-colors group">
    <span className="truncate max-w-[140px]">{label}</span>
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className="shrink-0 w-4 h-4 rounded-full inline-flex items-center justify-center
        text-brand-400/60 hover:text-brand-600 dark:hover:text-brand-300
        hover:bg-brand-500/20 transition-colors"
      aria-label={`Remove ${label} filter`}
    >
      <X className="w-2.5 h-2.5" aria-hidden="true" />
    </button>
  </span>
);

/* ── Multi-select dropdown ─────────────────────────────────────── */

interface MultiSelectProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  tooltip?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, tooltip }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const dropdownId = `dropdown-${label.toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      const trigger = ref.current?.querySelector('button');
      trigger?.focus();
    }
  }, [open]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Sort: selected items on top, then filter by search
  const sortedOptions = useMemo(() => {
    const base = search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

    if (selected.length === 0 || search) return base;

    const selectedSet = new Set(selected);
    const top = base.filter((o) => selectedSet.has(o.value));
    const rest = base.filter((o) => !selectedSet.has(o.value));
    return [...top, ...rest];
  }, [options, selected, search]);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };

  const triggerButton = (
    <button
      onClick={() => { setOpen(!open); setSearch(''); }}
      aria-expanded={open}
      aria-controls={dropdownId}
      aria-label={`Filter by ${label}${selected.length > 0 ? `, ${selected.length} selected` : ''}`}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors
        ${selected.length > 0
          ? 'border-brand-400/40 bg-brand-500/10 text-brand-500 dark:text-brand-400'
          : 'border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
    >
      {label}
      {selected.length > 0 && (
        <span className="bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center" aria-hidden="true">
          {selected.length}
        </span>
      )}
      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
  );

  return (
    <div ref={ref} className="relative">
      {tooltip ? (
        <Tooltip content={tooltip} side="bottom">
          {triggerButton}
        </Tooltip>
      ) : triggerButton}

      {open && (
        <div
          id={dropdownId}
          role="listbox"
          aria-label={`${label} options`}
          aria-multiselectable="true"
          className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-ink-card border border-slate-200 dark:border-ink-border rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* Search + clear header */}
          <div className="p-2 border-b border-slate-100 dark:border-ink-border">
            {options.length > 6 && (
              <div className="relative">
                <label className="sr-only" htmlFor={`${dropdownId}-search`}>Search {label.toLowerCase()}</label>
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <input
                  id={`${dropdownId}-search`}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="w-full pl-7 pr-2.5 py-1.5 text-sm bg-slate-50 dark:bg-ink-muted rounded-lg border-0 outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            )}
            {selected.length > 0 && (
              <div className={`flex items-center justify-between ${options.length > 6 ? 'mt-1.5 pt-1.5 border-t border-slate-100 dark:border-ink-border' : ''}`}>
                <span className="text-[11px] text-slate-400">{selected.length} selected</span>
                <button
                  onClick={() => onChange([])}
                  className="text-[11px] text-brand-500 hover:text-brand-400 font-medium transition-colors"
                >
                  Clear {label.toLowerCase()}
                </button>
              </div>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
            {/* Divider between selected and unselected when not searching */}
            {sortedOptions.map((opt, i) => {
              const isSelected = selected.includes(opt.value);
              const prevSelected = i > 0 && selected.includes(sortedOptions[i - 1].value);
              const showDivider = !search && !isSelected && prevSelected;

              return (
                <React.Fragment key={opt.value}>
                  {showDivider && (
                    <div className="mx-2 my-1 border-t border-slate-100 dark:border-ink-border" />
                  )}
                  <button
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(opt.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors
                      ${isSelected
                        ? 'bg-brand-500/10 text-brand-500 dark:text-brand-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0
                      ${isSelected
                        ? 'bg-brand-500 border-brand-500'
                        : 'border-slate-300 dark:border-slate-600'
                      }`} aria-hidden="true">
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {opt.label}
                  </button>
                </React.Fragment>
              );
            })}
            {sortedOptions.length === 0 && (
              <p className="text-xs text-slate-400 px-3 py-4 text-center">No matches found. Try a different term.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Toggle chips with tooltips ────────────────────────────────── */

interface ToggleChipsProps<T extends string> {
  options: { label: string; value: T }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  groupLabel: string;
  tooltips?: Record<string, string>;
}

function ToggleChips<T extends string>({ options, selected, onChange, groupLabel, tooltips }: ToggleChipsProps<T>) {
  const toggle = (val: T) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={groupLabel}>
      {options.map((opt) => {
        const btn = (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            aria-pressed={selected.includes(opt.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
              ${selected.includes(opt.value)
                ? 'chip-active border-brand-400/25 bg-brand-500/10 text-brand-500 dark:text-brand-400'
                : 'border-slate-200 dark:border-ink-border text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
          >
            {opt.label}
          </button>
        );

        const tip = tooltips?.[opt.value];
        if (tip) {
          return (
            <Tooltip key={opt.value} content={tip} side="bottom">
              {btn}
            </Tooltip>
          );
        }
        return btn;
      })}
    </div>
  );
}

/* ── Country name lookup ────────────────────────────────────────── */
const COUNTRY_NAME_MAP = new Map(COUNTRIES.map((c) => [c.iso, c.name]));

/* ── Main Filters component ─────────────────────────────────────── */

export const Filters: React.FC<FiltersProps> = ({ filters, setFilters, resultCount }) => {
  const hasFilters = filters.search || filters.countries.length > 0 || filters.providers.length > 0 ||
    filters.direction.length > 0 || filters.messageType.length > 0;

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.countries.length +
    filters.providers.length +
    filters.direction.length +
    filters.messageType.length;

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.iso,
    label: `${countryFlag(c.iso)}  ${c.name}`,
  }));

  const providerOptions = PROVIDERS.map((p) => ({ value: p, label: p }));

  const removeCountry = (iso: string) => {
    setFilters((f) => ({ ...f, countries: f.countries.filter((c) => c !== iso) }));
  };

  const removeProvider = (p: string) => {
    setFilters((f) => ({ ...f, providers: f.providers.filter((x) => x !== p) }));
  };

  const removeDirection = (d: SMSDirection) => {
    setFilters((f) => ({ ...f, direction: f.direction.filter((x) => x !== d) }));
  };

  const removeMessageType = (m: MessageType) => {
    setFilters((f) => ({ ...f, messageType: f.messageType.filter((x) => x !== m) }));
  };

  const clearAll = () => {
    setFilters({
      search: '',
      countries: [],
      providers: [],
      direction: [],
      messageType: [],
      minPrice: 0,
      maxPrice: 1,
    });
  };

  return (
    <div className="space-y-3" role="search" aria-label="Filter SMS rates">
      {/* Row 1: Search + Country + Provider */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <label htmlFor="sms-search" className="sr-only">Search by country or provider name</label>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            id="sms-search"
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search country, provider..."
            className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-muted text-sm outline-none
              focus:border-brand-400 focus:ring-1 focus:ring-brand-400/30 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {filters.search && (
            <Tooltip content="Clear search" side="right">
              <button
                onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600
                  dark:hover:text-slate-300 p-0.5 rounded transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </Tooltip>
          )}
        </div>

        <MultiSelect
          label="Country"
          options={countryOptions}
          selected={filters.countries}
          onChange={(countries) => setFilters((f) => ({ ...f, countries }))}
          tooltip="Pick one or more countries to compare"
        />

        <MultiSelect
          label="Provider"
          options={providerOptions}
          selected={filters.providers}
          onChange={(providers) => setFilters((f) => ({ ...f, providers }))}
          tooltip="Filter by specific SMS providers"
        />
      </div>

      {/* Row 2: Direction + Message Type + Result count + Clear all */}
      <div className="flex flex-wrap items-center gap-3">
        <ToggleChips<SMSDirection>
          options={DIRECTIONS}
          selected={filters.direction}
          onChange={(direction) => setFilters((f) => ({ ...f, direction }))}
          groupLabel="Filter by direction"
          tooltips={DIRECTION_TIPS}
        />

        <span className="w-px h-5 bg-slate-200 dark:bg-ink-border hidden sm:block" aria-hidden="true" />

        <ToggleChips<MessageType>
          options={MESSAGE_TYPES}
          selected={filters.messageType}
          onChange={(messageType) => setFilters((f) => ({ ...f, messageType }))}
          groupLabel="Filter by message type"
          tooltips={MESSAGE_TYPE_TIPS}
        />

        <div className="ml-auto flex items-center gap-3">
          <Tooltip content={`${resultCount} rate${resultCount !== 1 ? 's' : ''} match your current filters`} side="bottom">
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums cursor-default" aria-live="polite" aria-atomic="true">
              {resultCount} result{resultCount !== 1 ? 's' : ''}
            </span>
          </Tooltip>

          {hasFilters && (
            <Tooltip content="Remove all active filters and start fresh" side="bottom">
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
                  text-slate-500 dark:text-slate-400
                  hover:text-red-600 dark:hover:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-500/10
                  border border-transparent hover:border-red-200 dark:hover:border-red-500/20
                  transition-all"
                aria-label={`Clear all ${activeFilterCount} active filters`}
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Clear all
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Row 3: Active filter chips — individually removable */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1" aria-label="Active filters" role="list">
          {/* Search term chip */}
          {filters.search && (
            <FilterChip
              label={`"${filters.search}"`}
              onRemove={() => setFilters((f) => ({ ...f, search: '' }))}
            />
          )}

          {/* Country chips */}
          {filters.countries.map((iso) => (
            <FilterChip
              key={`c-${iso}`}
              label={`${countryFlag(iso)} ${COUNTRY_NAME_MAP.get(iso) ?? iso}`}
              onRemove={() => removeCountry(iso)}
            />
          ))}

          {/* Provider chips */}
          {filters.providers.map((p) => (
            <FilterChip
              key={`p-${p}`}
              label={p}
              onRemove={() => removeProvider(p)}
            />
          ))}

          {/* Direction chips */}
          {filters.direction.map((d) => (
            <FilterChip
              key={`d-${d}`}
              label={d === 'outbound' ? 'Outbound' : 'Inbound'}
              onRemove={() => removeDirection(d)}
            />
          ))}

          {/* Message type chips */}
          {filters.messageType.map((m) => (
            <FilterChip
              key={`m-${m}`}
              label={m === 'sms' ? 'SMS' : m === 'mms' ? 'MMS' : 'Verify / OTP'}
              onRemove={() => removeMessageType(m)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
