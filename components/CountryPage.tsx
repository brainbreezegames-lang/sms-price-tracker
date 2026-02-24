import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice, providerSlug, channelLabel, channelColor } from '../services/smsUtils';
import { COUNTRY_MAP } from '../constants';
import { Badge, Tooltip } from './ui';

interface Props {
  data: SMSRate[];
}

export const CountryPage: React.FC<Props> = ({ data }) => {
  const { iso } = useParams<{ iso: string }>();
  const upperIso = (iso ?? '').toUpperCase();

  const countryRates = useMemo(
    () => data.filter((r) => r.country_iso === upperIso).sort((a, b) => a.total_price_usd - b.total_price_usd),
    [data, upperIso],
  );

  const countryInfo = COUNTRY_MAP.get(upperIso);
  const countryName = countryRates[0]?.country_name ?? countryInfo?.name ?? upperIso;
  const flag = countryFlag(upperIso);

  const outboundSms = useMemo(
    () => countryRates.filter((r) => r.direction === 'outbound' && r.message_type === 'sms'),
    [countryRates],
  );
  const inboundSms = useMemo(
    () => countryRates.filter((r) => r.direction === 'inbound' && r.message_type === 'sms'),
    [countryRates],
  );
  const otherChannels = useMemo(
    () => countryRates.filter((r) => r.direction === 'outbound' && r.message_type !== 'sms'),
    [countryRates],
  );

  const cheapestOut = outboundSms[0];
  const providerCount = new Set(countryRates.map((r) => r.provider)).size;
  const avgPrice = outboundSms.length > 0
    ? outboundSms.reduce((sum, r) => sum + r.total_price_usd, 0) / outboundSms.length
    : 0;

  if (countryRates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-slate-600 dark:text-slate-400 font-medium">No pricing data available for this country yet</p>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1.5">We're working on adding more countries. Check back soon.</p>
        <Link to="/compare" className="text-brand-500 text-sm mt-4 inline-flex items-center gap-1 hover:text-brand-400">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Browse all countries
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav aria-label="Breadcrumb">
        <Link to="/compare" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-500 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          All Countries
        </Link>
      </nav>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <span className="text-4xl" role="img" aria-label={`${countryName} flag`}>{flag}</span>
          Messaging Pricing — {countryName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Compare costs across {providerCount} provider{providerCount !== 1 ? 's' : ''} for {countryName}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Cheapest SMS',
            value: cheapestOut ? fmtSMSPrice(cheapestOut.total_price_usd) : 'N/A',
            sub: cheapestOut?.provider,
            tip: `Lowest total outbound SMS price for ${countryName} (includes carrier surcharges)`,
          },
          {
            label: 'Average',
            value: fmtSMSPrice(avgPrice),
            sub: 'outbound SMS',
            tip: 'Mean total price across all providers',
          },
          {
            label: 'Providers',
            value: `${providerCount}`,
            sub: 'with coverage',
            tip: `${providerCount} provider${providerCount !== 1 ? 's offer' : ' offers'} messaging service to ${countryName}`,
          },
        ].map(({ label, value, sub, tip }) => (
          <Tooltip key={label} content={tip} side="bottom">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card cursor-default">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="price text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
              {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Outbound SMS table */}
      {outboundSms.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Outbound SMS</h2>
          <RateTable rates={outboundSms} countryName={countryName} showSurcharge />
        </div>
      )}

      {/* Other channels */}
      {otherChannels.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Other Channels</h2>
          <RateTable rates={otherChannels} countryName={countryName} showChannel />
        </div>
      )}

      {/* Inbound SMS table */}
      {inboundSms.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Inbound SMS</h2>
          <RateTable rates={inboundSms} countryName={countryName} />
        </div>
      )}
    </div>
  );
};

/* ── Reusable rate table ────────────────────────────────────────── */

const RateTable: React.FC<{
  rates: SMSRate[];
  countryName: string;
  showSurcharge?: boolean;
  showChannel?: boolean;
}> = ({ rates, countryName, showSurcharge, showChannel }) => (
  <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
          <th scope="col" className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Provider</th>
          {showChannel && <th scope="col" className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Channel</th>}
          <th scope="col" className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {showSurcharge ? 'Total/Msg' : 'Price/Msg'}
          </th>
          {showSurcharge && (
            <th scope="col" className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Verify</th>
          )}
          <th scope="col" className="text-right px-4 py-2.5 w-16"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {rates.map((rate, i) => (
          <tr key={rate.id} className="sms-row border-b border-slate-100 dark:border-ink-border last:border-0">
            <td className="px-4 py-2.5">
              <Link to={`/provider/${providerSlug(rate.provider)}`} className="font-medium text-slate-800 dark:text-slate-200 hover:text-brand-500">
                {rate.provider}
              </Link>
            </td>
            {showChannel && (
              <td className="px-4 py-2.5">
                <ChannelBadge type={rate.message_type} />
              </td>
            )}
            <td className="px-4 py-2.5 text-right">
              <span className={`price font-medium ${i === 0 ? 'text-brand-500 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {fmtSMSPrice(rate.total_price_usd)}
              </span>
              {i === 0 && <span className="ml-1.5"><Badge variant="cheapest" size="xs" /></span>}
              {showSurcharge && rate.carrier_surcharge_usd != null && rate.carrier_surcharge_usd > 0 && (
                <Tooltip content={`Base: ${fmtSMSPrice(rate.price_usd)} + ${fmtSMSPrice(rate.carrier_surcharge_usd)} carrier surcharge`} side="left">
                  <span className="ml-1 text-[10px] text-amber-500 dark:text-amber-400 cursor-default">+fee</span>
                </Tooltip>
              )}
            </td>
            {showSurcharge && (
              <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                {rate.verify_price_usd != null ? (
                  <Tooltip content={`${rate.provider} Verify API: ${fmtSMSPrice(rate.verify_price_usd)} per OTP`} side="left">
                    <span className="price text-slate-600 dark:text-slate-400 cursor-default">{fmtSMSPrice(rate.verify_price_usd)}</span>
                  </Tooltip>
                ) : (
                  <Tooltip content={`${rate.provider} doesn't publish a separate Verify price for ${countryName}`} side="left">
                    <span className="text-slate-400 dark:text-slate-600 text-xs cursor-default" aria-label="Not available">&mdash;</span>
                  </Tooltip>
                )}
              </td>
            )}
            <td className="px-4 py-2.5 text-right">
              <Tooltip content={`Open ${rate.provider}'s pricing page`} side="left">
                <a
                  href={rate.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${rate.provider} pricing`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-500 hover:text-brand-400 py-1"
                >
                  Visit
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </Tooltip>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ChannelBadge: React.FC<{ type: string }> = ({ type }) => {
  const c = channelColor(type);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${c.bg} ${c.text} ${c.darkBg} ${c.darkText}`}>
      {channelLabel(type)}
    </span>
  );
};
