import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DollarSign, Calculator, Smartphone } from 'lucide-react';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice } from '../services/smsUtils';
import { Tooltip } from './ui';

interface Props {
  data: SMSRate[];
  isLoading: boolean;
}

export const LandingPage: React.FC<Props> = ({ data, isLoading }) => {
  const usRates = useMemo(
    () =>
      data
        .filter((r) => r.country_iso === 'US' && r.direction === 'outbound' && r.message_type === 'sms')
        .sort((a, b) => a.total_price_usd - b.total_price_usd),
    [data],
  );

  const uniqueProviders = useMemo(() => new Set(data.map((r) => r.provider)).size, [data]);
  const uniqueCountries = useMemo(() => new Set(data.map((r) => r.country_iso)).size, [data]);
  const uniqueChannels = useMemo(() => new Set(data.map((r) => r.message_type)).size, [data]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <Tooltip content="We check every provider's API daily to keep prices current" side="bottom">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6 cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-live" />
                <span className="text-xs font-medium text-brand-500 dark:text-brand-400">
                  Tracking {uniqueProviders} providers &middot; {uniqueCountries} countries &middot; {uniqueChannels} channels
                </span>
              </div>
            </Tooltip>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              Stop overpaying for{' '}
              <span className="text-brand-500 dark:text-brand-400">messaging</span>
            </h1>

            <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Every OTP, every alert, every notification adds up.
              Compare SMS, MMS, WhatsApp &amp; RCS costs across {uniqueProviders} providers for {uniqueCountries}+ countries.
              See the <em>true</em> cost with carrier surcharges and hidden fees included.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/compare"
                className="cta-gradient inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all"
              >
                Compare All Prices
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/calculator"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <Calculator className="w-4 h-4" aria-hidden="true" />
                True Cost Calculator
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Free forever. No signup required. Updated daily from provider APIs.
            </p>
          </div>
        </div>

        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-400/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-brand-400/3 blur-3xl" />
        </div>
      </section>

      {/* US Quick Compare */}
      {usRates.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="border border-slate-200 dark:border-ink-border rounded-2xl p-6 md:p-8 bg-white dark:bg-ink-deep">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {countryFlag('US')} US Outbound SMS — Quick Compare
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Total cost per message (includes carrier surcharges)
                </p>
              </div>
              <Tooltip content="See every provider's rate for the US, plus inbound pricing" side="left">
                <Link to="/country/us" className="text-sm text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1">
                  Full breakdown <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Tooltip>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {usRates.slice(0, 10).map((rate, i) => (
                <Tooltip
                  key={rate.id}
                  content={i === 0
                    ? `${rate.provider} has the lowest US total cost right now`
                    : `${rate.provider}: ${fmtSMSPrice(rate.price_usd)} base${rate.carrier_surcharge_usd ? ` + ${fmtSMSPrice(rate.carrier_surcharge_usd)} surcharge` : ''}`}
                  side="bottom"
                >
                  <div className={`relative p-4 rounded-xl border transition-colors cursor-default ${
                    i === 0
                      ? 'border-brand-400/40 bg-brand-500/5'
                      : 'border-slate-200 dark:border-ink-border hover:border-slate-300 dark:hover:border-slate-600'
                  }`}>
                    {i === 0 && (
                      <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full">
                        CHEAPEST
                      </span>
                    )}
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{rate.provider}</p>
                    <p className={`price text-2xl font-bold mt-1 ${i === 0 ? 'text-brand-500 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
                      {fmtSMSPrice(rate.total_price_usd)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">total/msg</p>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What makes us different */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white text-center mb-10">
          Not just per-message pricing
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: DollarSign,
              title: 'Hidden costs exposed',
              desc: 'Carrier surcharges, 10DLC fees, and phone number rental add 20-50% to your real cost. We show the total, not just the base price.',
            },
            {
              icon: Smartphone,
              title: '4 channels compared',
              desc: 'SMS, MMS, WhatsApp Business API, and RCS — all in one place. Find the cheapest channel for your use case.',
            },
            {
              icon: Calculator,
              title: 'True Cost Calculator',
              desc: 'Input your volume, country, and channel. See the real monthly bill with volume discounts, surcharges, and fixed fees included.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-500" />
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Providers', value: `${uniqueProviders}`, tip: 'Twilio, Vonage, Plivo, Telnyx, Bandwidth, Amazon SNS, Azure, and more' },
              { label: 'Countries', value: `${uniqueCountries}+`, tip: 'Every country where at least one provider has coverage' },
              { label: 'Channels', value: `${uniqueChannels}`, tip: 'SMS, MMS, WhatsApp Business API, and RCS' },
              { label: 'Cost', value: 'Free', tip: 'No signup, no paywall, no hidden fees — ever' },
            ].map(({ label, value, tip }) => (
              <Tooltip key={label} content={tip} side="bottom">
                <div className="cursor-default">
                  <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Know your <em>real</em> messaging costs
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
          Base price, carrier surcharges, phone number rental, volume discounts — see it all in one calculation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/calculator"
            className="cta-gradient inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all text-lg"
          >
            <Calculator className="w-5 h-5" aria-hidden="true" />
            Calculate True Cost
          </Link>
          <Link
            to="/compare"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-lg"
          >
            Browse All Prices
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          100% free. No account needed.
        </p>
      </section>
    </div>
  );
};
