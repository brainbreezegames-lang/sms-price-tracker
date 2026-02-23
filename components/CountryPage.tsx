import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice, providerSlug } from '../services/smsUtils';
import { COUNTRY_MAP } from '../constants';
import { Badge } from './ui';

interface Props {
  data: SMSRate[];
}

export const CountryPage: React.FC<Props> = ({ data }) => {
  const { iso } = useParams<{ iso: string }>();
  const upperIso = (iso ?? '').toUpperCase();

  const countryRates = useMemo(
    () => data.filter((r) => r.country_iso === upperIso).sort((a, b) => a.price_usd - b.price_usd),
    [data, upperIso],
  );

  const countryInfo = COUNTRY_MAP.get(upperIso);
  const countryName = countryRates[0]?.country_name ?? countryInfo?.name ?? upperIso;
  const flag = countryFlag(upperIso);

  const outbound = useMemo(
    () => countryRates.filter((r) => r.direction === 'outbound' && r.message_type === 'sms'),
    [countryRates],
  );
  const inbound = useMemo(
    () => countryRates.filter((r) => r.direction === 'inbound' && r.message_type === 'sms'),
    [countryRates],
  );

  const cheapestOut = outbound[0];
  const providerCount = new Set(countryRates.map((r) => r.provider)).size;
  const avgPrice = outbound.length > 0
    ? outbound.reduce((sum, r) => sum + r.price_usd, 0) / outbound.length
    : 0;

  if (countryRates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-slate-500 dark:text-slate-400">No data available for this country.</p>
        <Link to="/compare" className="text-brand-500 text-sm mt-3 inline-block">Back to comparison</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link to="/compare" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-500 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        All Countries
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <span className="text-4xl">{flag}</span>
          SMS Pricing — {countryName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Compare SMS costs across {providerCount} providers for {countryName}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Cheapest', value: cheapestOut ? fmtSMSPrice(cheapestOut.price_usd) : 'N/A', sub: cheapestOut?.provider },
          { label: 'Average', value: fmtSMSPrice(avgPrice), sub: 'outbound SMS' },
          { label: 'Providers', value: `${providerCount}`, sub: 'with coverage' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="p-4 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="price text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Outbound table */}
      {outbound.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
            Outbound SMS
          </h2>
          <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Price/SMS</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Verify</th>
                  <th className="text-right px-4 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {outbound.map((rate, i) => (
                  <tr key={rate.id} className="sms-row border-b border-slate-100 dark:border-ink-border last:border-0">
                    <td className="px-4 py-2.5">
                      <Link to={`/provider/${providerSlug(rate.provider)}`} className="font-medium text-slate-800 dark:text-slate-200 hover:text-brand-500">
                        {rate.provider}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`price font-medium ${i === 0 ? 'text-brand-500 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {fmtSMSPrice(rate.price_usd)}
                      </span>
                      {i === 0 && <Badge variant="cheapest" size="xs" />}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                      {rate.verify_price_usd != null ? (
                        <span className="price text-slate-600 dark:text-slate-400">{fmtSMSPrice(rate.verify_price_usd)}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a href={rate.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-400">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inbound table */}
      {inbound.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
            Inbound SMS
          </h2>
          <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Price/SMS</th>
                  <th className="text-right px-4 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {inbound.map((rate, i) => (
                  <tr key={rate.id} className="sms-row border-b border-slate-100 dark:border-ink-border last:border-0">
                    <td className="px-4 py-2.5">
                      <Link to={`/provider/${providerSlug(rate.provider)}`} className="font-medium text-slate-800 dark:text-slate-200 hover:text-brand-500">
                        {rate.provider}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`price font-medium ${i === 0 ? 'text-brand-500 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {fmtSMSPrice(rate.price_usd)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <a href={rate.link} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-400">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
