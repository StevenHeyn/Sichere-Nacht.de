-- VP reminder send ledger. Apply after reviewing email/legal policy.
create table if not exists public.vp_daily_reminders (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 reminder_date date not null,
 reminder_kind text not null check (reminder_kind in ('profile','training','both')),
 status text not null default 'reserved' check (status in ('reserved','sent','failed')),
 provider_message_id text,
 created_at timestamptz not null default now(),
 sent_at timestamptz,
 unique (user_id,reminder_date)
);
alter table public.vp_daily_reminders enable row level security;
revoke all on public.vp_daily_reminders from anon, authenticated;
-- Only trusted server-side service-role code may reserve/send reminders.
create index if not exists vp_daily_reminders_status_idx on public.vp_daily_reminders(status,reminder_date);
