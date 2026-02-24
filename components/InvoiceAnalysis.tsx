import React, { useState, useMemo, useCallback } from 'react';
import { Upload, FileText, TrendingDown, DollarSign, AlertTriangle, Download, X } from 'lucide-react';
import type { SMSRate } from '../types';
import { countryFlag, fmtSMSPrice, fmtDollars } from '../services/smsUtils';
import { Tooltip } from './ui';

interface Props {
  data: SMSRate[];
}

interface InvoiceLine {
  country_iso: string;
  country_name: string;
  volume: number;
  unit_price: number;
  total_cost: number;
  provider: string;
}

interface SavingsLine extends InvoiceLine {
  cheapest_provider: string;
  cheapest_price: number;
  cheapest_total: number;
  savings: number;
  savings_pct: number;
}

export const InvoiceAnalysis: React.FC<Props> = ({ data }) => {
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<string>('Unknown');

  // Build cheapest rate lookup from our data
  const cheapestByCountry = useMemo(() => {
    const map = new Map<string, SMSRate>();
    data
      .filter((r) => r.direction === 'outbound' && r.message_type === 'sms')
      .forEach((r) => {
        const key = r.country_iso;
        const current = map.get(key);
        if (!current || r.total_price_usd < current.total_price_usd) {
          map.set(key, r);
        }
      });
    return map;
  }, [data]);

  // Parse uploaded CSV
  const handleFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseInvoiceCSV(text);
        setLines(parsed.lines);
        setDetectedProvider(parsed.provider);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV');
        setLines([]);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Calculate savings
  const analysis = useMemo<SavingsLine[]>(() => {
    return lines.map((line) => {
      const cheapest = cheapestByCountry.get(line.country_iso);
      const cheapestPrice = cheapest?.total_price_usd ?? line.unit_price;
      const cheapestProvider = cheapest?.provider ?? line.provider;
      const cheapestTotal = cheapestPrice * line.volume;
      const savings = line.total_cost - cheapestTotal;
      const savingsPct = line.total_cost > 0 ? (savings / line.total_cost) * 100 : 0;

      return {
        ...line,
        cheapest_provider: cheapestProvider,
        cheapest_price: cheapestPrice,
        cheapest_total: cheapestTotal,
        savings: Math.max(0, savings),
        savings_pct: Math.max(0, savingsPct),
      };
    }).sort((a, b) => b.savings - a.savings);
  }, [lines, cheapestByCountry]);

  const totalCurrentCost = analysis.reduce((sum, l) => sum + l.total_cost, 0);
  const totalOptimalCost = analysis.reduce((sum, l) => sum + l.cheapest_total, 0);
  const totalSavings = totalCurrentCost - totalOptimalCost;
  const totalSavingsPct = totalCurrentCost > 0 ? (totalSavings / totalCurrentCost) * 100 : 0;
  const totalMessages = analysis.reduce((sum, l) => sum + l.volume, 0);

  const handleClear = () => {
    setLines([]);
    setFileName(null);
    setError(null);
  };

  // Export analysis as CSV
  const handleExport = () => {
    const header = 'Country,ISO,Volume,Current Provider,Current Price,Current Total,Cheapest Provider,Cheapest Price,Cheapest Total,Monthly Savings';
    const rows = analysis.map((l) =>
      `"${l.country_name}",${l.country_iso},${l.volume},${l.provider},${l.unit_price},${l.total_cost.toFixed(2)},${l.cheapest_provider},${l.cheapest_price},${l.cheapest_total.toFixed(2)},${l.savings.toFixed(2)}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sms-savings-analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Invoice Savings Analysis
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Upload your SMS provider invoice (CSV) to see exactly where you're overpaying.
        </p>
      </div>

      {/* Upload area */}
      {lines.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 dark:border-ink-border rounded-2xl p-12 text-center
            hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleInput}
            className="hidden"
            id="invoice-upload"
          />
          <label htmlFor="invoice-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
              Drop your invoice CSV here
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              or click to browse. Supports Twilio, Vonage, Plivo, and generic CSV formats.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-ink-muted">Twilio Usage CSV</span>
              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-ink-muted">Vonage CDR Export</span>
              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-ink-muted">Plivo Usage Report</span>
              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-ink-muted">Generic CSV</span>
            </div>
          </label>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* File info bar */}
          <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-slate-50 dark:bg-ink-card border border-slate-200 dark:border-ink-border">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-brand-500" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{fileName}</p>
                <p className="text-xs text-slate-500">{detectedProvider} invoice &middot; {analysis.length} countries &middot; {totalMessages.toLocaleString()} messages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content="Download analysis as CSV" side="bottom">
                <button onClick={handleExport} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-ink-muted transition-colors text-slate-500">
                  <Download className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Clear and upload a different file" side="bottom">
                <button onClick={handleClear} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-ink-muted transition-colors text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Savings summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Current Monthly Cost</p>
              <p className="price text-2xl font-bold text-slate-900 dark:text-white mt-1">{fmtDollars(totalCurrentCost)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{detectedProvider}</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Optimal Cost</p>
              <p className="price text-2xl font-bold text-brand-500 dark:text-brand-400 mt-1">{fmtDollars(totalOptimalCost)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Best provider per route</p>
            </div>
            <div className="p-5 rounded-xl border-2 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-medium">Monthly Savings</p>
              <p className="price text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {fmtDollars(totalSavings)}
                <span className="text-base ml-1">({totalSavingsPct.toFixed(0)}%)</span>
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">{fmtDollars(totalSavings * 12)}/year</p>
            </div>
          </div>

          {/* Route-by-route analysis */}
          <div className="border border-slate-200 dark:border-ink-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-ink-border bg-slate-50 dark:bg-ink-deep">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Country</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Volume</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Current</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Best Rate</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Savings/mo</th>
                </tr>
              </thead>
              <tbody>
                {analysis.map((line) => (
                  <tr key={line.country_iso} className="border-b border-slate-100 dark:border-ink-border last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{countryFlag(line.country_iso)}</span>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{line.country_name}</p>
                          <p className="text-xs text-slate-500 hidden sm:block">{line.provider}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-300">
                      {line.volume.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                      <div>
                        <span className="price text-slate-700 dark:text-slate-300">{fmtSMSPrice(line.unit_price)}</span>
                        <p className="text-xs text-slate-400">{fmtDollars(line.total_cost)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                      <div>
                        <span className="price text-brand-500 dark:text-brand-400">{fmtSMSPrice(line.cheapest_price)}</span>
                        <p className="text-xs text-slate-400">{line.cheapest_provider}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {line.savings > 0.01 ? (
                        <div className="flex items-center justify-end gap-1">
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {fmtDollars(line.savings)}
                          </span>
                          <span className="text-xs text-slate-400">({line.savings_pct.toFixed(0)}%)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Already cheapest</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Methodology note */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-ink-card border border-slate-200 dark:border-ink-border text-xs text-slate-500 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">How this works</p>
            <p>
              We compare each country route in your invoice against the cheapest available rate across {new Set(data.filter(r => r.direction === 'outbound' && r.message_type === 'sms').map(r => r.provider)).size} providers in our database.
              Total cost includes carrier surcharges where applicable.
              Actual savings may vary based on volume commitments and negotiated rates.
            </p>
          </div>
        </>
      )}

      {/* Instructions */}
      {lines.length === 0 && (
        <div className="mt-8 space-y-6">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">How to export your invoice</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { provider: 'Twilio', steps: 'Console → Usage → All Usage → Export as CSV' },
              { provider: 'Vonage', steps: 'Dashboard → Reports → CDR → Download CSV' },
              { provider: 'Plivo', steps: 'Console → Messaging → Logs → Export' },
              { provider: 'Any provider', steps: 'Export a CSV with columns: country, volume (or count), and price per message' },
            ].map(({ provider, steps }) => (
              <div key={provider} className="p-4 rounded-xl border border-slate-200 dark:border-ink-border bg-white dark:bg-ink-card">
                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{provider}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{steps}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── CSV Parser ──────────────────────────────────────────────── */

function parseInvoiceCSV(text: string): { lines: InvoiceLine[]; provider: string } {
  const rows = text.trim().split('\n').map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));

  if (rows.length < 2) throw new Error('CSV must have at least a header row and one data row');

  const header = rows[0].map(h => h.toLowerCase());

  // Detect provider from header patterns
  let provider = 'Unknown';
  const headerStr = header.join(' ');
  if (headerStr.includes('account_sid') || headerStr.includes('twilio')) provider = 'Twilio';
  else if (headerStr.includes('nexmo') || headerStr.includes('vonage')) provider = 'Vonage';
  else if (headerStr.includes('plivo')) provider = 'Plivo';
  else if (headerStr.includes('clicksend')) provider = 'ClickSend';

  // Find relevant columns
  const countryCol = findColumn(header, ['country', 'destination_country', 'country_code', 'country_iso', 'iso', 'to_country']);
  const volumeCol = findColumn(header, ['count', 'volume', 'quantity', 'messages', 'units', 'message_count', 'sms_count', 'num_segments']);
  const priceCol = findColumn(header, ['price', 'unit_price', 'rate', 'price_per_sms', 'cost_per_unit', 'unit_cost', 'price_unit']);
  const totalCol = findColumn(header, ['total', 'total_cost', 'amount', 'cost', 'total_price', 'subtotal']);
  const nameCol = findColumn(header, ['country_name', 'destination', 'destination_name', 'name']);

  if (countryCol === -1) {
    throw new Error('Could not find a country column. Expected: country, destination_country, country_code, or iso');
  }
  if (volumeCol === -1 && totalCol === -1) {
    throw new Error('Could not find volume or total cost column. Expected: count, volume, quantity, or total');
  }

  // Aggregate by country
  const countryMap = new Map<string, { name: string; volume: number; totalCost: number; priceSum: number; priceCount: number }>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    let iso = (row[countryCol] || '').toUpperCase().trim();
    // Handle full country names
    if (iso.length > 2) {
      iso = countryNameToISO(iso) || iso.slice(0, 2);
    }
    if (iso.length !== 2) continue;

    const name = nameCol >= 0 ? row[nameCol] : iso;
    const volume = volumeCol >= 0 ? parseFloat(row[volumeCol]) || 0 : 1;
    const price = priceCol >= 0 ? parseFloat(row[priceCol]) || 0 : 0;
    const total = totalCol >= 0 ? parseFloat(row[totalCol]) || 0 : price * volume;

    const existing = countryMap.get(iso) || { name, volume: 0, totalCost: 0, priceSum: 0, priceCount: 0 };
    existing.volume += volume;
    existing.totalCost += total;
    if (price > 0) {
      existing.priceSum += price;
      existing.priceCount += 1;
    }
    if (name.length > 2 && name !== iso) existing.name = name;
    countryMap.set(iso, existing);
  }

  const lines: InvoiceLine[] = [];
  for (const [iso, info] of countryMap) {
    if (info.volume <= 0 && info.totalCost <= 0) continue;

    const unitPrice = info.priceCount > 0
      ? info.priceSum / info.priceCount
      : info.volume > 0
        ? info.totalCost / info.volume
        : 0;

    const totalCost = info.totalCost > 0 ? info.totalCost : unitPrice * info.volume;

    lines.push({
      country_iso: iso,
      country_name: info.name || iso,
      volume: Math.round(info.volume),
      unit_price: unitPrice,
      total_cost: totalCost,
      provider,
    });
  }

  if (lines.length === 0) {
    throw new Error('No valid data rows found. Check that your CSV has country, volume, and price columns.');
  }

  return { lines, provider };
}

function findColumn(header: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = header.findIndex(h => h === candidate || h.includes(candidate));
    if (idx >= 0) return idx;
  }
  return -1;
}

function countryNameToISO(name: string): string | null {
  const map: Record<string, string> = {
    'united states': 'US', 'usa': 'US', 'us': 'US',
    'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB',
    'canada': 'CA', 'australia': 'AU', 'germany': 'DE',
    'france': 'FR', 'india': 'IN', 'japan': 'JP',
    'brazil': 'BR', 'mexico': 'MX', 'spain': 'ES',
    'italy': 'IT', 'netherlands': 'NL', 'singapore': 'SG',
    'south korea': 'KR', 'korea': 'KR', 'philippines': 'PH',
    'indonesia': 'ID', 'thailand': 'TH', 'nigeria': 'NG',
    'south africa': 'ZA', 'uae': 'AE', 'united arab emirates': 'AE',
    'saudi arabia': 'SA', 'poland': 'PL', 'sweden': 'SE',
    'norway': 'NO', 'denmark': 'DK', 'finland': 'FI',
    'austria': 'AT', 'switzerland': 'CH', 'belgium': 'BE',
    'ireland': 'IE', 'portugal': 'PT', 'new zealand': 'NZ',
    'china': 'CN', 'russia': 'RU', 'turkey': 'TR',
    'israel': 'IL', 'egypt': 'EG', 'kenya': 'KE',
    'colombia': 'CO', 'chile': 'CL', 'argentina': 'AR',
    'peru': 'PE', 'malaysia': 'MY', 'vietnam': 'VN',
    'taiwan': 'TW', 'hong kong': 'HK', 'pakistan': 'PK',
    'bangladesh': 'BD', 'romania': 'RO', 'czech republic': 'CZ',
    'greece': 'GR', 'hungary': 'HU', 'puerto rico': 'PR',
  };
  return map[name.toLowerCase().trim()] || null;
}
