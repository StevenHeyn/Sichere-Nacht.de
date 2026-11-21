-- Service-role-only queue for one admin notification per newly created VP auth account.
create table if not exists public.vp_signup_admin_notifications (
 user_id uuid primary key references auth.users(id) on delete cascade,
 signup_email text not null,
 status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
 attempts integer not null default 0,
 created_at timestamptz not null default now(),
 last_attempt_at timestamptz,
 sent_at timestamptz,
 last_error_code text
);
create index if not exists vp_signup_admin_notifications_pending_idx
 on public.vp_signup_admin_notifications(status,created_at);
alter table public.vp_signup_admin_notifications enable row level security;
revoke all on public.vp_signup_admin_notifications from public, anon, authenticated;
grant all on public.vp_signup_admin_notifications to service_role;
