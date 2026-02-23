import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SMSRate, SortState, SortField } from '../types';
import { Badge } from './ui';
import { countryFlag, fmtSMSPrice, providerSlug } from '../services/smsUtils';
import { ITEMS_PER_PAGE } from '../constants';

interface Props {
  data: SMSRate[];
  totalCount: number;
  sort: SortState;
  setSort: React.Dispatch<React.SetStateAction<SortState>>;
  isLoading: boolean;
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
}

/* ── Sort header ────────────────────────────────────────────────────── */

const SortHeader: React.FC<{
  label: string;
  field: SortField;
  sort: SortState;
  onSort: (f: SortField) => void;
  className?: string;
}> = ({ label, field, sort, onSort, className }) => {
  const active = sort.field === field;
  const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      onClick={() => onSort(field)}
      className={`group flex items-center gap-1 text-xs font-semibold uppercase tracking-wider
        ${active ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
        transition-colors ${className ?? ''}`}
    >
      {label}
      <Icon className={`w-3 h-3 ${active ? '' : 'opacity-40 group-hover:opacity-70'}`} />
    </button>
  );
};

/* ── Loading skeleton ──────────────────────────────────────────────── */

const SkeletonRow: React.FC = () => (
  <tr className="border-b border-slate-100 dark:border-ink-border">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-slate-200 dark:bg-ink-muted rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
);

/* ── Main table ─────────────────────────────────────────────────────── */

export const SMSComparisonTable: React.FC<Props> = ({
  data,
  totalCount,
  sort,
  setSort,
  isLoading,
  page,
  pageCount,
  setPage,
}) => {
  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Find cheapest price per country to highlight
  const cheapestByCountry = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((r) => {
      const key = `${r.country_iso}-${r.direction}`;
      const current = map.get(key);
      if (current === undefined || r.price_usd < current) {
        map.set(key, r.price_usd);
      }
    });
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 border border-slate-200 dark:border-ink-border rounded-xl">
        <p className="text-slate-500 dark:text-slate-400 text-sm">No results match your filters.</p>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Try adjusting your filters or search term.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
              <th className="text-left px-4 py-3">
                <SortHeader label="Country" field="country_name" sort={sort} onSort={handleSort} />
              </th>
              <th className="text-left px-4 py-3">
                <SortHeader label="Provider" field="provider" sort={sort} onSort={handleSort} />
              </th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">
                <SortHeader label="Operator" field="operator_name" sort={sort} onSort={handleSort} />
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Dir</span>
              </th>
              <th className="text-right px-4 py-3">
                <SortHeader label="Price/SMS" field="price_usd" sort={sort} onSort={handleSort} className="justify-end" />
              </th>
              <th className="text-right px-4 py-3 hidden md:table-cell">
                <SortHeader label="Verify" field="verify_price_usd" sort={sort} onSort={handleSort} className="justify-end" />
              </th>
              <th className="text-right px-4 py-3 w-20">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((rate) => {
              const isCheapest = rate.price_usd === cheapestByCountry.get(`${rate.country_iso}-${rate.direction}`);

              return (
                <tr key={rate.id} className="sms-row border-b border-slate-100 dark:border-ink-border last:border-0">
                  {/* Country */}
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/country/${rate.country_iso.toLowerCase()}`}
                      className="flex items-center gap-2 hover:text-brand-500 transition-colors"
                    >
                      <span className="text-base">{countryFlag(rate.country_iso)}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{rate.country_name}</span>
                    </Link>
                  </td>

                  {/* Provider */}
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/provider/${providerSlug(rate.provider)}`}
                      className="text-slate-700 dark:text-slate-300 hover:text-brand-500 transition-colors font-medium"
                    >
                      {rate.provider}
                    </Link>
                  </td>

                  {/* Operator */}
                  <td className="px-4 py-2.5 hidden lg:table-cell text-slate-500 dark:text-slate-400">
                    {rate.operator_name ?? 'All operators'}
                  </td>

                  {/* Direction */}
                  <td className="px-4 py-2.5">
                    <Badge variant={rate.direction} />
                  </td>

                  {/* Price */}
                  <td className="px-4 py-2.5 text-right">
                    <span className={`price font-medium ${isCheapest ? 'text-brand-500 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {fmtSMSPrice(rate.price_usd)}
                    </span>
                    {isCheapest && <Badge variant="cheapest" size="xs" />}
                  </td>

                  {/* Verify price */}
                  <td className="px-4 py-2.5 text-right hidden md:table-cell">
                    {rate.verify_price_usd != null ? (
                      <span className="price text-slate-600 dark:text-slate-400">{fmtSMSPrice(rate.verify_price_usd)}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 text-xs">&mdash;</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-2.5 text-right">
                    <a
                      href={rate.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-400 transition-colors"
                    >
                      Visit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            Page {page} of {pageCount} &middot; {totalCount} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-ink-border text-slate-500 dark:text-slate-400
                hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(pageCount, page + 1))}
              disabled={page === pageCount}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-ink-border text-slate-500 dark:text-slate-400
                hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
