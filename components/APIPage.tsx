import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Tooltip } from './ui';

const BASE_URL = 'https://sms-price-tracker.vercel.app/api/v1';

const EXAMPLES = [
  {
    title: 'Get all US outbound SMS rates',
    url: `${BASE_URL}/prices?country=US&direction=outbound`,
    curl: `curl "${BASE_URL}/prices?country=US&direction=outbound"`,
  },
  {
    title: 'Compare Twilio vs Plivo for UK',
    url: `${BASE_URL}/prices?country=GB&provider=twilio,plivo`,
    curl: `curl "${BASE_URL}/prices?country=GB&provider=twilio,plivo"`,
  },
  {
    title: 'Get cheapest rates (with API key)',
    url: `${BASE_URL}/prices?direction=outbound&limit=10`,
    curl: `curl -H "X-API-Key: smsr_your_key_here" "${BASE_URL}/prices?direction=outbound&limit=10"`,
  },
  {
    title: 'Export as CSV (Starter+ plan)',
    url: `${BASE_URL}/prices?country=US,GB,DE,FR&format=csv`,
    curl: `curl -H "X-API-Key: smsr_your_key_here" "${BASE_URL}/prices?country=US,GB,DE,FR&format=csv" -o prices.csv`,
  },
];

const PARAMS = [
  { name: 'country', type: 'string', desc: 'ISO 3166-1 alpha-2 codes, comma-separated. e.g. US,GB,DE' },
  { name: 'provider', type: 'string', desc: 'Provider names, comma-separated. e.g. twilio,plivo' },
  { name: 'channel', type: 'string', desc: 'Message type: sms, mms, whatsapp, rcs' },
  { name: 'direction', type: 'string', desc: 'outbound or inbound' },
  { name: 'format', type: 'string', desc: 'Response format: json (default) or csv (Starter+)' },
  { name: 'limit', type: 'number', desc: 'Max results. Free: 100, Starter: 1000, Pro: 1000' },
  { name: 'offset', type: 'number', desc: 'Skip first N results for pagination' },
  { name: 'include', type: 'string', desc: 'Set to "all" to include phone numbers, volume tiers, 10DLC fees (paid plans)' },
];

export const APIPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">API Documentation</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Access real-time SMS pricing data programmatically. Free tier includes 100 requests/day.
        </p>
      </div>

      {/* Base URL */}
      <section className="mb-8">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Base URL</h2>
        <CodeBlock code={BASE_URL} />
      </section>

      {/* Authentication */}
      <section className="mb-8">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Authentication</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Pass your API key in the <code className="text-brand-500 bg-brand-500/5 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> header.
          No key required for the free tier (rate limited by IP).
        </p>
        <CodeBlock code={`curl -H "X-API-Key: smsr_your_key_here" ${BASE_URL}/prices`} />
      </section>

      {/* Endpoint */}
      <section className="mb-8">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
          GET /prices
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Returns SMS pricing data filtered by country, provider, channel, and direction.
        </p>

        {/* Parameters */}
        <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Parameter</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Description</th>
              </tr>
            </thead>
            <tbody>
              {PARAMS.map((p) => (
                <tr key={p.name} className="border-b border-slate-100 dark:border-ink-border last:border-0">
                  <td className="px-4 py-2.5">
                    <code className="text-brand-500 text-xs font-mono">{p.name}</code>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{p.type}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Examples */}
      <section className="mb-8">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-4">Examples</h2>
        <div className="space-y-4">
          {EXAMPLES.map((ex) => (
            <div key={ex.title} className="rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card p-4">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{ex.title}</p>
              <CodeBlock code={ex.curl} />
            </div>
          ))}
        </div>
      </section>

      {/* Response format */}
      <section className="mb-8">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Response Format</h2>
        <CodeBlock code={`{
  "data": [
    {
      "provider": "Twilio",
      "country_iso": "US",
      "country_name": "United States",
      "direction": "outbound",
      "message_type": "sms",
      "price_usd": 0.0079,
      "carrier_surcharge_usd": 0.003,
      "total_price_usd": 0.0109,
      "operator_name": "AT&T",
      "last_updated": "2026-02-23T06:00:00Z"
    }
  ],
  "meta": {
    "total": 1657,
    "count": 100,
    "offset": 0,
    "limit": 100,
    "updated": "2026-02-23T06:00:00Z"
  }
}`} />
      </section>

      {/* Rate limits */}
      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">Rate Limits</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { plan: 'Free', limit: '100/day', note: 'No API key needed' },
            { plan: 'Starter ($49/mo)', limit: '10,000/day', note: 'CSV export, historical data' },
            { plan: 'Pro ($199/mo)', limit: 'Unlimited', note: 'Webhooks, priority support' },
          ].map(({ plan, limit, note }) => (
            <div key={plan} className="p-4 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{plan}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{limit}</p>
              <p className="text-xs text-slate-500 mt-0.5">{note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ── Code block with copy button ─────────────────────────────── */

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="p-3 rounded-lg bg-slate-900 dark:bg-ink-deep text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <Tooltip content={copied ? 'Copied!' : 'Copy to clipboard'} side="left">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </Tooltip>
    </div>
  );
};
