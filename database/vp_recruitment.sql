-- Direct partner recruitment only; no agency or multi-level bonus.
create table vp_private.recruitment_links(
 sponsor_id uuid primary key references public.vp_accounts(user_id),
 token text unique not null default ('vp_'||encode(extensions.gen_random_bytes(32),'hex')),
 created_at timestamptz not null default now()
);
create table vp_private.recruits(
 user_id uuid primary key references public.vp_accounts(user_id),
 sponsor_id uuid not null references public.vp_accounts(user_id),
 created_at timestamptz not null default now(),check(user_id<>sponsor_id)
);
create index recruits_sponsor on vp_private.recruits(sponsor_id);
alter table vp_private.recruitment_links enable row level security;
alter table vp_private.recruits enable row level security;
revoke all on vp_private.recruitment_links,vp_private.recruits from public,anon,authenticated;

create function public.vp_recruitment_link() returns text language plpgsql security definer set search_path='' as $$
declare a public.vp_accounts%rowtype;t text;
begin
 select * into a from public.vp_accounts where user_id=auth.uid() for update;
 if not found or a.status<>'active' or a.role not in ('vp','admin') or a.agency_id is not null then
 raise exception 'Nur aktive, agenturunabhängige Partner können VP werben' using errcode='42501';end if;
 insert into vp_private.recruitment_links(sponsor_id) values(a.user_id) on conflict do nothing;
 select token into t from vp_private.recruitment_links where sponsor_id=a.user_id;return t;
end$$;
revoke all on function public.vp_recruitment_link() from public,anon;
grant execute on function public.vp_recruitment_link() to authenticated;

-- Preserve the entire existing application validation and agency workflow privately.
alter function public.vp_submit_application(jsonb,uuid,text) set schema vp_private;
revoke all on function vp_private.vp_submit_application(jsonb,uuid,text) from public,anon,authenticated;
create function public.vp_submit_application(p_profile jsonb,p_terms_id uuid,p_invite_token text default null) returns void language plpgsql security definer set search_path='' as $$
declare a public.vp_accounts%rowtype;s public.vp_accounts%rowtype;existing uuid;
begin
 select * into a from public.vp_accounts where user_id=auth.uid() for update;
 if not found then raise exception 'Anmeldung erforderlich' using errcode='42501';end if;
 select sponsor_id into existing from vp_private.recruits where user_id=a.user_id;
 if left(coalesce(p_invite_token,''),3)='vp_' then
 select p.* into s from vp_private.recruitment_links l join public.vp_accounts p on p.user_id=l.sponsor_id where l.token=p_invite_token for update of p;
 if not found or s.status<>'active' or s.role not in ('vp','admin') or s.agency_id is not null or s.user_id=a.user_id then raise exception 'VP-Einladung ungültig oder Werber nicht berechtigt';end if;
 if a.role<>'vp' or a.agency_id is not null or (existing is not null and existing<>s.user_id) or (existing is null and a.submitted_at is not null) then raise exception 'Werberzuordnung nur beim ersten unabhängigen Partnerantrag möglich';end if;
 perform vp_private.vp_submit_application(p_profile,p_terms_id,null);
 insert into vp_private.recruits(user_id,sponsor_id) values(a.user_id,s.user_id) on conflict do nothing;
 if existing is null then insert into public.vp_audit(actor,event,target,details) values(a.user_id,'vp_recruited',a.user_id::text,jsonb_build_object('sponsor',s.user_id));end if;
 else
 if existing is not null and coalesce(p_invite_token,'')<>'' then raise exception 'Werberzuordnung bereits vorhanden; Agenturwechsel bitte über Administration klären';end if;
 perform vp_private.vp_submit_application(p_profile,p_terms_id,p_invite_token);
 end if;
end$$;
revoke all on function public.vp_submit_application(jsonb,uuid,text) from public,anon;
grant execute on function public.vp_submit_application(jsonb,uuid,text) to authenticated;

alter table public.vp_earnings add column earning_kind text not null default 'sale' check(earning_kind in ('sale','recruitment'));
alter table public.vp_earnings add column source_earning_id uuid unique references public.vp_earnings(id);
alter table public.vp_earnings drop constraint vp_earnings_order_id_key;
alter table public.vp_earnings add constraint vp_earnings_order_kind_key unique(order_id,earning_kind);
alter table public.vp_earnings drop constraint vp_earnings_rate_bps_check;
alter table public.vp_earnings drop constraint vp_earnings_earner_rate_bps_check;
alter table public.vp_earnings add constraint vp_earning_rates check(
 (earning_kind='sale' and source_earning_id is null and rate_bps in (1500,2000) and earner_rate_bps in (1500,2000)) or
 (earning_kind='recruitment' and source_earning_id is not null and rate_bps=200 and earner_rate_bps=200 and earner_id=payee_id));
