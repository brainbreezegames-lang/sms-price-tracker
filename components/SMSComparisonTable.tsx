import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SMSRate, SortState, SortField } from '../types';
import { countryFlag, fmtSMSPrice, providerSlug, channelLabel, channelColor } from '../services/smsUtils';
import { ITEMS_PER_PAGE } from '../constants';
import { Tooltip, InfoTooltip } from './ui';

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

/* ── Sort header ────────────────────────────────────────────────── */

const SortHeader: React.FC<{
  label: string;
  field: SortField;
  sort: SortState;
  onSort: (f: SortField) => void;
  align?: 'left' | 'right';
}> = ({ label, field, sort, onSort, align = 'left' }) => {
  const active = sort.field === field;
  const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  const sortLabel = active
    ? `Sort by ${label}, currently ${sort.direction === 'asc' ? 'ascending' : 'descending'}`
    : `Sort by ${label}`;

  return (
    <button
      onClick={() => onSort(field)}
      aria-label={sortLabel}
      className={`group inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider
        ${active ? 'text-brand-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
        transition-colors ${align === 'right' ? 'justify-end w-full' : ''}`}
    >
      {label}
      <Icon className={`w-3 h-3 ${active ? '' : 'opacity-30 group-hover:opacity-60'}`} />
    </button>
  );
};

/* ── Loading skeleton ──────────────────────────────────────────── */

const SkeletonRow: React.FC = () => (
  <tr className="border-b border-slate-100 dark:border-ink-border last:border-0">
    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-slate-200 dark:bg-ink-muted animate-pulse" /><div className="w-24 h-4 rounded bg-slate-200 dark:bg-ink-muted animate-pulse" /></div></td>
    <td className="px-4 py-3"><div className="w-16 h-4 rounded bg-slate-200 dark:bg-ink-muted animate-pulse" /></td>
    <td className="px-4 py-3"><div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-ink-muted animate-pulse" /></td>
    <td className="px-4 py-3"><div className="w-14 h-5 rounded-full bg-slate-200 dark:bg-ink-muted animate-pulse" /></td>
    <td className="px-4 py-3 text-right"><div className="w-16 h-4 rounded bg-slate-200 dark:bg-ink-muted animate-pulse ml-auto" /></td>
    <td className="px-4 py-3 text-right hidden sm:table-cell"><div className="w-16 h-4 rounded bg-slate-200 dark:bg-ink-muted animate-pulse ml-auto" /></td>
    <td className="px-4 py-3 text-right hidden md:table-cell"><div className="w-14 h-4 rounded bg-slate-200 dark:bg-ink-muted animate-pulse ml-auto" /></td>
    <td className="px-4 py-3 text-right"><div className="w-10 h-4 rounded bg-slate-200 dark:bg-ink-muted animate-pulse ml-auto" /></td>
  </tr>
);

/* ── Channel badge ────────────────────────────────────────────── */

const ChannelBadge: React.FC<{ type: string }> = ({ type }) => {
  const c = channelColor(type);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
      {channelLabel(type)}
    </span>
  );
};

/* ── Main table ─────────────────────────────────────────────────── */

