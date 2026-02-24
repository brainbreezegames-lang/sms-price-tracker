import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify user
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid auth token' });

  // Check plan — alerts require starter+
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (!profile || profile.plan === 'free') {
    return res.status(403).json({ error: 'Price alerts require a Starter or Pro plan' });
  }

  // POST — Create alert
  if (req.method === 'POST') {
    const { country_iso, provider, direction, message_type, condition, threshold_usd, notify_webhook } = req.body || {};

    if (!country_iso || !condition) {
      return res.status(400).json({ error: 'country_iso and condition are required' });
    }
    if ((condition === 'below' || condition === 'above') && threshold_usd == null) {
      return res.status(400).json({ error: 'threshold_usd required for below/above conditions' });
    }

    // Limit: 10 alerts for starter, 50 for pro
    const { count } = await supabase
      .from('alerts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true);

    const maxAlerts = profile.plan === 'pro' ? 50 : 10;
    if ((count || 0) >= maxAlerts) {
      return res.status(400).json({ error: `Maximum ${maxAlerts} active alerts for ${profile.plan} plan` });
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        country_iso: country_iso.toUpperCase(),
        provider: provider || null,
        direction: direction || 'outbound',
        message_type: message_type || 'sms',
        condition,
        threshold_usd: threshold_usd || null,
        notify_webhook: notify_webhook || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ alert: data });
  }

  // GET — List alerts
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ alerts: data });
  }

  // DELETE — Remove alert
  if (req.method === 'DELETE') {
    const alertId = req.query.id as string;
    if (!alertId) return res.status(400).json({ error: 'Missing alert id' });

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
