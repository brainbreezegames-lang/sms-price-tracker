-- SMS Price Tracker — Supabase Database Schema
-- Run this in your Supabase SQL Editor after creating a project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users (extends Supabase Auth) ─────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── API Keys ──────────────────────────────────────────────────
create table public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  key_hash text not null unique,
  key_prefix text not null,  -- first 8 chars for display
  name text not null default 'Default',
  requests_today int not null default 0,
  last_request_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.api_keys enable row level security;
create policy "Users can manage own keys" on public.api_keys
  for all using (auth.uid() = user_id);

-- Index for fast key lookups
create index idx_api_keys_hash on public.api_keys(key_hash) where revoked_at is null;

-- ── Price Alerts ──────────────────────────────────────────────
create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text,                -- null = any provider
  country_iso text not null,
  direction text not null default 'outbound',
  message_type text not null default 'sms',
  condition text not null check (condition in ('below', 'above', 'change')),
  threshold_usd numeric(10, 6),  -- for below/above conditions
  notify_email boolean not null default true,
  notify_webhook text,          -- optional webhook URL
  last_triggered_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.alerts enable row level security;
create policy "Users can manage own alerts" on public.alerts
  for all using (auth.uid() = user_id);

-- ── Daily request counter reset function ──────────────────────
create function public.reset_daily_requests()
returns void as $$
begin
  update public.api_keys set requests_today = 0;
end;
$$ language plpgsql security definer;

-- Schedule this via Supabase pg_cron:
-- select cron.schedule('reset-api-counts', '0 0 * * *', 'select public.reset_daily_requests()');
