create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  creem_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creem_subscription_id text not null unique,
  product_id text not null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_product_active_unique
  on public.subscriptions (user_id, product_id)
  where status in ('active', 'trialing');

create table if not exists public.trial_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  used_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_locks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  status text not null default 'pending',
  checkout_url text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists checkout_locks_user_product_pending_unique
  on public.checkout_locks (user_id, product_id)
  where status = 'pending';

alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.trial_usage enable row level security;
alter table public.checkout_locks enable row level security;