export const SMSComparisonTable: React.FC<Props> = ({
  data, totalCount, sort, setSort, isLoading, page, pageCount, setPage,
}) => {
  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const cheapestByCountry = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((r) => {
      const key = `${r.country_iso}-${r.direction}-${r.message_type}`;
      const current = map.get(key);
      if (current === undefined || r.total_price_usd < current) map.set(key, r.total_price_usd);
    });
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden" role="status" aria-label="Loading pricing data">
        <p className="sr-only">Comparing prices across 13 providers, please wait...</p>
        <table className="w-full text-sm">
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 border border-slate-200 dark:border-ink-border rounded-xl" role="status">
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">No rates match your current filters</p>
        <p className="text-slate-500 dark:text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">
          Try removing a filter, broadening your search, or selecting a different country or provider.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm" aria-label="Messaging pricing comparison">
          <thead>
            <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
              <th scope="col" className="text-left px-4 py-2.5" aria-sort={sort.field === 'country_name' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                <SortHeader label="Country" field="country_name" sort={sort} onSort={handleSort} />
              </th>
              <th scope="col" className="text-left px-4 py-2.5" aria-sort={sort.field === 'provider' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                <SortHeader label="Provider" field="provider" sort={sort} onSort={handleSort} />
              </th>
              <th scope="col" className="text-left px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Channel</span>
                  <InfoTooltip content="SMS, MMS, WhatsApp, or RCS — each has different pricing and capabilities." side="bottom" />
                </div>
              </th>
              <th scope="col" className="text-left px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Dir</span>
                  <InfoTooltip content="Outbound = you send to users (OTP, alerts). Inbound = users text your number." side="bottom" />
                </div>
              </th>
              <th scope="col" className="text-right px-4 py-2.5" aria-sort={sort.field === 'price_usd' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                <SortHeader label="Base Price" field="price_usd" sort={sort} onSort={handleSort} align="right" />
              </th>
              <th scope="col" className="text-right px-4 py-2.5 hidden sm:table-cell" aria-sort={sort.field === 'total_price_usd' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                <div className="flex items-center gap-1 justify-end">
                  <InfoTooltip content="Base price plus carrier surcharges. This is the real cost you'll pay per message." side="bottom" />
                  <SortHeader label="Total" field="total_price_usd" sort={sort} onSort={handleSort} align="right" />
                </div>
              </th>
              <th scope="col" className="text-right px-4 py-2.5 hidden md:table-cell" aria-sort={sort.field === 'verify_price_usd' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                <div className="flex items-center gap-1 justify-end">
                  <InfoTooltip content="Price for using the provider's Verify/OTP API instead of raw SMS. Usually costs more but handles delivery, retry, and fraud detection." side="bottom" />
                  <SortHeader label="Verify" field="verify_price_usd" sort={sort} onSort={handleSort} align="right" />
                </div>
              </th>
              <th scope="col" className="text-right px-4 py-2.5 w-16">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((rate) => {
              const isCheapest = rate.total_price_usd === cheapestByCountry.get(`${rate.country_iso}-${rate.direction}-${rate.message_type}`);

              return (
                <tr
                  key={rate.id}
                  className="sms-row border-b border-slate-100 dark:border-ink-border last:border-0"
                >
                  {/* Country */}
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/country/${rate.country_iso.toLowerCase()}`}
                      className="flex items-center gap-2 min-w-0 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                    >
                      <span className="text-base shrink-0" role="img" aria-label={rate.country_name}>{countryFlag(rate.country_iso)}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{rate.country_name}</span>
                    </Link>
                  </td>

                  {/* Provider */}
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/provider/${providerSlug(rate.provider)}`}
                      className="font-medium text-slate-700 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                    >
                      {rate.provider}
                    </Link>
                  </td>

                  {/* Channel */}
                  <td className="px-4 py-2.5">
                    <ChannelBadge type={rate.message_type} />
                  </td>

                  {/* Direction */}
                  <td className="px-4 py-2.5">
                    <Tooltip
                      content={rate.direction === 'outbound'
                        ? 'You send this message to the user'
                        : 'The user sends this message to you'}
                      side="right"
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        rate.direction === 'outbound'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400'
                          : 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400'
                      }`}>
                        {rate.direction === 'outbound' ? 'Out' : 'In'}
                      </span>
                    </Tooltip>
                  </td>

                  {/* Base Price */}
                  <td className="px-4 py-2.5 text-right">
                    <span className="price font-medium text-slate-600 dark:text-slate-400">
                      {fmtSMSPrice(rate.price_usd)}
                    </span>
                    {rate.carrier_surcharge_usd != null && rate.carrier_surcharge_usd > 0 && (
                      <Tooltip content={`+${fmtSMSPrice(rate.carrier_surcharge_usd)} carrier surcharge per message`} side="left">
                        <span className="ml-1 text-[10px] text-amber-500 dark:text-amber-400 cursor-default">
                          +fee
                        </span>
                      </Tooltip>
                    )}
                  </td>

                  {/* Total Price */}
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                    <span className={`price font-semibold ${
                      isCheapest ? 'text-brand-500 dark:text-brand-400' : 'text-slate-800 dark:text-slate-100'
                    }`}>
                      {fmtSMSPrice(rate.total_price_usd)}
                    </span>
                    {isCheapest && (
                      <Tooltip content={`Best total price for ${channelLabel(rate.message_type)} ${rate.direction} to ${rate.country_name}`} side="left">
                        <span className="ml-1.5 text-[10px] font-semibold text-brand-500 dark:text-brand-400/80 cursor-default">
                          Best
                        </span>
                      </Tooltip>
                    )}
                  </td>

                  {/* Verify */}
                  <td className="px-4 py-2.5 text-right hidden md:table-cell">
                    {rate.verify_price_usd != null ? (
                      <Tooltip content={`${rate.provider} charges ${fmtSMSPrice(rate.verify_price_usd)} per OTP via their Verify API`} side="left">
                        <span className="price text-slate-600 dark:text-slate-400 cursor-default">{fmtSMSPrice(rate.verify_price_usd)}</span>
                      </Tooltip>
                    ) : (
                      <Tooltip content={`${rate.provider} doesn't offer a separate Verify API price for this route`} side="left">
                        <span className="text-slate-300 dark:text-slate-600 cursor-default" aria-label="Not available">&mdash;</span>
                      </Tooltip>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-2.5 text-right">
                    <Tooltip content={`Open ${rate.provider}'s pricing page`} side="left">
                      <a
                        href={rate.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${rate.provider} pricing for ${rate.country_name}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-500 dark:text-brand-500 hover:text-brand-400 transition-colors py-1"
                      >
                        Visit
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <nav className="flex items-center justify-between mt-4 px-1" aria-label="Table pagination">
          <Tooltip content={`Viewing page ${page} of ${pageCount}`} side="right">
            <p className="text-xs text-slate-500 tabular-nums cursor-default" aria-live="polite">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}&ndash;{Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} rates
            </p>
          </Tooltip>
          <div className="flex items-center gap-1">
            <Tooltip content={page === 1 ? "You're on the first page" : 'Go to previous page'} side="top">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-ink-border text-slate-400
                  hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content={page === pageCount ? "You're on the last page" : 'Go to next page'} side="top">
              <button
                onClick={() => setPage(Math.min(pageCount, page + 1))}
                disabled={page === pageCount}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-ink-border text-slate-400
                  hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </nav>
      )}
    </div>
  );
};
