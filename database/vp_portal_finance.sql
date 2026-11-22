-- Accounting proposal only until settlement_open is explicitly approved. Never initiates bank transfers.
create table public.vp_earnings(
 id uuid primary key default gen_random_uuid(),order_id bigint unique not null references public.orders(id),
 earner_id uuid not null references public.vp_accounts(user_id),payee_id uuid not null references public.vp_accounts(user_id),
 order_reference text not null,order_at timestamptz not null,period date not null,
 original_net_cents integer not null check(original_net_cents>=0),remaining_net_cents integer not null check(remaining_net_cents>=0),
 rate_bps integer not null check(rate_bps in (1500,2000)),earner_rate_bps integer not null check(earner_rate_bps in (1500,2000)),
 status text not null default 'pending' check(status in ('pending','eligible','cancelled','hold')),
 verified_at timestamptz,verification_reference text,booked_commission_cents integer not null default 0,
 booked_earner_cents integer not null default 0,booked_net_cents integer not null default 0,version integer not null default 0,
 closed boolean not null default false,created_at timestamptz not null default now(),
 check(remaining_net_cents<=original_net_cents),check(earner_rate_bps<=rate_bps)
);
create table public.vp_reserves(earner_id uuid primary key references public.vp_accounts(user_id),balance_cents integer not null default 0 check(balance_cents between 0 and 250000),last_order_at timestamptz not null,updated_at timestamptz not null default now());
create table public.vp_statements(id uuid primary key default gen_random_uuid(),payee_id uuid not null references public.vp_accounts(user_id),period date not null,due_date date not null,status text not null default 'approved' check(status in ('approved','paid')),commission_cents integer not null default 0,reserve_delta_cents integer not null default 0,payable_cents integer not null default 0,created_at timestamptz not null default now(),payment_reference text,paid_at timestamptz,unique(payee_id,period));
create table public.vp_finance_lines(id bigint generated always as identity primary key,statement_id uuid references public.vp_statements(id),earning_id uuid not null references public.vp_earnings(id),earner_id uuid not null references public.vp_accounts(user_id),payee_id uuid not null references public.vp_accounts(user_id),period date not null,kind text not null check(kind in ('commission','correction')),source_version integer not null,net_cents integer not null,commission_cents integer not null,earner_commission_cents integer not null,reserve_delta_cents integer not null,payable_cents integer not null,created_at timestamptz not null default now(),unique(earning_id,source_version));
create table public.vp_reserve_releases(id uuid primary key default gen_random_uuid(),earner_id uuid not null references public.vp_accounts(user_id),payee_id uuid not null references public.vp_accounts(user_id),amount_cents integer not null check(amount_cents>0),last_order_snapshot timestamptz not null,status text not null default 'review' check(status in ('review','paid','cancelled')),created_at timestamptz not null default now(),payment_reference text,paid_at timestamptz);
create unique index vp_one_reserve_release on public.vp_reserve_releases(earner_id) where status='review';
create function public.vp_capture_earning() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
 declare a public.vp_accounts%rowtype;payee uuid;rate integer;net integer;
 begin
 if new.test_mode or new.status<>'paid' or new.vp_id is null or new.currency<>'eur' then return new;end if;
 select * into a from public.vp_accounts where referral_code=new.vp_id and status='active';if not found then return new;end if;
 if new.amount_tax is null or new.amount_tax<=0 or new.shipping_amount is null then return new;end if;
 -- Current DE catalog is 19% inclusive. Do not infer a future tax/installation commission basis.
 if abs(round(new.amount_total*19.0/119)::integer-new.amount_tax)>4 then return new;end if;
 net=round((new.amount_total-new.shipping_amount)/1.19)::integer;
 payee=coalesce(a.agency_id,a.user_id);rate=case when a.agency_id is not null or a.role='agency' then 2000 else 1500 end;
 insert into public.vp_earnings(order_id,earner_id,payee_id,order_reference,order_at,period,original_net_cents,remaining_net_cents,rate_bps,earner_rate_bps)
 values(new.id,a.user_id,payee,'SN-B-'||new.id,new.created_at,date_trunc('month',new.created_at at time zone 'Europe/Berlin')::date,net,net,rate,case when a.agency_id is not null then 1500 else rate end) on conflict(order_id) do nothing;
 insert into public.vp_reserves(earner_id,last_order_at) values(a.user_id,new.created_at) on conflict(earner_id) do update set last_order_at=greatest(public.vp_reserves.last_order_at,excluded.last_order_at);
 return new;end$$;
