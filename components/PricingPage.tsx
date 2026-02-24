import React from 'react';
import { Check, Zap, Building2, Rocket } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Compare SMS prices across providers',
    icon: Zap,
    features: [
      'Full price comparison table',
      'TCO calculator',
      'Invoice savings analysis',
      'API: 100 requests/day',
      'Community support',
    ],
    cta: 'Get Started',
    ctaStyle: 'border border-slate-300 dark:border-ink-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-muted',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'For teams sending SMS at scale',
    icon: Rocket,
    features: [
      'Everything in Free',
      'API: 10,000 requests/day',
      'CSV & JSON bulk export',
      'Price change alerts (10 alerts)',
      'Historical pricing data',
      'Email support',
    ],
    cta: 'Start Free Trial',
    ctaStyle: 'cta-gradient text-white',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Pro',
    price: '$199',
    period: '/month',
    description: 'For enterprises & platforms',
    icon: Building2,
    features: [
      'Everything in Starter',
      'API: Unlimited requests',
      'Webhook notifications',
      'Price alerts (50 alerts)',
      'Priority support',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    ctaStyle: 'border border-brand-400 text-brand-500 dark:text-brand-400 hover:bg-brand-500/5',
    highlight: false,
  },
];

export const PricingPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          Simple, transparent pricing
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
          Start free. Upgrade when you need API access, price alerts, or bulk data exports.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative p-6 rounded-2xl border transition-all ${
              plan.highlight
                ? 'border-brand-400 dark:border-brand-500 shadow-lg shadow-brand-500/10 scale-[1.02]'
                : 'border-slate-200 dark:border-ink-border'
            } bg-white dark:bg-ink-card`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-brand-500 text-white">
                {plan.badge}
              </span>
            )}

            <div className="flex items-center gap-3 mb-4">
              <plan.icon className={`w-5 h-5 ${plan.highlight ? 'text-brand-500' : 'text-slate-400'}`} />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h2>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{plan.period}</span>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{plan.description}</p>

            <ul className="space-y-2.5 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${plan.ctaStyle}`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white text-center mb-8">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: 'Can I try paid features before subscribing?',
              a: 'Yes. The invoice analysis and TCO calculator are free for everyone. The Starter plan includes a 14-day free trial.',
            },
            {
              q: 'How accurate is the pricing data?',
              a: 'We scrape directly from provider APIs and official pricing pages daily. Twilio data comes from their public CSV feed. Azure data from their GitHub repository.',
            },
            {
              q: 'What format should my invoice be in?',
              a: 'Upload a CSV file with country, volume, and price columns. We auto-detect Twilio, Vonage, and Plivo invoice formats.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Cancel with one click from your dashboard. No contracts, no cancellation fees.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group p-4 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
              <summary className="cursor-pointer font-medium text-sm text-slate-800 dark:text-slate-200 list-none flex items-center justify-between">
                {q}
                <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
              </summary>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};
