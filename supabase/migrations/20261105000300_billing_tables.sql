-- Connect Local: plans, subscriptions, credits and payment records.
-- Prices are stored in paise-free integer rupees so the app never renders a
-- hardcoded price. Razorpay amounts must be converted to paise server-side.

create table public.plans (
  id text primary key,
  name text not null,
  tagline text,
  monthly_price_inr integer not null default 0 check (monthly_price_inr >= 0),
  annual_price_inr integer not null default 0 check (annual_price_inr >= 0),
  limits jsonb not null default '{}'::jsonb,
  features text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_packs (
  id text primary key,
  credits integer not null check (credits > 0),
  price_inr integer not null check (price_inr >= 0),
  label text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status public.subscription_status not null default 'active',
  provider public.payment_provider not null default 'razorpay',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_open_per_user_idx
  on public.subscriptions (user_id)
  where status in ('trialing', 'active', 'past_due');

create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_provider_idx on public.subscriptions (provider_subscription_id);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null,
  reference_type text,
  reference_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.payment_provider not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text unique,
  amount_inr integer not null check (amount_inr >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status public.payment_status not null default 'created',
  purpose text not null check (
    purpose in ('subscription', 'credit_pack', 'verification', 'boost')
  ),
  purpose_id text,
  receipt text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_user_idx on public.payments (user_id, created_at desc);
create index payments_status_idx on public.payments (status);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null default 'razorpay',
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);

create index payment_events_type_idx on public.payment_events (event_type);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
