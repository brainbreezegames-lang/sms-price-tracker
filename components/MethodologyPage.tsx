import React from 'react';

export const MethodologyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-4">
      Methodology
    </h1>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
      How we collect, normalize, and present SMS pricing data.
    </p>

    <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
          Data Sources
        </h2>
        <ul className="space-y-2 list-disc list-inside">
          <li><strong>Twilio</strong> &mdash; Public pricing CSV and REST Pricing API (free account required for API).</li>
          <li><strong>Vonage</strong> &mdash; REST Pricing API returning per-operator pricing in EUR, converted to USD.</li>
          <li><strong>MessageBird</strong> &mdash; Pricing API returning all outbound SMS rates in a single call.</li>
          <li><strong>Plivo</strong> &mdash; Console CSV downloads and REST API.</li>
          <li><strong>ClickSend</strong> &mdash; Calculate SMS Price API endpoint.</li>
          <li><strong>Telnyx</strong> &mdash; Structured pricing pages scraped using predictable URL patterns.</li>
          <li><strong>Sinch</strong> &mdash; Pricing page with country selector (headless browser scraping).</li>
          <li><strong>Infobip</strong> &mdash; Interactive pricing calculator (JavaScript rendering required).</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
          Currency Normalization
        </h2>
        <p>
          All prices are normalized to USD. Vonage and MessageBird report prices in EUR by default.
          We convert using a daily exchange rate from a public forex API. The conversion rate is
          updated once per day alongside the pricing data.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
          Granularity
        </h2>
        <p>
          Where available, we show per-operator (MCC/MNC) pricing. For providers that only publish
          country-level averages, we show the country default rate. The "operator" column will show
          "All operators" when per-carrier data is not available.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
          Verify / OTP Pricing
        </h2>
        <p>
          The "Verify" column shows the cost of using each provider's bundled OTP API (e.g., Twilio Verify,
          Vonage Verify, Telnyx Verify). These prices are typically higher than raw SMS because they include
          delivery retry logic, phone number validation, and fraud protection. A null value means the provider
          doesn't offer a standalone Verify API, or we don't have pricing data for it yet.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
          Update Frequency
        </h2>
        <p>
          Data is refreshed daily at 6:00 AM UTC via GitHub Actions. SMS pricing changes less frequently
          than real-time markets (like GPU spot instances), so daily updates provide sufficient accuracy.
          The "last updated" timestamp in the header shows when the most recent data refresh completed.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-3">
          Limitations
        </h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>Volume discounts are not reflected. Most providers offer tiered pricing for high-volume senders.</li>
          <li>Prices may be up to 24 hours old.</li>
          <li>Some providers require a sales call for custom enterprise rates (especially Bandwidth and Infobip).</li>
          <li>MMS pricing is not yet comprehensively tracked.</li>
          <li>Carrier surcharges and regulatory fees may apply on top of listed prices.</li>
        </ul>
      </section>
    </div>
  </div>
);
