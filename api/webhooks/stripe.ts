import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-01-27.acacia' as any });

// Vercel doesn't parse the body for webhooks — we need the raw body
export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!supabaseUrl || !supabaseKey || !webhookSecret) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify webhook signature
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;

      if (userId && plan) {
        await supabase
          .from('profiles')
          .update({
            plan,
            stripe_subscription_id: session.subscription as string,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      // Map price to plan
      const priceId = sub.items.data[0]?.price.id;
      let plan = 'free';
      if (priceId === process.env.STRIPE_STARTER_PRICE_ID) plan = 'starter';
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'pro';

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId);

      if (profiles?.[0]) {
        await supabase
          .from('profiles')
          .update({
            plan: sub.status === 'active' ? plan : 'free',
            stripe_subscription_id: sub.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profiles[0].id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId);

      if (profiles?.[0]) {
        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profiles[0].id);
      }
      break;
    }
  }

  return res.status(200).json({ received: true });
}
