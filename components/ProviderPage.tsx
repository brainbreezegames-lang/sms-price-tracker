import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice, providerFromSlug, channelLabel, channelColor, PROVIDER_SIGNUP_URLS } from '../services/smsUtils';
import { Badge, Tooltip } from './ui';

interface Props {
  data: SMSRate[];
}

export const ProviderPage: React.FC<Props> = ({ data }) => {
  const { slug } = useParams<{ slug: string }>();
  const providerName = providerFromSlug(slug ?? '') ?? slug ?? '';

  const allRates = useMemo(
    () => data.filter((r) => r.provider.toLowerCase() === providerName.toLowerCase()),
    [data, providerName],
  );

  const outboundSms = useMemo(
    () => allRates.filter((r) => r.direction === 'outbound' && r.message_type === 'sms').sort((a, b) => a.total_price_usd - b.total_price_usd),
    [allRates],
  );

  const otherChannels = useMemo(
    () => allRates.filter((r) => r.direction === 'outbound' && r.message_type !== 'sms').sort((a, b) => a.total_price_usd - b.total_price_usd),
    [allRates],
  );

  const inboundSms = useMemo(
    () => allRates.filter((r) => r.direction === 'inbound' && r.message_type === 'sms').sort((a, b) => a.total_price_usd - b.total_price_usd),
    [allRates],
  );

  const countryCount = new Set(outboundSms.map((r) => r.country_iso)).size;
  const channelCount = new Set(allRates.map((r) => r.message_type)).size;
  const cheapest = outboundSms[0];
  const avgPrice = outboundSms.length > 0
    ? outboundSms.reduce((sum, r) => sum + r.total_price_usd, 0) / outboundSms.length
    : 0;

  const signupUrl = PROVIDER_SIGNUP_URLS[providerName] ?? '#';

  if (allRates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-slate-600 dark:text-slate-400 font-medium">No pricing data available for this provider yet</p>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1.5">We're working on expanding our coverage. Check back soon.</p>
        <Link to="/compare" className="text-brand-500 text-sm mt-4 inline-flex items-center gap-1 hover:text-brand-400">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Browse all providers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <Link to="/compare" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-500 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          All Providers
        </Link>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            {providerName} Messaging Pricing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Rates across {countryCount} countries and {channelCount} channel{channelCount !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="text-right shrink-0">
          <Tooltip content={`Sign up for ${providerName} — opens in a new tab`} side="left">
            <a
              href={signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-gradient inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm transition-all"
              aria-label={`Try ${providerName} free — opens in a new tab`}
            >
              Try {providerName} Free
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </Tooltip>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">No credit card required</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Cheapest route',
            value: cheapest ? fmtSMSPrice(cheapest.total_price_usd) : 'N/A',
            sub: cheapest?.country_name,
            tip: `${providerName}'s best total rate across all destinations (includes carrier surcharges)`,
          },
          {
            label: 'Average',
            value: fmtSMSPrice(avgPrice),
            sub: 'outbound SMS',
            tip: `Mean total outbound SMS price across ${countryCount} countries`,
          },
          {
            label: 'Countries',
            value: `${countryCount}`,
            sub: `${channelCount} channel${channelCount !== 1 ? 's' : ''}`,
            tip: `${providerName} can send to ${countryCount} countries via ${channelCount} channel${channelCount !== 1 ? 's' : ''}`,
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

      {/* Outbound SMS rates */}
      {outboundSms.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Outbound SMS</h2>
          <ProviderRateTable rates={outboundSms} providerName={providerName} showSurcharge />
        </div>
      )}

      {/* Other channels */}
      {otherChannels.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Other Channels</h2>
          <ProviderRateTable rates={otherChannels} providerName={providerName} showChannel />
        </div>
      )}

      {/* Inbound SMS */}
      {inboundSms.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Inbound SMS</h2>
          <ProviderRateTable rates={inboundSms} providerName={providerName} />
        </div>
      )}
    </div>
  );
};

/* ── Reusable provider rate table ─────────────────────────────── */

const ProviderRateTable: React.FC<{
  rates: SMSRate[];
  providerName: string;
  showSurcharge?: boolean;
  showChannel?: boolean;
}> = ({ rates, providerName, showSurcharge, showChannel }) => (
  <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden">
    <table className="w-full text-sm" aria-label={`${providerName} rates`}>
      <thead>
        <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
          <th scope="col" className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Country</th>
          {showChannel && <th scope="col" className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Channel</th>}
          <th scope="col" className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {showSurcharge ? 'Total/Msg' : 'Price/Msg'}
          </th>
          {showSurcharge && (
            <th scope="col" className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Verify</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rates.map((rate, i) => (
          <tr key={rate.id} className="sms-row border-b border-slate-100 dark:border-ink-border last:border-0">
            <td className="px-4 py-2.5">
              <Link
                to={`/country/${rate.country_iso.toLowerCase()}`}
                className="flex items-center gap-2 hover:text-brand-500 transition-colors"
              >
                <span className="text-base" role="img" aria-label={rate.country_name}>{countryFlag(rate.country_iso)}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{rate.country_name}</span>
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
                  <Tooltip content={`Verify API: ${fmtSMSPrice(rate.verify_price_usd)} per OTP to ${rate.country_name}`} side="left">
                    <span className="price text-slate-600 dark:text-slate-400 cursor-default">{fmtSMSPrice(rate.verify_price_usd)}</span>
                  </Tooltip>
                ) : (
                  <Tooltip content={`No separate Verify price published for ${rate.country_name}`} side="left">
                    <span className="text-slate-400 dark:text-slate-600 text-xs cursor-default" aria-label="Not available">&mdash;</span>
                  </Tooltip>
                )}
              </td>
            )}
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
