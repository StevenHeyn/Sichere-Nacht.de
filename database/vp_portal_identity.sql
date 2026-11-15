-- Additive, isolated partner namespace in public. Existing shop tables/roles are unchanged.
create table public.vp_settings(
 id boolean primary key default true check(id),registration_open boolean not null default false,
 d2d_open boolean not null default false,settlement_open boolean not null default false,
 claim_days integer not null default 7 check(claim_days between 1 and 60),
 cooldown_days integer not null default 14 check(cooldown_days between 1 and 365),
 updated_at timestamptz not null default now()
);
insert into public.vp_settings(id) values(true);
create table public.vp_terms(
 id uuid primary key default gen_random_uuid(),version text unique not null,title text not null,body text not null,
 status text not null default 'draft' check(status in ('draft','published','retired')),
 content_hash text not null,review_reference text,created_at timestamptz not null default now(),published_at timestamptz
);
create unique index vp_one_published_terms on public.vp_terms((status)) where status='published';
create table public.vp_accounts(
 user_id uuid primary key references auth.users(id),referral_code text unique not null default ('VP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 role text not null default 'vp' check(role in ('vp','agency','admin')),
 status text not null default 'onboarding' check(status in ('onboarding','pending','active','suspended','rejected')),
 agency_id uuid references public.vp_accounts(user_id),full_name text not null default '',company text not null default '',
 street text not null default '',postal_code text not null default '',city text not null default '',country text not null default 'DE',
 email text not null,phone text not null default '',clothing_size text not null default '',
 installer_requested_at timestamptz,installer_approved_at timestamptz,
 created_at timestamptz not null default now(),submitted_at timestamptz,approved_at timestamptz,
 check(agency_id is distinct from user_id),check(referral_code~'^VP-[A-Z0-9]{3,16}$')
);
create table public.vp_documents(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.vp_accounts(user_id),
 kind text not null check(kind in ('portrait','trade_proof')),path text unique not null,
 mime text not null check(mime in ('image/jpeg','image/png','image/webp','application/pdf')),
 bytes integer not null check(bytes between 1 and 8388608),created_at timestamptz not null default now()
);
create table public.vp_term_acceptances(
 user_id uuid not null references public.vp_accounts(user_id),terms_id uuid not null references public.vp_terms(id),
 content_hash text not null,accepted_at timestamptz not null default now(),primary key(user_id,terms_id)
);
create table public.vp_invitations(
 id uuid primary key default gen_random_uuid(),agency_id uuid not null references public.vp_accounts(user_id),
 full_name text not null,email text not null,token_hash text not null unique,
 expires_at timestamptz not null default now()+interval '14 days',accepted_by uuid references public.vp_accounts(user_id),
 created_at timestamptz not null default now()
);
create table public.vp_audit(
 id bigint generated always as identity primary key,actor uuid,event text not null,target text,details jsonb not null default '{}',created_at timestamptz not null default now()
);
create or replace function public.vp_is_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.vp_accounts where user_id=auth.uid() and role='admin' and status='active') $$;
create or replace function public.vp_is_active() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.vp_accounts where user_id=auth.uid() and status='active') $$;
create or replace function public.vp_require_active() returns void language plpgsql security definer set search_path=public,pg_temp as $$
 begin if not public.vp_is_active() then raise exception 'Partnerzugang noch nicht freigegeben' using errcode='42501'; end if; end $$;
create or replace function public.vp_require_admin() returns void language plpgsql security definer set search_path=public,pg_temp as $$
 begin if not public.vp_is_admin() then raise exception 'Adminzugang erforderlich' using errcode='42501'; end if; end $$;
create function public.vp_ensure_account() returns public.vp_accounts language plpgsql security definer set search_path=public,pg_temp as $$
 declare u auth.users%rowtype;r public.vp_accounts%rowtype;
 begin
 select * into u from auth.users where id=auth.uid();
 if not found or u.email_confirmed_at is null then raise exception 'Bestätigte E-Mail-Anmeldung erforderlich' using errcode='42501';end if;
 insert into public.vp_accounts(user_id,email) values(u.id,u.email) on conflict(user_id) do nothing;
 select * into r from public.vp_accounts where user_id=u.id;return r;
 end $$;