create trigger vp_order_earning after insert or update on public.orders for each row execute function public.vp_capture_earning();
create function public.vp_reconcile_earning(p_id uuid,p_status text,p_remaining integer,p_reference text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare e public.vp_earnings%rowtype;r public.vp_reserves%rowtype;target integer;earned integer;delta integer;edelta integer;rd integer;period date;
 begin
 perform public.vp_require_admin();select * into e from public.vp_earnings where id=p_id for update;if not found then raise exception 'Provisionsquelle nicht gefunden';end if;
 if p_status not in ('eligible','cancelled','hold') or p_remaining<0 or p_remaining>e.remaining_net_cents or length(btrim(p_reference))<10 or (p_status='cancelled' and p_remaining<>0) then raise exception 'Abgleich, Restnettobetrag und Storno-/Zahlungsnachweis prüfen';end if;
 if e.closed and p_status='hold' then raise exception 'Abgerechnete Provision nur mit belegter Betragskorrektur ändern';end if;
 if e.closed and p_remaining<e.remaining_net_cents then
 if not (select settlement_open from public.vp_settings where id) then raise exception 'Abrechnung noch nicht rechtlich freigegeben';end if;
 select * into r from public.vp_reserves where earner_id=e.earner_id for update;
 target=round(p_remaining*e.rate_bps/10000.0)::integer;earned=round(p_remaining*e.earner_rate_bps/10000.0)::integer;
 delta=target-e.booked_commission_cents;edelta=earned-e.booked_earner_cents;
 rd=-least(r.balance_cents,round(abs(edelta)*0.05)::integer);
 period=date_trunc('month',now() at time zone 'Europe/Berlin')::date;
 insert into public.vp_finance_lines(earning_id,earner_id,payee_id,period,kind,source_version,net_cents,commission_cents,earner_commission_cents,reserve_delta_cents,payable_cents) values(e.id,e.earner_id,e.payee_id,period,'correction',e.version+1,p_remaining-e.booked_net_cents,delta,edelta,rd,delta-rd);
 update public.vp_reserves set balance_cents=balance_cents+rd,updated_at=now() where earner_id=e.earner_id;
 update public.vp_earnings set booked_commission_cents=target,booked_earner_cents=earned,booked_net_cents=p_remaining,version=version+1 where id=e.id;
 end if;
 update public.vp_earnings set status=p_status,remaining_net_cents=p_remaining,verified_at=now(),verification_reference=left(p_reference,1000) where id=e.id;
 insert into public.vp_audit(actor,event,target,details) values(auth.uid(),'earning_reconciled',e.id::text,jsonb_build_object('state',p_status,'remaining_net_cents',p_remaining,'reference',left(p_reference,1000)));
 end$$;
create function public.vp_close_month(p_month date,p_reason text) returns integer language plpgsql security definer set search_path=public,pg_temp as $$
 declare e public.vp_earnings%rowtype;r public.vp_reserves%rowtype;total integer;earned integer;held integer;sid uuid;payee uuid;n integer:=0;due date;
 begin
 perform public.vp_require_admin();if not (select settlement_open from public.vp_settings where id) then raise exception 'Abrechnung noch nicht freigegeben; Vertragsprüfung einschließlich Reserve erforderlich';end if;
 if p_month<>date_trunc('month',p_month)::date or length(p_reason)<10 then raise exception 'Vollständigen Kalendermonat und Freigabevermerk angeben';end if;
 due=(p_month+interval '2 months'-interval '1 day')::date;
 if (now() at time zone 'Europe/Berlin')::date<due then raise exception 'Monatsabschluss ist erst zum Ende des Folgemonats freigegeben';end if;
 perform pg_advisory_xact_lock(472092);
 if exists(select 1 from public.vp_earnings where period=p_month and not closed and status in ('pending','hold')) then raise exception 'Offene Provisionsquellen zuerst mit Zahlungs-/Stornonachweis prüfen';end if;
 for e in select * from public.vp_earnings where period=p_month and not closed order by order_at,id for update loop
 if e.status='eligible' then
 select * into r from public.vp_reserves where earner_id=e.earner_id for update;
 total=round(e.remaining_net_cents*e.rate_bps/10000.0)::integer;earned=round(e.remaining_net_cents*e.earner_rate_bps/10000.0)::integer;
 held=least(round(earned*0.05)::integer,250000-r.balance_cents);
 insert into public.vp_finance_lines(earning_id,earner_id,payee_id,period,kind,source_version,net_cents,commission_cents,earner_commission_cents,reserve_delta_cents,payable_cents) values(e.id,e.earner_id,e.payee_id,p_month,'commission',e.version+1,e.remaining_net_cents,total,earned,held,total-held);
 update public.vp_reserves set balance_cents=balance_cents+held,updated_at=now() where earner_id=e.earner_id;
 update public.vp_earnings set booked_net_cents=remaining_net_cents,booked_commission_cents=total,booked_earner_cents=earned,version=version+1 where id=e.id;
 end if;
 update public.vp_earnings set closed=true where id=e.id;
 end loop;
 for payee in select distinct payee_id from public.vp_finance_lines where period=p_month and statement_id is null loop
 if exists(select 1 from public.vp_statements where payee_id=payee and period=p_month) then raise exception 'Monat bereits abgeschlossen; Nachbuchungen benötigen gesonderte Prüfung';end if;
 insert into public.vp_statements(payee_id,period,due_date,commission_cents,reserve_delta_cents,payable_cents)
 select payee,p_month,due,sum(commission_cents),sum(reserve_delta_cents),sum(payable_cents) from public.vp_finance_lines where payee_id=payee and period=p_month and statement_id is null returning id into sid;
 update public.vp_finance_lines set statement_id=sid where payee_id=payee and period=p_month and statement_id is null;n=n+1;
 end loop;
 insert into public.vp_audit(actor,event,details) values(auth.uid(),'month_closed',jsonb_build_object('month',p_month,'statements',n,'reason',p_reason));return n;
 end$$;
create function public.vp_statement_paid(p_id uuid,p_reference text) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_admin();if length(p_reference)<10 then raise exception 'Beleg der tatsächlich ausgeführten Auszahlung erforderlich';end if;
 update public.vp_statements set status='paid',paid_at=now(),payment_reference=left(p_reference,500) where id=p_id and status='approved';if not found then raise exception 'Abrechnung nicht verfügbar oder bereits verbucht';end if;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'payout_recorded',p_id::text);end$$;
