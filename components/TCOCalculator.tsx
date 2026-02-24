import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ChevronDown, ArrowRight, ExternalLink, Info, TrendingDown } from 'lucide-react';
import type { SMSRate, PhoneNumberPrice, ProviderVolumePricing, TenDLCFees, MessageType } from '../types';
import { countryFlag, fmtSMSPrice, fmtDollars, fmtVolume, providerSlug, PROVIDER_COLORS, PROVIDER_SIGNUP_URLS } from '../services/smsUtils';
import { COUNTRIES } from '../constants';
import { Tooltip } from './ui';

interface Props {
  data: SMSRate[];
  phoneNumbers: PhoneNumberPrice[];
  volumeTiers: ProviderVolumePricing[];
  tenDlcFees: TenDLCFees[];
}

/* ── Volume presets ─────────────────────────────────────────────── */

const VOLUME_PRESETS = [
  { label: '1K', value: 1_000 },
  { label: '10K', value: 10_000 },
  { label: '50K', value: 50_000 },
  { label: '100K', value: 100_000 },
  { label: '500K', value: 500_000 },
  { label: '1M', value: 1_000_000 },
];

/* ── Country selector ───────────────────────────────────────────── */

const CountrySelect: React.FC<{
  value: string;
  onChange: (iso: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.iso.toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES;

  const selected = COUNTRIES.find((c) => c.iso === value);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors w-full"
      >
        {selected && <span className="text-base">{countryFlag(selected.iso)}</span>}
        <span className="flex-1 text-left truncate">{selected?.name ?? 'Select country'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-ink-card border border-slate-200 dark:border-ink-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-ink-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-ink-muted rounded-lg border-0 outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
            {filtered.map((c) => (
              <button
                key={c.iso}
                onClick={() => { onChange(c.iso); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors
                  ${c.iso === value
                    ? 'bg-brand-500/10 text-brand-500 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
              >
                <span>{countryFlag(c.iso)}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── TCO Result card ────────────────────────────────────────────── */

interface TCOResult {
  provider: string;
  basePrice: number;
  surcharge: number;
  effectivePrice: number;
  messagingCost: number;
  phoneNumberCost: number;
  tenDlcCost: number;
  totalMonthlyCost: number;
  totalAnnualCost: number;
}

const ResultCard: React.FC<{
  result: TCOResult;
  rank: number;
  cheapest: number;
  volume: number;
}> = ({ result, rank, cheapest, volume }) => {
  const savings = result.totalMonthlyCost - cheapest;
  const savingsPct = cheapest > 0 ? ((savings / result.totalMonthlyCost) * 100) : 0;
  const isCheapest = rank === 0;

  return (
    <div className={`relative p-5 rounded-xl border transition-colors ${
      isCheapest
        ? 'border-brand-400/40 bg-brand-500/5 dark:bg-brand-500/10'
        : 'border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card'
    }`}>
      {isCheapest && (
        <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
          Best Value
        </span>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <Link
            to={`/provider/${providerSlug(result.provider)}`}
            className="font-display text-lg font-bold text-slate-900 dark:text-white hover:text-brand-500 transition-colors"
          >
            {result.provider}
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {fmtSMSPrice(result.effectivePrice)}/msg &middot; {fmtVolume(volume)} messages
          </p>
        </div>
        <div className="text-right">
          <p className={`font-display text-2xl font-bold ${isCheapest ? 'text-brand-500 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
            {fmtDollars(result.totalMonthlyCost)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">/month</p>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Messaging ({fmtSMSPrice(result.basePrice)} &times; {fmtVolume(volume)})</span>
          <span className="font-medium">{fmtDollars(result.messagingCost)}</span>
        </div>
        {result.surcharge > 0 && (
          <div className="flex justify-between text-amber-600 dark:text-amber-400">
            <span>Carrier surcharges ({fmtSMSPrice(result.surcharge)} &times; {fmtVolume(volume)})</span>
            <span className="font-medium">+{fmtDollars(result.surcharge * volume)}</span>
          </div>
        )}
        {result.phoneNumberCost > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Phone number</span>
            <span className="font-medium">{fmtDollars(result.phoneNumberCost)}</span>
          </div>
        )}
        {result.tenDlcCost > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>10DLC campaign fee</span>
            <span className="font-medium">{fmtDollars(result.tenDlcCost)}</span>
          </div>
        )}
        <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-ink-border flex justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>Annual</span>
          <span className="font-medium">{fmtDollars(result.totalAnnualCost)}</span>
        </div>
      </div>

      {/* Savings or CTA */}
      <div className="mt-4 flex items-center justify-between">
        {!isCheapest && savings > 0 ? (
          <p className="text-xs text-red-500 dark:text-red-400">
            +{fmtDollars(savings)}/mo more ({savingsPct.toFixed(0)}% extra)
          </p>
        ) : isCheapest ? (
          <p className="text-xs text-brand-500 dark:text-brand-400 font-medium flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Lowest total cost
          </p>
        ) : <span />}
        <Tooltip content={`Sign up for ${result.provider}`} side="left">
          <a
            href={PROVIDER_SIGNUP_URLS[result.provider] ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isCheapest
                ? 'cta-gradient text-white'
                : 'border border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 hover:border-brand-400/40 hover:text-brand-500'
            }`}
          >
            Try free <ExternalLink className="w-3 h-3" />
          </a>
        </Tooltip>
      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────── */

export const TCOCalculator: React.FC<Props> = ({ data, phoneNumbers, volumeTiers, tenDlcFees }) => {
  const [country, setCountry] = useState('US');
  const [volume, setVolume] = useState(10_000);
  const [channel, setChannel] = useState<MessageType>('sms');
  const [includePhoneNumber, setIncludePhoneNumber] = useState(true);
  const [include10DLC, setInclude10DLC] = useState(true);

  const isUS = country === 'US';

  // Get rates for selected country + channel
  const rates = useMemo(() =>
    data.filter((r) =>
      r.country_iso === country &&
      r.direction === 'outbound' &&
      r.message_type === channel
    ),
    [data, country, channel],
  );

  // Available channels for selected country
  const availableChannels = useMemo(() => {
    const channels = new Set(
      data.filter((r) => r.country_iso === country && r.direction === 'outbound')
        .map((r) => r.message_type)
    );
    return channels;
  }, [data, country]);

  // Calculate TCO for each provider
  const results = useMemo((): TCOResult[] => {
    const providerMap = new Map<string, SMSRate>();
    rates.forEach((r) => {
      const existing = providerMap.get(r.provider);
      if (!existing || r.price_usd < existing.price_usd) {
        providerMap.set(r.provider, r);
      }
    });

    return Array.from(providerMap.entries())
      .map(([provider, rate]) => {
        // Find volume tier price
        const volTier = volumeTiers.find((vt) => vt.provider === provider);
        let effectivePrice = rate.price_usd;
        if (volTier) {
          const tier = volTier.tiers.find((t) =>
            volume >= t.min_messages && (t.max_messages === null || volume <= t.max_messages)
          );
          if (tier) effectivePrice = tier.price_per_message_usd;
        }

        const surcharge = rate.carrier_surcharge_usd ?? 0;
        const messagingCost = effectivePrice * volume;
        const surchargeCost = surcharge * volume;

        // Phone number cost
        let phoneNumberCost = 0;
        if (includePhoneNumber) {
          const pn = phoneNumbers.find((p) =>
            p.provider === provider &&
            p.country_iso === country &&
            p.number_type === 'local'
          );
          phoneNumberCost = pn?.monthly_cost_usd ?? 0;
        }

        // 10DLC cost (US only)
        let tenDlcCost = 0;
        if (isUS && include10DLC && channel === 'sms') {
          const dlc = tenDlcFees.find((f) => f.provider === provider);
          tenDlcCost = dlc?.monthly_campaign_fee_usd ?? 0;
        }

        const totalMonthlyCost = messagingCost + surchargeCost + phoneNumberCost + tenDlcCost;

        return {
          provider,
          basePrice: effectivePrice,
          surcharge,
          effectivePrice: effectivePrice + surcharge,
          messagingCost,
          phoneNumberCost,
          tenDlcCost,
          totalMonthlyCost,
          totalAnnualCost: totalMonthlyCost * 12,
        };
      })
      .sort((a, b) => a.totalMonthlyCost - b.totalMonthlyCost);
  }, [rates, volume, phoneNumbers, volumeTiers, tenDlcFees, country, channel, includePhoneNumber, include10DLC, isUS]);

  const cheapest = results[0]?.totalMonthlyCost ?? 0;

  // Channel buttons
  const channelOptions: { value: MessageType; label: string }[] = [
    { value: 'sms', label: 'SMS' },
    { value: 'mms', label: 'MMS' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'rcs', label: 'RCS' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-brand-500" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            True Cost Calculator
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
          Per-message pricing is just the beginning. Factor in carrier surcharges, phone number rental, 10DLC fees,
          and volume discounts to see what you'll actually pay.
        </p>
      </div>

      {/* Configuration */}
      <div className="grid md:grid-cols-2 gap-6 mb-8 p-6 rounded-2xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-deep">
        {/* Left column: Country + Channel */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Destination Country
            </label>
            <CountrySelect value={country} onChange={setCountry} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Channel
            </label>
            <div className="flex flex-wrap gap-1.5">
              {channelOptions.map((opt) => {
                const available = availableChannels.has(opt.value);
                return (
                  <Tooltip
                    key={opt.value}
                    content={available ? `Calculate costs for ${opt.label}` : `No ${opt.label} pricing available for this country`}
                    side="bottom"
                  >
                    <button
                      onClick={() => available && setChannel(opt.value)}
                      disabled={!available}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                        ${channel === opt.value
                          ? 'border-brand-400/40 bg-brand-500/10 text-brand-500 dark:text-brand-400'
                          : available
                            ? 'border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            : 'border-slate-100 dark:border-ink-border text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        }`}
                    >
                      {opt.label}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Volume + Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Monthly Volume
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {VOLUME_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setVolume(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                    ${volume === p.value
                      ? 'border-brand-400/40 bg-brand-500/10 text-brand-500 dark:text-brand-400'
                      : 'border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={100}
              max={2_000_000}
              step={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
              {fmtVolume(volume)} messages/month
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={includePhoneNumber}
                onChange={(e) => setIncludePhoneNumber(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-400"
              />
              Include phone number rental
            </label>
            {isUS && channel === 'sms' && (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={include10DLC}
                  onChange={(e) => setInclude10DLC(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-400"
                />
                Include 10DLC campaign fees
                <Tooltip content="US carriers require 10DLC registration for A2P messaging. Fees vary by provider." side="right">
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                </Tooltip>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {countryFlag(country)} {channel.toUpperCase()} to {COUNTRIES.find((c) => c.iso === country)?.name ?? country} — {fmtVolume(volume)}/mo
            </h2>
            <Link
              to={`/country/${country.toLowerCase()}`}
              className="text-sm text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1"
            >
              View all rates <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {results.map((result, i) => (
              <ResultCard
                key={result.provider}
                result={result}
                rank={i}
                cheapest={cheapest}
                volume={volume}
              />
            ))}
          </div>

          {/* Savings callout */}
          {results.length >= 2 && (
            <div className="mt-6 p-4 rounded-xl bg-brand-500/5 border border-brand-400/20">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-brand-500">Potential savings:</strong>{' '}
                Switching from {results[results.length - 1].provider} to {results[0].provider} saves{' '}
                <strong>{fmtDollars(results[results.length - 1].totalMonthlyCost - results[0].totalMonthlyCost)}/month</strong>{' '}
                ({fmtDollars((results[results.length - 1].totalAnnualCost - results[0].totalAnnualCost))}/year) at {fmtVolume(volume)} messages.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 border border-slate-200 dark:border-ink-border rounded-xl">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            No {channel.toUpperCase()} pricing available for {COUNTRIES.find((c) => c.iso === country)?.name ?? country}
          </p>
          <p className="text-slate-500 text-xs mt-1.5">
            Try a different country or channel.
          </p>
        </div>
      )}

      {/* Methodology note */}
      <div className="mt-8 p-4 rounded-xl border border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400" />
          How we calculate total cost
        </h3>
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 leading-relaxed">
          <li><strong>Base price:</strong> Per-message rate from each provider's pricing page. Volume discounts applied when available.</li>
          <li><strong>Carrier surcharges:</strong> Additional fees charged by mobile carriers (US routes only). Typically $0.002-$0.003/msg.</li>
          <li><strong>Phone number:</strong> Monthly rental for a local phone number to send from. Required for most messaging.</li>
          <li><strong>10DLC fees:</strong> US-specific registration fees for business messaging through local numbers.</li>
        </ul>
      </div>
    </div>
  );
};
