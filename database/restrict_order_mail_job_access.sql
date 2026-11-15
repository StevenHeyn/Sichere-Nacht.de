-- Applied 2026-11-15. Server-only queue; trigger remains operational.
revoke all on table public.order_mail_jobs from public, anon, authenticated;
revoke all on function public.queue_paid_order_confirmation() from public, anon, authenticated;
grant execute on function public.queue_paid_order_confirmation() to service_role;