create function public.vp_register_document(p_kind text,p_path text,p_mime text,p_bytes integer) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
 declare r public.vp_accounts%rowtype;i uuid;
 begin
 select * into r from public.vp_accounts where user_id=auth.uid();
 if not found or r.status not in ('onboarding','pending') then raise exception 'Dokumentänderung derzeit nicht erlaubt';end if;
 if p_path not like auth.uid()::text||'/'||p_kind||'/%' or not exists(select 1 from storage.objects where bucket_id='vp-private' and name=p_path) then raise exception 'Geschützte Datei nicht gefunden';end if;
 if (select count(*) from public.vp_documents where user_id=auth.uid())>=12 then raise exception 'Dokumentlimit erreicht; bitte Administration kontaktieren';end if;
 if p_kind='portrait' and p_mime='application/pdf' then raise exception 'Portrait muss ein Bild sein';end if;
 insert into public.vp_documents(user_id,kind,path,mime,bytes) values(auth.uid(),p_kind,p_path,p_mime,p_bytes) returning id into i;return i;
 end $$;
create function public.vp_submit_application(p_profile jsonb,p_terms_id uuid,p_invite_token text default null) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare r public.vp_accounts%rowtype;t public.vp_terms%rowtype;inv public.vp_invitations%rowtype;k text;
 begin
 select * into r from public.vp_accounts where user_id=auth.uid() for update;
 if not found or r.status not in ('onboarding','pending') then raise exception 'Antrag kann derzeit nicht geändert werden';end if;
 if not (select registration_open from public.vp_settings where id) then raise exception 'Registrierung noch nicht freigegeben';end if;
 select * into t from public.vp_terms where id=p_terms_id and status='published';if not found then raise exception 'Freigegebene VP-Vertragsfassung erforderlich';end if;
 foreach k in array array['full_name','street','postal_code','city','phone','clothing_size'] loop
 if length(btrim(coalesce(p_profile->>k,'')))<2 or length(p_profile->>k)>200 then raise exception 'Pflichtfeld % unvollständig',k;end if;end loop;
 if coalesce(p_profile->>'country','DE')<>'DE' or (p_profile->>'postal_code')!~'^[0-9]{5}$' then raise exception 'Gültige deutsche Geschäftsadresse erforderlich';end if;
 if (select count(distinct kind) from public.vp_documents where user_id=auth.uid())<>2 then raise exception 'Portrait und Gewerbenachweis fehlen';end if;
 if p_invite_token is not null and length(p_invite_token)>0 then
 select * into inv from public.vp_invitations where token_hash=encode(extensions.digest(p_invite_token,'sha256'),'hex') for update;
 if not found or inv.expires_at<=now() or inv.accepted_by is not null or lower(inv.email)<>lower(r.email) then raise exception 'Einladung ungültig oder nicht für diese E-Mail-Adresse';end if;
 if not exists(select 1 from public.vp_accounts where user_id=inv.agency_id and role='agency' and status='active') then raise exception 'Agentur nicht aktiv';end if;
 if r.agency_id is not null and r.agency_id<>inv.agency_id then raise exception 'Agenturzuordnung bereits vorhanden';end if;
 update public.vp_invitations set accepted_by=auth.uid() where id=inv.id;
 end if;
 update public.vp_accounts set full_name=btrim(p_profile->>'full_name'),company=left(btrim(coalesce(p_profile->>'company','')),200),street=btrim(p_profile->>'street'),postal_code=p_profile->>'postal_code',city=btrim(p_profile->>'city'),phone=btrim(p_profile->>'phone'),clothing_size=btrim(p_profile->>'clothing_size'),country='DE',agency_id=coalesce(inv.agency_id,agency_id),status='pending',submitted_at=now() where user_id=auth.uid();
 insert into public.vp_term_acceptances(user_id,terms_id,content_hash) values(auth.uid(),t.id,t.content_hash) on conflict do nothing;
 insert into public.vp_audit(actor,event,target,details) values(auth.uid(),'application_submitted',auth.uid()::text,jsonb_build_object('terms_version',t.version));
 end $$;
