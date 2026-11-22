-- Requires an authenticated active VP admin; shop orders remain unavailable via direct table SELECT.
-- Applied in Supabase as vp_admin_shop_order_overview.
create or replace function public.vp_admin_shop_order_overview()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare payload jsonb;
begin
 perform public.vp_require_admin();
 select jsonb_build_object(
  'total',count(*),
  'live_count',count(*) filter(where not o.test_mode),
  'test_count',count(*) filter(where o.test_mode),
  'live_gross_cents',coalesce(sum(o.amount_total) filter(where not o.test_mode and o.status='paid'),0),
  'orders',coalesce((
    select jsonb_agg(to_jsonb(t) order by t.created_at desc,t.id desc)
    from (select x.id,x.created_at,x.updated_at,x.test_mode,x.status,x.amount_total,x.amount_tax,
          x.shipping_amount,x.currency,x.customer_name,x.customer_email,x.customer_type,x.buyer_company,
          x.vp_id,a.full_name as partner_name,a.email as partner_email,
          x.fulfillment_status,x.shipped_at,x.invoice_number,x.shipping_name,x.shipping_address,x.items
      from public.orders x left join public.vp_accounts a on a.referral_code=x.vp_id
      order by x.created_at desc,x.id desc limit 100) t
   ),'[]'::jsonb)
 ) into payload from public.orders o;
 return payload;
end $$;
revoke all on function public.vp_admin_shop_order_overview() from public,anon,authenticated;
grant execute on function public.vp_admin_shop_order_overview() to authenticated;
comment on function public.vp_admin_shop_order_overview() is
 'Read-only order overview: active VP admins only; limit 100 latest records; no payment card data.';
