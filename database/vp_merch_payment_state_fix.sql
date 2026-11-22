create or replace function public.vp_merch_record_payment(p_order uuid,p_session text,p_user uuid,p_state text,p_amount integer,p_currency text,p_details jsonb,p_event text)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare o public.vp_merch_orders%rowtype;
begin
 select * into o from public.vp_merch_orders where id=p_order for update;
 if not found or o.stripe_session_id is distinct from p_session or o.user_id is distinct from p_user
 or o.quote_total_cents is distinct from p_amount or p_currency is distinct from 'eur'
 then raise exception 'Zahlungszuordnung oder Betrag stimmt nicht';end if;
 if p_state not in ('paid','processing','failed','expired') then raise exception 'Ungültiger Zahlungsstatus';end if;
 if p_state='paid' then
  if p_details->'shipping'->'address'->>'country' is distinct from 'DE'
  or abs(coalesce((p_details->>'tax')::integer,-99999)-round(p_amount*19.0/119))>1
  then raise exception 'Lieferland oder Steuerbetrag stimmt nicht';end if;
  update public.vp_merch_orders set payment_status='paid',status=case when status='fulfilled' then status else 'accepted' end,
  accepted_quote_version=quote_version,accepted_at=coalesce(accepted_at,now()),paid_at=coalesce(paid_at,now()),
  stripe_payment_intent_id=p_details->>'payment_intent',amount_tax=(p_details->>'tax')::integer,
  customer_email=p_details->>'email',customer_name=p_details->>'name',shipping_details=p_details->'shipping',billing_address=p_details->'billing_address',
  invoice_url=coalesce(p_details->>'invoice_url',invoice_url),invoice_pdf=coalesce(p_details->>'invoice_pdf',invoice_pdf),payment_event_id=p_event where id=p_order;
 elsif o.payment_status<>'paid' and not (o.payment_status in ('failed','expired') and p_state='processing') then
  update public.vp_merch_orders set payment_status=p_state,payment_event_id=p_event where id=p_order;
 end if;
end $$;
