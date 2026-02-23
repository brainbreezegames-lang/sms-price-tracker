import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Globe, Zap, DollarSign, TrendingDown } from 'lucide-react';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice, providerSlug, PROVIDER_COLORS } from '../services/smsUtils';

interface Props {
  data: SMSRate[];
  isLoading: boolean;
}

export const LandingPage: React.FC<Props> = ({ data, isLoading }) => {
  // Quick comparison: US outbound SMS across all providers
  const usRates = useMemo(
    () =>
      data
        .filter((r) => r.country_iso === 'US' && r.direction === 'outbound' && r.message_type === 'sms')
        .sort((a, b) => a.price_usd - b.price_usd),
    [data],
  );

  const uniqueProviders = useMemo(() => new Set(data.map((r) => r.provider)).size, [data]);
  const uniqueCountries = useMemo(() => new Set(data.map((r) => r.country_iso)).size, [data]);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-live" />
              <span className="text-xs font-medium text-brand-500 dark:text-brand-400">
                Tracking {uniqueProviders} providers &middot; {uniqueCountries} countries
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              Stop overpaying for{' '}
              <span className="text-brand-500 dark:text-brand-400">SMS verification</span>
            </h1>

            <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Every login, every OTP, every notification &mdash; it all adds up.
              Compare costs across Twilio, Vonage, Plivo, Telnyx &amp; more for 230+ countries.
              Find the cheapest provider in seconds.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/compare"
                className="cta-gradient inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all"
              >
                Compare Prices
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-ink-border text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                How it works
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-400/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-brand-400/3 blur-3xl" />
        </div>
      </section>

      {/* ── Quick US Comparison ───────────────────────────────────────── */}
      {usRates.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="border border-slate-200 dark:border-ink-border rounded-2xl p-6 md:p-8 bg-white dark:bg-ink-deep">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {countryFlag('US')} US Outbound SMS — Quick Compare
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Price per message across all providers
                </p>
              </div>
              <Link
                to="/country/us"
                className="text-sm text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1"
              >
                Full breakdown <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {usRates.map((rate, i) => (
                <div
                  key={rate.id}
                  className={`relative p-4 rounded-xl border transition-colors
                    ${i === 0
                      ? 'border-brand-400/40 bg-brand-500/5'
                      : 'border-slate-200 dark:border-ink-border hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                >
                  {i === 0 && (
                    <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full">
                      CHEAPEST
                    </span>
                  )}
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{rate.provider}</p>
                  <p className={`price text-2xl font-bold mt-1 ${i === 0 ? 'text-brand-500 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
                    {fmtSMSPrice(rate.price_usd)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">per message</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Why Prices Vary ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white text-center mb-10">
          Why SMS prices vary up to 10&times;
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Globe,
              title: 'Country matters',
              desc: 'Sending to India costs $0.002 but Japan costs $0.07+. The destination country is the single biggest price factor.',
            },
            {
              icon: DollarSign,
              title: 'Provider markup',
              desc: 'Providers negotiate different carrier rates. Telnyx and Plivo consistently undercut Twilio by 30-50% on the same routes.',
            },
            {
              icon: TrendingDown,
              title: 'Verify API overhead',
              desc: 'Bundled OTP APIs (like Twilio Verify at $0.05) cost 5-10x more than raw SMS. Building on raw SMS saves significantly.',
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

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Providers', value: `${uniqueProviders}+` },
              { label: 'Countries', value: `${uniqueCountries}+` },
              { label: 'Updated', value: 'Daily' },
              { label: 'Cost', value: 'Free' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Start saving on SMS today
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
          Select your country, see the cheapest provider instantly. No signup required.
        </p>
        <Link
          to="/compare"
          className="cta-gradient inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold transition-all text-lg"
        >
          Compare Prices Now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
};
