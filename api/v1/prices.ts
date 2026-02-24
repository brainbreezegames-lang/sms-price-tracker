import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// Rate limits by plan
const RATE_LIMITS: Record<string, number> = {
  free: 100,       // 100 requests/day
  starter: 10000,  // 10K requests/day
  pro: -1,         // unlimited
};

let cachedData: any = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

function loadData() {
  const now = Date.now();
  if (cachedData && now - cacheTime < CACHE_TTL) return cachedData;

  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'sms-data.json'), 'utf8');
    cachedData = JSON.parse(raw);
    cacheTime = now;
    return cachedData;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-API-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Load data
  const pkg = loadData();
  if (!pkg) return res.status(500).json({ error: 'Data not available' });

  // Check API key (optional — no key = free tier with IP rate limit)
  const apiKey = (req.headers['x-api-key'] as string) || '';
  let plan = 'free';
  let userId: string | null = null;

  if (apiKey) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const keyHash = createHash('sha256').update(apiKey).digest('hex');

      const { data: keyRow } = await supabase
        .from('api_keys')
        .select('id, user_id, requests_today')
        .eq('key_hash', keyHash)
        .is('revoked_at', null)
        .single();

      if (!keyRow) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      // Get user plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', keyRow.user_id)
        .single();

      plan = profile?.plan || 'free';
      userId = keyRow.user_id;

      // Check rate limit
      const limit = RATE_LIMITS[plan] || 100;
      if (limit > 0 && keyRow.requests_today >= limit) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          limit,
          plan,
          reset: 'Midnight UTC',
        });
      }

      // Increment counter
      await supabase
        .from('api_keys')
        .update({
          requests_today: keyRow.requests_today + 1,
          last_request_at: new Date().toISOString(),
        })
        .eq('id', keyRow.id);
    }
  }

  // Parse query filters
  const {
    country,
    provider,
    channel,
    direction,
    format,
    limit: limitStr,
    offset: offsetStr,
  } = req.query as Record<string, string>;

  let results = pkg.data as any[];

  if (country) {
    const countries = country.toUpperCase().split(',');
    results = results.filter((r: any) => countries.includes(r.country_iso));
  }
  if (provider) {
    const providers = provider.toLowerCase().split(',');
    results = results.filter((r: any) => providers.includes(r.provider.toLowerCase()));
  }
  if (channel) {
    const channels = channel.toLowerCase().split(',');
    results = results.filter((r: any) => channels.includes(r.message_type));
  }
  if (direction) {
    results = results.filter((r: any) => r.direction === direction.toLowerCase());
  }

  // Pagination
  const total = results.length;
  const offset = parseInt(offsetStr || '0', 10) || 0;
  const limit = Math.min(parseInt(limitStr || '100', 10) || 100, plan === 'free' ? 100 : 1000);
  results = results.slice(offset, offset + limit);

  // Response
  const response: any = {
    data: results,
    meta: {
      total,
      count: results.length,
      offset,
      limit,
      updated: pkg.lastUpdated,
    },
  };

  // Add extra data for paid plans
  if (plan !== 'free') {
    response.meta.plan = plan;
    if (req.query.include === 'all') {
      response.phoneNumbers = pkg.phoneNumbers;
      response.volumeTiers = pkg.volumeTiers;
      response.tenDlcFees = pkg.tenDlcFees;
    }
  }

  // CSV format support for starter+ plans
  if (format === 'csv' && plan !== 'free') {
    const header = 'provider,country_iso,country_name,direction,message_type,price_usd,total_price_usd,carrier_surcharge_usd';
    const rows = results.map((r: any) =>
      `${r.provider},${r.country_iso},"${r.country_name}",${r.direction},${r.message_type},${r.price_usd},${r.total_price_usd},${r.carrier_surcharge_usd || 0}`
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sms-prices.csv');
    return res.status(200).send([header, ...rows].join('\n'));
  }

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  return res.status(200).json(response);
}
