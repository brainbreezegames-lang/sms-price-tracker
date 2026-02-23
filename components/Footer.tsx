import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="border-t border-slate-200 dark:border-ink-border bg-white dark:bg-ink-deep mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-brand-500" />
            <span className="font-display font-bold tracking-tight">
              SMS<span className="text-brand-400">_RATES</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Compare SMS & OTP verification costs across 8+ providers for 230+ countries.
          </p>
        </div>

        {/* Tools */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Tools
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/compare" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">Price Comparison</Link></li>
            <li><Link to="/trends" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">Price Trends</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Resources
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/blog" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">Blog</Link></li>
            <li><Link to="/methodology" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">Methodology</Link></li>
            <li><Link to="/about" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">About</Link></li>
          </ul>
        </div>

        {/* Providers */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Providers
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/provider/twilio" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">Twilio</Link></li>
            <li><Link to="/provider/vonage" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">Vonage</Link></li>
            <li><Link to="/provider/plivo" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">Plivo</Link></li>
            <li><Link to="/provider/telnyx" className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors">Telnyx</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-ink-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          SMS Rates &mdash; Prices are indicative and may vary. Always verify on the provider's site before purchasing.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-live" />
          Tracking 8 providers
        </div>
      </div>
    </div>
  </footer>
);
