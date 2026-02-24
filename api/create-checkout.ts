import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-01-27.acacia' as any });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey || !process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify user
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid auth token' });

  const { plan } = req.body || {};
  if (!plan || !['starter', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan. Must be "starter" or "pro"' });
  }

  // Price IDs from Stripe (set these in env vars)
  const priceId = plan === 'starter'
    ? process.env.STRIPE_STARTER_PRICE_ID
    : process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    return res.status(500).json({ error: `No Stripe price ID configured for ${plan} plan` });
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  // Create checkout session
  const origin = req.headers.origin || 'https://sms-price-tracker.vercel.app';
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, plan },
  });

  return res.status(200).json({ url: session.url });
}
