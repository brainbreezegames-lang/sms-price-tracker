import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice, providerSlug, channelLabel, channelColor, PROVIDER_COLORS } from '../services/smsUtils';
import { Tooltip } from './ui';

interface Props {
  data: SMSRate[];
}

export const TrendsPage: React.FC<Props> = ({ data }) => {
  // Cheapest outbound SMS per country (using total_price_usd)
  const cheapestByCountry = useMemo(() => {
    const map = new Map<string, SMSRate>();
    data
      .filter((r) => r.direction === 'outbound' && r.message_type === 'sms')
      .forEach((r) => {
        const current = map.get(r.country_iso);
        if (!current || r.total_price_usd < current.total_price_usd) {
          map.set(r.country_iso, r);
        }
      });
    return Array.from(map.values()).sort((a, b) => a.total_price_usd - b.total_price_usd);
  }, [data]);

  // Provider stats (using total_price_usd)
  const providerStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; min: number }>();
    data
      .filter((r) => r.direction === 'outbound' && r.message_type === 'sms')
      .forEach((r) => {
        const s = map.get(r.provider) ?? { count: 0, total: 0, min: Infinity };
        s.count++;
        s.total += r.total_price_usd;
        s.min = Math.min(s.min, r.total_price_usd);
        map.set(r.provider, s);
      });
    return Array.from(map.entries())
      .map(([provider, s]) => ({ provider, ...s, avg: s.total / s.count }))
      .sort((a, b) => a.avg - b.avg);
  }, [data]);

  // Channel breakdown
  const channelStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; providers: Set<string> }>();
    data
      .filter((r) => r.direction === 'outbound')
      .forEach((r) => {
        const s = map.get(r.message_type) ?? { count: 0, total: 0, providers: new Set() };
        s.count++;
        s.total += r.total_price_usd;
        s.providers.add(r.provider);
        map.set(r.message_type, s);
      });
    return Array.from(map.entries())
      .map(([type, s]) => ({ type, ...s, providerCount: s.providers.size, avg: s.total / s.count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const maxAvg = Math.max(...providerStats.map((s) => s.avg), 0.001);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Messaging Price Trends
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Market overview of messaging pricing across providers, countries, and channels.
        </p>
      </div>

      {/* Channel overview */}
      <section aria-label="Channel overview">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">
          Channels Overview
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {channelStats.map((ch) => {
            const c = channelColor(ch.type);
            return (
              <Tooltip
                key={ch.type}
                content={`${channelLabel(ch.type)}: ${ch.count} outbound routes across ${ch.providerCount} providers. Average total cost: ${fmtSMSPrice(ch.avg)}/msg.`}
                side="bottom"
              >
                <div className="p-4 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card cursor-default">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
                      {channelLabel(ch.type)}
                    </span>
                  </div>
                  <p className="price text-xl font-bold text-slate-900 dark:text-white">{fmtSMSPrice(ch.avg)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">avg total cost/msg</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                    <span>{ch.providerCount} providers</span>
                    <span>{ch.count} routes</span>
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </section>

      {/* Provider average price chart */}
      <section aria-label="Average SMS price by provider">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">
          Average Total Price by Provider
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">(outbound SMS)</span>
        </h2>
        <div className="space-y-2" role="list">
          {providerStats.map((s) => (
            <Tooltip
              key={s.provider}
              content={`${s.provider}: avg ${fmtSMSPrice(s.avg)}/SMS (total cost incl. surcharges) across ${s.count} routes. Cheapest route: ${fmtSMSPrice(s.min)}.`}
              side="right"
            >
              <div className="flex items-center gap-3 cursor-default" role="listitem">
                <Link
                  to={`/provider/${providerSlug(s.provider)}`}
                  className="w-28 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-500 truncate"
                >
                  {s.provider}
                </Link>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-ink-muted rounded-lg overflow-hidden" role="presentation">
                  <div
                    className="h-full rounded-lg transition-all"
                    role="meter"
                    aria-label={`${s.provider} average price`}
                    aria-valuenow={Math.round(s.avg * 10000) / 10000}
                    aria-valuemin={0}
                    aria-valuemax={Math.round(maxAvg * 10000) / 10000}
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
                <Tooltip content={`${s.provider} covers ${s.count} different country route${s.count !== 1 ? 's' : ''}`} side="left">
                  <span className="text-xs text-slate-400 dark:text-slate-500 w-20 text-right cursor-default">
                    {s.count} route{s.count !== 1 ? 's' : ''}
                  </span>
                </Tooltip>
              </div>
            </Tooltip>
          ))}
        </div>
      </section>

      {/* Cheapest per country */}
      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">
          Cheapest Provider by Country
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">(total cost incl. surcharges)</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cheapestByCountry.map((rate) => (
            <Tooltip
              key={rate.country_iso}
              content={`${rate.provider} offers the best total rate to ${rate.country_name} at ${fmtSMSPrice(rate.total_price_usd)}/SMS${rate.carrier_surcharge_usd ? ` (incl. ${fmtSMSPrice(rate.carrier_surcharge_usd)} surcharge)` : ''}`}
              side="bottom"
            >
              <Link
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
                  {fmtSMSPrice(rate.total_price_usd)}
                </span>
              </Link>
            </Tooltip>
          ))}
        </div>
      </section>
    </div>
  );
};
