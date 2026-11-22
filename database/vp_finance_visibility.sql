create or replace function public.vp_own_finance() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.vp_is_active() then raise exception 'Aktive Anmeldung erforderlich' using errcode='42501'; end if;
 select jsonb_build_object(
 'earnings',coalesce((select jsonb_agg(to_jsonb(x)) from (select id,earner_id,order_reference,order_at,period,original_net_cents,remaining_net_cents,earner_rate_bps,status,closed,booked_earner_cents from public.vp_earnings where earner_id=auth.uid() order by order_at desc limit 200) x),'[]'::jsonb),
 'finance_lines',coalesce((select jsonb_agg(to_jsonb(x)) from (select id,earner_id,period,kind,net_cents,earner_commission_cents,reserve_delta_cents from public.vp_finance_lines where earner_id=auth.uid() order by created_at desc limit 300) x),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.vp_own_finance() from public,anon;
grant execute on function public.vp_own_finance() to authenticated;
alter policy vp_earnings_read on public.vp_earnings using(public.vp_is_admin() or (public.vp_is_active() and payee_id=auth.uid() and exists(select 1 from public.vp_accounts a where a.user_id=auth.uid() and a.role='agency')));
alter policy vp_finance_lines_read on public.vp_finance_lines using(public.vp_is_admin() or (public.vp_is_active() and payee_id=auth.uid() and exists(select 1 from public.vp_accounts a where a.user_id=auth.uid() and a.role='agency')));