do $$declare d text;begin
 d=pg_get_functiondef('public.vp_capture_earning()'::regprocedure);
 if position('on conflict(order_id)' in d)=0 then raise exception 'Unexpected earning implementation';end if;
 execute replace(d,'on conflict(order_id)','on conflict(order_id,earning_kind)');
end$$;

create function vp_private.capture_recruitment_bonus() returns trigger language plpgsql security definer set search_path='' as $$
declare s public.vp_accounts%rowtype;
begin
 if new.earning_kind<>'sale' then return new;end if;
 select sponsor.* into s from vp_private.recruits r
 join public.vp_accounts seller on seller.user_id=r.user_id
 join public.vp_accounts sponsor on sponsor.user_id=r.sponsor_id
 where r.user_id=new.earner_id and r.created_at<=new.order_at
 and seller.status='active' and seller.role='vp' and seller.agency_id is null
 and sponsor.status='active' and sponsor.role in ('vp','admin') and sponsor.agency_id is null
 and sponsor.sales_quiz_version='ajax-basics-v1' and sponsor.sales_passed_at<=new.order_at;
 if not found then return new;end if;
 insert into public.vp_earnings(order_id,earner_id,payee_id,order_reference,order_at,period,original_net_cents,remaining_net_cents,rate_bps,earner_rate_bps,earning_kind,source_earning_id)
 values(new.order_id,s.user_id,s.user_id,new.order_reference,new.order_at,new.period,new.original_net_cents,new.remaining_net_cents,200,200,'recruitment',new.id) on conflict do nothing;
 insert into public.vp_reserves(earner_id,last_order_at) values(s.user_id,new.order_at) on conflict(earner_id) do update set last_order_at=greatest(public.vp_reserves.last_order_at,excluded.last_order_at);
 return new;
end$$;
revoke all on function vp_private.capture_recruitment_bonus() from public,anon,authenticated;
create trigger vp_capture_recruitment after insert on public.vp_earnings for each row execute function vp_private.capture_recruitment_bonus();

-- Reconcile the source once; the bonus follows, including corrections after closing.
alter function public.vp_reconcile_earning(uuid,text,integer,text) set schema vp_private;
revoke all on function vp_private.vp_reconcile_earning(uuid,text,integer,text) from public,anon,authenticated;
create function public.vp_reconcile_earning(p_id uuid,p_status text,p_remaining integer,p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare e public.vp_earnings%rowtype;b uuid;
begin
 perform public.vp_require_admin();
 select * into e from public.vp_earnings where id=p_id for update;
 if not found then raise exception 'Provisionsquelle nicht gefunden';end if;
 if e.earning_kind='recruitment' then raise exception 'Werberbonus wird über die zugehörige Verkaufsprovision abgeglichen';end if;
 perform vp_private.vp_reconcile_earning(p_id,p_status,p_remaining,p_reference);
 select id into b from public.vp_earnings where source_earning_id=p_id;
 if b is not null then perform vp_private.vp_reconcile_earning(b,p_status,p_remaining,p_reference);end if;
end$$;
revoke all on function public.vp_reconcile_earning(uuid,text,integer,text) from public,anon;
grant execute on function public.vp_reconcile_earning(uuid,text,integer,text) to authenticated;

create function public.vp_recruitment_overview() returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.vp_accounts%rowtype;
begin
 select * into a from public.vp_accounts where user_id=auth.uid();
 if not found or a.status<>'active' or a.role not in ('vp','admin') or a.agency_id is not null then raise exception 'Kein Zugang zu VP werben' using errcode='42501';end if;
 return jsonb_build_object(
 'token',(select token from vp_private.recruitment_links where sponsor_id=a.user_id),
 'partners',coalesce((select jsonb_agg(jsonb_build_object('id',p.user_id,'name',p.full_name,'status',p.status,'joinedAt',r.created_at,'eligible',p.role='vp' and p.agency_id is null,'salesPassed',p.sales_passed_at is not null)) from vp_private.recruits r join public.vp_accounts p on p.user_id=r.user_id where r.sponsor_id=a.user_id),'[]'::jsonb),
 'bonuses',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'reference',e.order_reference,'netCents',e.remaining_net_cents,'bonusCents',round(e.remaining_net_cents*0.02),'status',e.status,'closed',e.closed)) from public.vp_earnings e where e.earner_id=a.user_id and e.earning_kind='recruitment'),'[]'::jsonb));
end$$;
revoke all on function public.vp_recruitment_overview() from public,anon;
grant execute on function public.vp_recruitment_overview() to authenticated;
do $$declare d text;begin
 d=pg_get_functiondef('public.vp_own_finance()'::regprocedure);
 execute replace(d,'select id,earner_id,order_reference','select id,earner_id,earning_kind,order_reference');
end$$;
notify pgrst,'reload schema';
