-- Legacy records remain unclassified; no retroactive classification or waiver.
alter table public.orders add column customer_type text not null default 'unclassified' check(customer_type in ('b2c','b2b','unclassified'));
alter table public.orders add column buyer_company text;
alter table public.orders add column business_purchase_declared boolean not null default false;
alter table public.orders add column buyer_policy_version text;
alter table public.orders add column buyer_declared_at timestamptz;
alter table public.orders add constraint buyer_b2b_evidence check(customer_type<>'b2b' or (buyer_company is not null and length(btrim(buyer_company)) between 2 and 160 and business_purchase_declared and buyer_policy_version is not null and buyer_policy_version='2026-11-13-v1' and buyer_declared_at is not null));
create index orders_customer_type_idx on public.orders(customer_type,created_at desc);
create function public.preserve_order_buyer_declaration() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if row(old.customer_type,old.buyer_company,old.business_purchase_declared,old.buyer_policy_version,old.buyer_declared_at) is distinct from row(new.customer_type,new.buyer_company,new.business_purchase_declared,new.buyer_policy_version,new.buyer_declared_at) and (old.customer_type<>'unclassified' or old.invoice_number is not null) then
  raise exception 'Kaufarterklärung ist dokumentiert. Keine automatische Änderung durch spätere Webhooks oder nach Rechnungserstellung.';
 end if;
 return new;
end $$;
revoke all on function public.preserve_order_buyer_declaration() from public,anon,authenticated;
create trigger preserve_order_buyer_declaration before update on public.orders for each row execute function public.preserve_order_buyer_declaration();
create or replace function public.issue_shipped_invoice(p_session_id text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders%rowtype; number text;
begin
 select * into o from public.orders where stripe_session_id=p_session_id for update;
 if not found or o.shipped_at is null then raise exception 'Bestellung noch nicht versendet'; end if;
 if o.customer_email is null then raise exception 'Kunden-E-Mail fehlt'; end if;
 if o.shipping_country is distinct from 'DE' or o.amount_tax is null or o.amount_tax<=0 then raise exception 'Steuerdaten nicht freigegeben'; end if;
 if o.invoice_number is null then
  number:='SN-'||to_char(now() at time zone 'Europe/Berlin','YYYY')||'-'||lpad(nextval('public.sichere_nacht_invoice_seq')::text,6,'0');
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
