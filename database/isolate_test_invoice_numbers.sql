-- Applied as Supabase migration isolate_test_invoice_numbers on 2026-11-14.
-- Existing invoices are immutable and are not renumbered. New sandbox invoices
-- use the existing order ID and never advance the real invoice sequence.
create or replace function public.issue_shipped_invoice(p_session_id text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders%rowtype; number text;
begin
 select * into o from public.orders where stripe_session_id=p_session_id for update;
 if not found or o.shipped_at is null then raise exception 'Bestellung noch nicht versendet'; end if;
 if o.status is distinct from 'paid' then raise exception 'Bezahlte Bestellung erforderlich'; end if;
 if o.customer_email is null then raise exception 'Kunden-E-Mail fehlt'; end if;
 if o.shipping_country is distinct from 'DE' or o.currency is distinct from 'eur' or o.amount_tax is null or o.amount_tax<=0 then raise exception 'Steuerdaten nicht freigegeben'; end if;
 if (o.test_mode and left(o.stripe_session_id,8)<>'cs_test_') or (not o.test_mode and left(o.stripe_session_id,8)<>'cs_live_') then raise exception 'Zahlungsmodus und Bestellreferenz passen nicht zusammen'; end if;
 if o.invoice_number is null then
  if o.test_mode then
   number:='SN-TEST-'||to_char(now() at time zone 'Europe/Berlin','YYYY')||'-'||lpad(o.id::text,greatest(6,length(o.id::text)),'0');
  else
   number:='SN-'||to_char(now() at time zone 'Europe/Berlin','YYYY')||'-'||lpad(nextval('public.sichere_nacht_invoice_seq')::text,6,'0');
  end if;
  update public.orders set invoice_number=number,invoice_issued_at=now(),invoice_snapshot=jsonb_build_object(
   'invoice_number',number,'issued_at',now(),'shipped_at',o.shipped_at,'customer_name',o.customer_name,'customer_email',o.customer_email,
   'billing_address',o.billing_address,'shipping_address',o.shipping_address,'amount_total',o.amount_total,'amount_subtotal',o.amount_subtotal,
   'amount_tax',o.amount_tax,'shipping_amount',o.shipping_amount,'currency',o.currency,'items',o.items,'test_mode',o.test_mode,
   'customer_type',o.customer_type,'buyer_company',o.buyer_company,'business_purchase_declared',o.business_purchase_declared,
   'buyer_policy_version',o.buyer_policy_version,'buyer_declared_at',o.buyer_declared_at
  ),updated_at=now() where id=o.id returning * into o;
 end if;
 insert into public.order_mail_jobs(order_id,kind) values(o.id,'invoice') on conflict do nothing;
 return jsonb_build_object('invoice_number',o.invoice_number,'invoice_issued_at',o.invoice_issued_at);
end $$;
revoke all on function public.issue_shipped_invoice(text) from public,anon,authenticated;
grant execute on function public.issue_shipped_invoice(text) to service_role;