create function public.vp_invite(p_name text,p_email text) returns text language plpgsql security definer set search_path=public,pg_temp as $$
 declare token text;me public.vp_accounts%rowtype;
 begin
 select * into me from public.vp_accounts where user_id=auth.uid();
 if not found or me.status<>'active' or me.role<>'agency' then raise exception 'Nur freigeschaltete Agenturen können VP einladen' using errcode='42501';end if;
 if length(btrim(p_name))<2 or length(p_name)>160 or p_email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(p_email)>200 then raise exception 'Name und E-Mail prüfen';end if;
 if (select count(*) from public.vp_invitations where agency_id=me.user_id and created_at>now()-interval '1 day')>=30 then raise exception 'Tageslimit erreicht';end if;
 token=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.vp_invitations(agency_id,full_name,email,token_hash) values(me.user_id,btrim(p_name),lower(btrim(p_email)),encode(extensions.digest(token,'sha256'),'hex'));
 return token;
 end $$;
create function public.vp_roster() returns table(user_id uuid,full_name text,status text,referral_code text,created_at timestamptz) language sql stable security definer set search_path=public,pg_temp as $$
 select a.user_id,a.full_name,a.status,a.referral_code,a.created_at from public.vp_accounts a
 where public.vp_is_admin() or (a.agency_id=auth.uid() and exists(select 1 from public.vp_accounts me where me.user_id=auth.uid() and me.role='agency' and me.status='active')) $$;
