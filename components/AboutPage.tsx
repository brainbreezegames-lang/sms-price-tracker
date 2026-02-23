import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Database, RefreshCcw, Monitor } from 'lucide-react';

export const AboutPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-4">
      About SMS Rates
    </h1>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
      SMS Rates is the Kayak for SMS &amp; OTP pricing. We aggregate pricing data from 8+ providers
      across 230+ countries so you can find the cheapest way to send text messages &mdash; whether for
      login verification, marketing, or transactional notifications.
    </p>

    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-6">
      How it works
    </h2>
    <div className="grid sm:grid-cols-2 gap-4 mb-12">
      {[
        { icon: Database, title: 'Data collection', desc: 'We pull pricing from provider APIs (Twilio, Vonage, Plivo, MessageBird, ClickSend) and scrape structured pricing pages (Telnyx, Sinch, Infobip).' },
        { icon: RefreshCcw, title: 'Daily refresh', desc: 'GitHub Actions fetch updated pricing daily at 6 AM UTC. SMS prices change less frequently than cloud GPU prices, so daily is sufficient.' },
        { icon: MessageSquare, title: 'Static JSON', desc: 'All data is compiled into a static JSON file served from the CDN. No database queries, no API latency — just instant client-side filtering.' },
        { icon: Monitor, title: 'Client-side UI', desc: 'React + TypeScript + Tailwind CSS. All filtering, sorting, and pagination happens in your browser. No data leaves your device.' },
      ].map(({ icon: Icon, title, desc }) => (
        <div key={title} className="p-5 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
          <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center mb-3">
            <Icon className="w-4.5 h-4.5 text-brand-500" />
          </div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white mb-1.5">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>

    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-4">
      Providers covered
    </h2>
    <div className="flex flex-wrap gap-2 mb-10">
      {['Twilio', 'Vonage', 'MessageBird', 'Telnyx', 'Plivo', 'ClickSend', 'Sinch', 'Infobip'].map((p) => (
        <Link
          key={p}
          to={`/provider/${p.toLowerCase()}`}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-ink-border text-sm font-medium
            text-slate-700 dark:text-slate-300 hover:border-brand-400/40 hover:text-brand-500 transition-colors"
        >
          {p}
        </Link>
      ))}
    </div>

    <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
        <strong>Disclaimer:</strong> Prices shown are indicative and may be up to 24 hours old.
        Some providers offer volume discounts not reflected here. Always verify pricing on the
        provider's website before making purchasing decisions.
      </p>
    </div>
  </div>
);