create function public.vp_reserve_release(p_earner uuid,p_payment_reference text default null) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare r public.vp_reserves%rowtype;a public.vp_accounts%rowtype;i uuid;begin
 perform public.vp_require_admin();if not (select settlement_open from public.vp_settings where id) then raise exception 'Abrechnung nicht freigegeben';end if;
 select * into r from public.vp_reserves where earner_id=p_earner for update;select * into a from public.vp_accounts where user_id=p_earner;
 if r.balance_cents<=0 or r.last_order_at+interval '12 months'>now() then raise exception 'Reserve ist noch nicht fällig oder bereits leer';end if;
 if exists(select 1 from public.vp_earnings where earner_id=p_earner and (not closed or status='hold')) then raise exception 'Offene Aufträge/Korrekturen zuerst prüfen';end if;
 select id into i from public.vp_reserve_releases where earner_id=p_earner and status='review';
 if i is null then insert into public.vp_reserve_releases(earner_id,payee_id,amount_cents,last_order_snapshot) values(p_earner,coalesce(a.agency_id,a.user_id),r.balance_cents,r.last_order_at) returning id into i;end if;
 if p_payment_reference is not null then
 if length(p_payment_reference)<10 or not exists(select 1 from public.vp_reserve_releases where id=i and last_order_snapshot=r.last_order_at and amount_cents=r.balance_cents) then raise exception 'Auszahlungsbeleg oder erneute Fälligkeitsprüfung erforderlich';end if;
 update public.vp_reserve_releases set status='paid',payment_reference=left(p_payment_reference,500),paid_at=now() where id=i;
 update public.vp_reserves set balance_cents=0,updated_at=now() where earner_id=p_earner;
 end if;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'reserve_release_review',i::text);return i;end$$;
alter table public.vp_earnings enable row level security;alter table public.vp_reserves enable row level security;alter table public.vp_statements enable row level security;alter table public.vp_finance_lines enable row level security;alter table public.vp_reserve_releases enable row level security;
revoke all on public.vp_earnings,public.vp_reserves,public.vp_statements,public.vp_finance_lines,public.vp_reserve_releases from public,anon,authenticated;
grant select on public.vp_earnings,public.vp_reserves,public.vp_statements,public.vp_finance_lines,public.vp_reserve_releases to authenticated;
create policy vp_earnings_read on public.vp_earnings for select to authenticated using(public.vp_is_admin() or (public.vp_is_active() and auth.uid() in (earner_id,payee_id)));
create policy vp_reserves_read on public.vp_reserves for select to authenticated using(public.vp_is_admin() or (public.vp_is_active() and (earner_id=auth.uid() or exists(select 1 from public.vp_earnings e where e.earner_id=vp_reserves.earner_id and e.payee_id=auth.uid()))));
create policy vp_statements_read on public.vp_statements for select to authenticated using(public.vp_is_admin() or (public.vp_is_active() and payee_id=auth.uid()));
create policy vp_finance_lines_read on public.vp_finance_lines for select to authenticated using(public.vp_is_admin() or (public.vp_is_active() and auth.uid() in (earner_id,payee_id)));
create policy vp_reserve_releases_read on public.vp_reserve_releases for select to authenticated using(public.vp_is_admin() or (public.vp_is_active() and auth.uid() in (earner_id,payee_id)));
revoke all on function public.vp_capture_earning(),public.vp_reconcile_earning(uuid,text,integer,text),public.vp_close_month(date,text),public.vp_statement_paid(uuid,text),public.vp_reserve_release(uuid,text) from public,anon,authenticated;
grant execute on function public.vp_reconcile_earning(uuid,text,integer,text),public.vp_close_month(date,text),public.vp_statement_paid(uuid,text),public.vp_reserve_release(uuid,text) to authenticated;
