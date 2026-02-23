import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice, providerSlug, PROVIDER_COLORS } from '../services/smsUtils';

interface Props {
  data: SMSRate[];
}

export const TrendsPage: React.FC<Props> = ({ data }) => {
  // Cheapest outbound SMS per country
  const cheapestByCountry = useMemo(() => {
    const map = new Map<string, SMSRate>();
    data
      .filter((r) => r.direction === 'outbound' && r.message_type === 'sms')
      .forEach((r) => {
        const current = map.get(r.country_iso);
        if (!current || r.price_usd < current.price_usd) {
          map.set(r.country_iso, r);
        }
      });
    return Array.from(map.values()).sort((a, b) => a.price_usd - b.price_usd);
  }, [data]);

  // Provider stats
  const providerStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; min: number }>();
    data
      .filter((r) => r.direction === 'outbound' && r.message_type === 'sms')
      .forEach((r) => {
        const s = map.get(r.provider) ?? { count: 0, total: 0, min: Infinity };
        s.count++;
        s.total += r.price_usd;
        s.min = Math.min(s.min, r.price_usd);
        map.set(r.provider, s);
      });
    return Array.from(map.entries())
      .map(([provider, s]) => ({ provider, ...s, avg: s.total / s.count }))
      .sort((a, b) => a.avg - b.avg);
  }, [data]);

  const maxAvg = Math.max(...providerStats.map((s) => s.avg), 0.001);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          SMS Price Trends
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Market overview of SMS pricing across providers and countries.
        </p>
      </div>

      {/* Provider average price chart */}
      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">
          Average Price by Provider
        </h2>
        <div className="space-y-2">
          {providerStats.map((s) => (
            <div key={s.provider} className="flex items-center gap-3">
              <Link
                to={`/provider/${providerSlug(s.provider)}`}
                className="w-28 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-500 truncate"
              >
                {s.provider}
              </Link>
              <div className="flex-1 h-6 bg-slate-100 dark:bg-ink-muted rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all"
                  style={{
                    width: `${(s.avg / maxAvg) * 100}%`,
                    backgroundColor: PROVIDER_COLORS[s.provider] ?? '#06b6d4',
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="price text-sm font-medium text-slate-600 dark:text-slate-400 w-16 text-right">
                {fmtSMSPrice(s.avg)}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 w-20 text-right">
                {s.count} route{s.count !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Cheapest per country */}
      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">
          Cheapest Provider by Country
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cheapestByCountry.map((rate) => (
            <Link
              key={rate.country_iso}
              to={`/country/${rate.country_iso.toLowerCase()}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-ink-border
                bg-white dark:bg-ink-card hover:border-brand-400/40 transition-colors"
            >
              <span className="text-xl">{countryFlag(rate.country_iso)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{rate.country_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{rate.provider}</p>
              </div>
              <span className="price text-sm font-bold text-brand-500 dark:text-brand-400 shrink-0">
                {fmtSMSPrice(rate.price_usd)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
