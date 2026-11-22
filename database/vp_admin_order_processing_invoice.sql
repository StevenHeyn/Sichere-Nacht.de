-- Admin portal order processing, supplier progress and invoice-mail visibility.
-- No supplier orders are submitted and no customer emails are sent by this migration.
create or replace function public.vp_admin_shop_order_overview()
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare payload jsonb;
begin
 perform public.vp_require_admin();
 select jsonb_build_object(
  'total',count(*),'live_count',count(*) filter(where not o.test_mode),
  'test_count',count(*) filter(where o.test_mode),
  'live_gross_cents',coalesce(sum(o.amount_total) filter(where not o.test_mode and o.status='paid'),0),
  'orders',coalesce((
    select jsonb_agg(to_jsonb(t) order by t.created_at desc,t.id desc)
    from (
      select x.id,x.stripe_session_id,x.created_at,x.updated_at,x.test_mode,x.status,x.amount_total,x.amount_tax,x.shipping_amount,
        x.currency,x.customer_name,x.customer_email,x.customer_type,x.buyer_company,x.vp_id,
        a.full_name as partner_name,a.email as partner_email,x.fulfillment_status,x.shipped_at,
        x.invoice_number,x.shipping_name,x.shipping_address,x.items,
        sf.status as supplier_status,sf.submission_reference,sf.supplier_reference,sf.stock_evidence,
        sf.dispatch_evidence,sf.dispatched_at,sf.carrier,sf.tracking_number,
        im.status as invoice_mail_status,im.sent_at as invoice_mail_sent_at
      from public.orders x
      left join public.vp_accounts a on a.referral_code=x.vp_id
      left join public.supplier_fulfillments sf on sf.order_id=x.id
      left join public.order_mail_jobs im on im.order_id=x.id and im.kind='invoice'
      order by x.created_at desc,x.id desc limit 100
    ) t
  ),'[]'::jsonb)
 ) into payload from public.orders o;
 return payload;
end $$;
revoke all on function public.vp_admin_shop_order_overview() from public,anon,authenticated;
grant execute on function public.vp_admin_shop_order_overview() to authenticated;

-- A processing flag never means a supplier order was transmitted or stock confirmed.
create or replace function public.mark_shop_order_processing(p_session_id text,p_actor uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders%rowtype;
begin
 if p_actor is null then raise exception 'Adminidentität fehlt';end if;
 select * into o from public.orders where stripe_session_id=p_session_id for update;
 if not found or o.test_mode or o.status<>'paid' then raise exception 'Nur echte bezahlte Bestellungen können bearbeitet werden';end if;
 if o.shipped_at is not null or o.fulfillment_status='shipped' then raise exception 'Bestellung bereits versendet';end if;
 if o.fulfillment_status='processing' then return jsonb_build_object('status','processing','already_marked',true);end if;
 if o.fulfillment_status is distinct from 'pending' then raise exception 'Statuswechsel nicht erlaubt';end if;
 update public.orders set fulfillment_status='processing',updated_at=now() where id=o.id;
 insert into public.supplier_fulfillment_events(order_id,action,reference)
 values(o.id,'processing','admin-user:'||p_actor::text);
 return jsonb_build_object('status','processing','already_marked',false);
end $$;
revoke all on function public.mark_shop_order_processing(text,uuid) from public,anon,authenticated;
grant execute on function public.mark_shop_order_processing(text,uuid) to service_role;
