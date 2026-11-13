-- Sichere Nacht: einmalig im Supabase SQL Editor ausführen.
-- Keine öffentlichen Tabellenzugriffe: nur der serverseitige service_role Schlüssel.
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_event_id text not null,
  status text not null check (status in ('paid')),
  amount_total integer not null check (amount_total>=0),
  amount_subtotal integer,
  amount_tax integer,
  shipping_amount integer,
  currency text not null,
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  billing_address jsonb,
  items jsonb not null default '[]'::jsonb,
  shipping_country text,
  vp_id text,
  test_mode boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
-- Supabase service_role bypasses RLS, so no public policies are needed.
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
