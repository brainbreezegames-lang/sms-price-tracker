import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify user via Supabase Auth token
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid auth token' });

  // POST — Create new API key
  if (req.method === 'POST') {
    const name = req.body?.name || 'Default';

    // Generate a random API key: smsr_xxxxxxxxxxxxxxxxxxxx
    const rawKey = `smsr_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name,
      })
      .select('id, key_prefix, name, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Return the full key ONCE — user must save it
    return res.status(201).json({
      ...data,
      key: rawKey,
      warning: 'Save this key now. You won\'t be able to see it again.',
    });
  }

  // GET — List user's API keys
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, requests_today, last_request_at, created_at, revoked_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ keys: data });
  }

  // DELETE — Revoke an API key
  if (req.method === 'DELETE') {
    const keyId = req.query.id as string;
    if (!keyId) return res.status(400).json({ error: 'Missing key id' });

    const { error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