create function public.vp_admin_account(p_user uuid,p_action text,p_reason text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare a public.vp_accounts%rowtype;
 begin
 perform public.vp_require_admin();if length(btrim(p_reason))<5 then raise exception 'Begründung erforderlich';end if;
 select * into a from public.vp_accounts where user_id=p_user for update;if not found then raise exception 'Partner nicht gefunden';end if;
 if a.role='admin' then raise exception 'Administratoren werden gesondert verwaltet';end if;
 if p_action='approve' then
 if a.status<>'pending' or (select count(distinct kind) from public.vp_documents where user_id=p_user)<>2 or not exists(select 1 from public.vp_term_acceptances where user_id=p_user) then raise exception 'Vollständiger Antrag mit Vertragsannahme erforderlich';end if;
 update public.vp_accounts set status='active',approved_at=now() where user_id=p_user;
 elsif p_action='agency' then
 if a.status<>'active' or a.agency_id is not null then raise exception 'Nur unabhängige aktive VP können Agentur werden';end if;
 update public.vp_accounts set role='agency' where user_id=p_user;
 elsif p_action='suspend' then update public.vp_accounts set status='suspended' where user_id=p_user;
 elsif p_action='reject' then update public.vp_accounts set status='rejected' where user_id=p_user;
 else raise exception 'Unbekannte Aktion';end if;
 insert into public.vp_audit(actor,event,target,details) values(auth.uid(),'account_'||p_action,p_user::text,jsonb_build_object('reason',left(p_reason,500)));
 end $$;
create function public.vp_publish_terms(p_version text,p_title text,p_body text,p_review text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
 declare i uuid;
 begin perform public.vp_require_admin();
 if length(p_version)<3 or length(p_title)<5 or length(p_body)<500 or length(p_body)>100000 or length(p_review)<8 then raise exception 'Vollständige geprüfte Vertragsfassung und Prüfvermerk erforderlich';end if;
 update public.vp_terms set status='retired' where status='published';
 insert into public.vp_terms(version,title,body,status,content_hash,review_reference,published_at) values(p_version,p_title,p_body,'published',encode(extensions.digest(p_body,'sha256'),'hex'),p_review,now()) returning id into i;
 insert into public.vp_audit(actor,event,target,details) values(auth.uid(),'terms_published',i::text,jsonb_build_object('version',p_version,'review',p_review));return i;end $$;
create function public.vp_admin_settings(p_registration boolean,p_d2d boolean,p_settlement boolean,p_reason text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 begin perform public.vp_require_admin();if length(p_reason)<10 then raise exception 'Freigabevermerk erforderlich';end if;
 if (p_registration or p_d2d or p_settlement) and not exists(select 1 from public.vp_terms where status='published') then raise exception 'Vertragsfassung zuerst veröffentlichen';end if;
 update public.vp_settings set registration_open=p_registration,d2d_open=p_d2d,settlement_open=p_settlement,updated_at=now();
 insert into public.vp_audit(actor,event,details) values(auth.uid(),'release_settings',jsonb_build_object('registration',p_registration,'d2d',p_d2d,'settlement',p_settlement,'reason',p_reason));end $$;
create function public.vp_bootstrap_admin(p_email text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
 declare u auth.users%rowtype;
 begin
 if auth.role()<>'service_role' then raise exception 'Interne Administration erforderlich' using errcode='42501';end if;
 select * into u from auth.users where lower(email)=lower(btrim(p_email)) and email_confirmed_at is not null;
 if not found then raise exception 'Bitte zuerst ein Konto mit bestätigter E-Mail erstellen';end if;
 insert into public.vp_accounts(user_id,email,role,status) values(u.id,u.email,'admin','active') on conflict(user_id) do update set role='admin',status='active';
 insert into public.vp_audit(event,target) values('bootstrap_admin',u.id::text);return u.id;end $$;
-- Explicit read policies, never general client UPDATE of roles/statuses.
alter table public.vp_settings enable row level security;alter table public.vp_terms enable row level security;
alter table public.vp_accounts enable row level security;alter table public.vp_documents enable row level security;
alter table public.vp_term_acceptances enable row level security;alter table public.vp_invitations enable row level security;alter table public.vp_audit enable row level security;
revoke all on public.vp_settings,public.vp_terms,public.vp_accounts,public.vp_documents,public.vp_term_acceptances,public.vp_invitations,public.vp_audit from public,anon,authenticated;
grant select on public.vp_settings,public.vp_terms to anon,authenticated;
grant select on public.vp_accounts,public.vp_documents,public.vp_term_acceptances,public.vp_invitations,public.vp_audit to authenticated;
create policy vp_settings_read on public.vp_settings for select using(true);
create policy vp_terms_read on public.vp_terms for select using(status='published' or public.vp_is_admin());
create policy vp_accounts_read on public.vp_accounts for select to authenticated using(user_id=auth.uid() or public.vp_is_admin());
create policy vp_documents_read on public.vp_documents for select to authenticated using(user_id=auth.uid() or public.vp_is_admin());
create policy vp_acceptance_read on public.vp_term_acceptances for select to authenticated using(user_id=auth.uid() or public.vp_is_admin());
create policy vp_invites_read on public.vp_invitations for select to authenticated using((agency_id=auth.uid() and public.vp_is_active()) or public.vp_is_admin());
create policy vp_audit_read on public.vp_audit for select to authenticated using(public.vp_is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('vp-private','vp-private',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy vp_file_select on storage.objects for select to authenticated using(bucket_id='vp-private' and ((storage.foldername(name))[1]=auth.uid()::text or public.vp_is_admin()));
create policy vp_file_insert on storage.objects for insert to authenticated with check(bucket_id='vp-private' and (storage.foldername(name))[1]=auth.uid()::text and (storage.foldername(name))[2] in ('portrait','trade_proof') and exists(select 1 from public.vp_accounts where user_id=auth.uid() and status in ('onboarding','pending')));
-- No update/delete of evidence by partners. Lifecycle deletion is a documented admin process.
do $$declare r record;begin for r in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'vp_%' loop execute format('revoke all on function %s from public, anon, authenticated',r.signature);execute format('grant execute on function %s to authenticated',r.signature);end loop;end$$;
revoke all on function public.vp_bootstrap_admin(text) from authenticated;grant execute on function public.vp_bootstrap_admin(text) to service_role;
grant execute on function public.vp_is_admin() to anon;
