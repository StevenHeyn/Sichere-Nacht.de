-- Retail amounts only; historical quotes are never repriced.
update public.vp_merch_products set price_options='[{"quantity":500,"net_cents":2444,"total_cents":2908}]'::jsonb where id='business-card';
update public.vp_merch_products set price_options='[{"quantity":1000,"net_cents":4215,"total_cents":5016}]'::jsonb where id='qr-flyer';

alter table public.vp_merch_orders
 add column payment_status text check(payment_status in ('pending','processing','paid','failed','expired')),
 add column checkout_request_key uuid,
 add column stripe_session_id text unique,
 add column stripe_payment_intent_id text,
 add column paid_at timestamptz,
 add column amount_tax integer,
 add column customer_email text,
 add column customer_name text,
 add column shipping_details jsonb,
 add column billing_address jsonb,
 add column personalization jsonb,
 add column invoice_url text,
 add column invoice_pdf text,
 add column payment_event_id text,
 add constraint vp_merch_request_unique unique(user_id,checkout_request_key);

-- The user's authenticated context selects the owner and freezes the retail offer.
create function public.vp_merch_checkout_order(p_product text,p_quantity integer,p_request_key uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare me public.vp_accounts%rowtype;p public.vp_merch_products%rowtype;o public.vp_merch_orders%rowtype;offer jsonb;n integer;
begin
 perform public.vp_require_active();
 if p_request_key is null or p_quantity is null then raise exception 'Druckpaket fehlt';end if;
 select * into me from public.vp_accounts where user_id=auth.uid() for update;
 select * into o from public.vp_merch_orders where user_id=auth.uid() and checkout_request_key=p_request_key;
 if found then
  if o.product_id<>p_product or o.quantity<>p_quantity then raise exception 'Bestellanfrage wurde verändert';end if;
  return o.id;
 end if;
 select * into p from public.vp_merch_products where id=p_product and active;
 if not found then raise exception 'Werbemittel nicht verfügbar';end if;
 select x into offer from jsonb_array_elements(p.price_options) x where (x->>'quantity')::integer=p_quantity;
 if offer is null or (offer->>'total_cents')::integer<1 then raise exception 'Für diese Menge bitte ein Angebot anfragen';end if;
 select count(*) into n from public.vp_merch_orders where user_id=auth.uid() and created_at>now()-interval '1 day';
 if n>=20 then raise exception 'Anfragelimit erreicht';end if;
 insert into public.vp_merch_orders(user_id,product_id,quantity,size,referral_url,status,quote_total_cents,quote_description,quote_version,quoted_at,payment_status,checkout_request_key,personalization)
 values(auth.uid(),p.id,p_quantity,me.clothing_size,'https://sichere-nacht.de/?vp='||me.referral_code,'quoted',(offer->>'total_cents')::integer,
 p_quantity||' Stück · '||p.title||E'\n'||p.description,1,now(),'pending',p_request_key,
 jsonb_build_object('name',me.full_name,'company',me.company,'email',me.email,'phone',me.phone,'referral_url','https://sichere-nacht.de/?vp='||me.referral_code,'print_approval','required')) returning id into o.id;
 return o.id;
end $$;
revoke all on function public.vp_merch_checkout_order(text,integer,uuid) from public,anon,authenticated;
grant execute on function public.vp_merch_checkout_order(text,integer,uuid) to authenticated;

-- Only the shop backend may associate a real Stripe session or confirm a payment.
create function public.vp_merch_attach_session(p_order uuid,p_user uuid,p_session text)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_session !~ '^cs_(live|test)_' then raise exception 'Ungültige Zahlung';end if;
 update public.vp_merch_orders set stripe_session_id=p_session where id=p_order and user_id=p_user
 and payment_status='pending' and (stripe_session_id is null or stripe_session_id=p_session);
 if not found then raise exception 'Zahlung nicht zuordenbar';end if;
end $$;

create function public.vp_merch_record_payment(p_order uuid,p_session text,p_user uuid,p_state text,p_amount integer,p_currency text,p_details jsonb,p_event text)
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
revoke all on function public.vp_merch_attach_session(uuid,uuid,text),public.vp_merch_record_payment(uuid,text,uuid,text,integer,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.vp_merch_attach_session(uuid,uuid,text),public.vp_merch_record_payment(uuid,text,uuid,text,integer,text,jsonb,text) to service_role;
grant select,update on public.vp_merch_orders to service_role;
grant select on public.vp_accounts,public.vp_merch_products to service_role;

-- Never change a price once a checkout exists. Existing manual quotes still work.
create or replace function public.vp_admin_merch(p_id uuid,p_total integer,p_description text) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_admin();if p_total<1 or length(p_description)<20 then raise exception 'Gesamtbruttopreis inklusive Versand und konkrete Spezifikation erforderlich';end if;
 update public.vp_merch_orders set status='quoted',quote_total_cents=p_total,quote_description=left(p_description,5000),quote_version=quote_version+1,quoted_at=now() where id=p_id and status in ('requested','quoted') and payment_status is null;
 if not found then raise exception 'Anfrage nicht mehr änderbar';end if;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'merch_quote',p_id::text);end$$;
create or replace function public.vp_merch_accept(p_id uuid,p_version integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_active();update public.vp_merch_orders set status='accepted',accepted_quote_version=p_version,accepted_at=now() where id=p_id and user_id=auth.uid() and status='quoted' and quote_total_cents>0 and quote_version=p_version and payment_status is null;
 if not found then raise exception 'Angebot verändert oder Onlinezahlung erforderlich';end if;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'merch_quote_accepted',p_id::text);end$$;
