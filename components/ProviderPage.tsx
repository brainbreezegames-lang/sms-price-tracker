import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice, providerFromSlug, PROVIDER_SIGNUP_URLS } from '../services/smsUtils';

interface Props {
  data: SMSRate[];
}

export const ProviderPage: React.FC<Props> = ({ data }) => {
  const { slug } = useParams<{ slug: string }>();
  const providerName = providerFromSlug(slug ?? '') ?? slug ?? '';

  const providerRates = useMemo(
    () =>
      data
        .filter((r) => r.provider.toLowerCase() === providerName.toLowerCase() && r.direction === 'outbound' && r.message_type === 'sms')
        .sort((a, b) => a.price_usd - b.price_usd),
    [data, providerName],
  );

  const countryCount = new Set(providerRates.map((r) => r.country_iso)).size;
  const cheapest = providerRates[0];
  const avgPrice = providerRates.length > 0
    ? providerRates.reduce((sum, r) => sum + r.price_usd, 0) / providerRates.length
    : 0;

  const signupUrl = PROVIDER_SIGNUP_URLS[providerName] ?? '#';

  if (providerRates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-slate-500 dark:text-slate-400">No data available for this provider.</p>
        <Link to="/compare" className="text-brand-500 text-sm mt-3 inline-block">Back to comparison</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link to="/compare" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-500 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        All Providers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            {providerName} SMS Pricing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Outbound SMS rates across {countryCount} countries.
          </p>
        </div>
        <a
          href={signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-gradient inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm transition-all shrink-0"
        >
          Sign Up
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Cheapest', value: cheapest ? fmtSMSPrice(cheapest.price_usd) : 'N/A', sub: cheapest?.country_name },
          { label: 'Average', value: fmtSMSPrice(avgPrice), sub: 'per SMS' },
          { label: 'Countries', value: `${countryCount}`, sub: 'covered' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="p-4 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="price text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Rates by country */}
      <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Country</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Price/SMS</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Verify</th>
            </tr>
          </thead>
          <tbody>
            {providerRates.map((rate) => (
              <tr key={rate.id} className="sms-row border-b border-slate-100 dark:border-ink-border last:border-0">
                <td className="px-4 py-2.5">
                  <Link
                    to={`/country/${rate.country_iso.toLowerCase()}`}
                    className="flex items-center gap-2 hover:text-brand-500 transition-colors"
                  >
                    <span className="text-base">{countryFlag(rate.country_iso)}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{rate.country_name}</span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="price font-medium text-slate-800 dark:text-slate-200">
                    {fmtSMSPrice(rate.price_usd)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                  {rate.verify_price_usd != null ? (
                    <span className="price text-slate-600 dark:text-slate-400">{fmtSMSPrice(rate.verify_price_usd)}</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 text-xs">&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
