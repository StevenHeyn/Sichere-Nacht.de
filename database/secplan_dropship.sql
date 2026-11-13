-- Additive migration. No paid orders are generated and no supplier/email is contacted.
alter table public.orders add column if not exists shipping_name text;
create table public.supplier_fulfillments (
 order_id bigint primary key references public.orders(id),
 supplier text not null default 'SECPLAN' check (supplier='SECPLAN'),
 status text not null default 'pending' check(status in ('pending','submitted','confirmed','shipped','legacy')),
 submission_reference text, supplier_reference text,
 stock_evidence text, stock_checked_at timestamptz, submitted_at timestamptz, confirmed_at timestamptz,
 dispatch_evidence text, dispatched_at timestamptz, carrier text, tracking_number text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.supplier_fulfillment_events (
 id bigint generated always as identity primary key,
 order_id bigint not null references public.orders(id),
 action text not null, reference text,
 created_at timestamptz not null default now()
);
alter table public.supplier_fulfillments enable row level security;
alter table public.supplier_fulfillment_events enable row level security;
revoke all on public.supplier_fulfillments,public.supplier_fulfillment_events from public,anon,authenticated,service_role;
grant select on public.supplier_fulfillments,public.supplier_fulfillment_events to service_role;
create index supplier_fulfillment_events_order_idx on public.supplier_fulfillment_events(order_id,created_at);

create function public.initialize_secplan_fulfillment() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.supplier_fulfillments(order_id,status) values(new.id,case when new.shipped_at is null then 'pending' else 'legacy' end) on conflict do nothing;
 return new;
end $$;
revoke all on function public.initialize_secplan_fulfillment() from public,anon,authenticated,service_role;
create trigger initialize_secplan_fulfillment after insert on public.orders for each row execute function public.initialize_secplan_fulfillment();
insert into public.supplier_fulfillments(order_id,status)
 select id,case when shipped_at is null then 'pending' else 'legacy' end from public.orders on conflict do nothing;

create function public.record_secplan_progress(
 p_session_id text,p_action text,p_reference text default null,
 p_stock_confirmed boolean default false,p_stock_evidence text default null,
 p_complete boolean default false,p_dispatched_at timestamptz default null,
 p_carrier text default null,p_tracking text default null
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders%rowtype; s public.supplier_fulfillments%rowtype; ref text:=btrim(coalesce(p_reference,''));
begin
 select * into o from public.orders where stripe_session_id=p_session_id for update;
 if not found then raise exception 'Bestellung nicht gefunden'; end if;
 if o.status<>'paid' or o.shipping_country is distinct from 'DE' then raise exception 'Bezahlte deutsche Bestellung erforderlich'; end if;
 insert into public.supplier_fulfillments(order_id) values(o.id) on conflict do nothing;
 select * into s from public.supplier_fulfillments where order_id=o.id for update;
 if length(ref)<3 or length(ref)>240 or ref~'[[:cntrl:]]' then raise exception 'Nachvollziehbare Referenz mit 3 bis 240 Zeichen erforderlich'; end if;
 if p_action='submitted' then
   if s.status='submitted' and s.submission_reference=ref then return to_jsonb(s); end if;
   if s.status<>'pending' then raise exception 'Unzulässiger Statuswechsel'; end if;
   if p_stock_confirmed is distinct from true or length(btrim(coalesce(p_stock_evidence,'')))<3 or length(p_stock_evidence)>240 then raise exception 'SECPLAN-Verfügbarkeit mit Beleg bestätigen'; end if;
   if coalesce(btrim(o.shipping_name),'')='' or coalesce(btrim(o.shipping_address->>'line1'),'')='' or coalesce(btrim(o.shipping_address->>'city'),'')='' or coalesce(o.shipping_address->>'postal_code','')!~'^[0-9]{5}$' or (o.shipping_address->>'country') is distinct from 'DE' then raise exception 'Lieferempfänger und vollständige deutsche Lieferadresse erforderlich'; end if;
   update public.supplier_fulfillments set status='submitted',submission_reference=ref,stock_evidence=btrim(p_stock_evidence),stock_checked_at=now(),submitted_at=now(),updated_at=now() where order_id=o.id returning * into s;
 elsif p_action='confirmed' then
   if s.status='confirmed' and s.supplier_reference=ref then return to_jsonb(s); end if;
   if s.status<>'submitted' then raise exception 'Zuerst tatsächliche Auftragsübermittlung dokumentieren'; end if;
   update public.supplier_fulfillments set status='confirmed',supplier_reference=ref,confirmed_at=now(),updated_at=now() where order_id=o.id returning * into s;
 elsif p_action='shipped' then
   if s.status='shipped' and s.dispatch_evidence=ref and s.dispatched_at=p_dispatched_at then return to_jsonb(s); end if;
   if s.status<>'confirmed' then raise exception 'Zuerst SECPLAN-Auftragsbestätigung dokumentieren'; end if;
   if p_complete is distinct from true then raise exception 'Vollständiger Versand aller Artikel muss bestätigt sein; keine Teillieferung als komplett markieren'; end if;
   if p_dispatched_at is null or p_dispatched_at>now()+interval '5 minutes' or p_dispatched_at<o.created_at then raise exception 'Tatsächliches Versanddatum nach Bestelleingang erforderlich'; end if;
   if length(coalesce(p_carrier,''))>80 or length(coalesce(p_tracking,''))>160 then raise exception 'Transporteur oder Sendungsnummer zu lang'; end if;
   if nullif(btrim(coalesce(p_tracking,'')),'') is not null and nullif(btrim(coalesce(p_carrier,'')),'') is null then raise exception 'Transporteur zur Sendungsnummer angeben'; end if;
   update public.supplier_fulfillments set status='shipped',dispatch_evidence=ref,dispatched_at=p_dispatched_at,carrier=nullif(btrim(p_carrier),''),tracking_number=nullif(btrim(p_tracking),''),updated_at=now() where order_id=o.id returning * into s;
   update public.orders set shipped_at=p_dispatched_at,fulfillment_status='shipped',updated_at=now() where id=o.id;
 else raise exception 'Unbekannte Lieferantenaktion'; end if;
 insert into public.supplier_fulfillment_events(order_id,action,reference) values(o.id,p_action,ref);
 return to_jsonb(s);
end $$;
revoke all on function public.record_secplan_progress(text,text,text,boolean,text,boolean,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.record_secplan_progress(text,text,text,boolean,text,boolean,timestamptz,text,text) to service_role;

-- The previous one-click shipment path can no longer invent a supplier shipment.
create or replace function public.mark_order_shipped(p_session_id text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.orders%rowtype; s public.supplier_fulfillments%rowtype;
begin
 select * into o from public.orders where stripe_session_id=p_session_id for update;
 if not found or o.status<>'paid' then raise exception 'Bezahlte Bestellung erforderlich'; end if;
 select * into s from public.supplier_fulfillments where order_id=o.id;
 if not found or s.status not in ('shipped','legacy') or o.shipped_at is null then raise exception 'Zuerst den tatsächlichen SECPLAN-Versand mit Beleg bestätigen'; end if;
 return jsonb_build_object('shipped_at',o.shipped_at,'invoice_ready',(o.amount_tax is not null and o.amount_tax>0 and o.shipping_country='DE'));
end $$;
revoke all on function public.mark_order_shipped(text) from public,anon,authenticated;
grant execute on function public.mark_order_shipped(text) to service_role;
