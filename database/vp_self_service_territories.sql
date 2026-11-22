alter table public.vp_territories add column if not exists locality text;
alter table public.vp_addresses add column if not exists last_qualified_by uuid references public.vp_accounts(user_id);
create or replace function public.vp_claim_address(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare a public.vp_addresses%rowtype;begin
 perform public.vp_require_active();if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 select * into a from public.vp_addresses where id=p_id for update;if not found then raise exception 'Adresse nicht gefunden';end if;
 if a.blocked then raise exception 'Adresse ist für weitere Ansprache gesperrt';end if;
 if a.claimed_by is distinct from auth.uid() and ((a.claim_until>now()) or (a.next_allowed_at>now())) then raise exception 'Adresse bereits reserviert oder in Kontaktsperrzeit';end if;
 update public.vp_addresses set claimed_by=auth.uid(),claim_until=now()+make_interval(days=>(select claim_days from public.vp_settings where id)) where id=p_id;end$$;
create or replace function public.vp_begin_address_import(p_id uuid) returns integer language plpgsql security definer set search_path=public,pg_temp as $$declare t public.vp_territories%rowtype;begin
 perform public.vp_require_active();if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 select * into t from public.vp_territories where id=p_id for update;
 if not found then raise exception 'Gebiet nicht gefunden';end if;
 if t.import_finished then raise exception 'Der bestehende Ausschnitt wurde bereits abgefragt. Aktualisierung durch Administration erforderlich';end if;
 if t.import_requested_at>now()-interval '30 seconds' then raise exception 'Bitte 30 Sekunden bis zur nächsten Adressseite warten';end if;
 update public.vp_territories set import_requested_at=now() where id=p_id;return t.import_cursor;end$$;
create or replace function public.vp_finish_address_import(p_id uuid,p_offset integer,p_next integer,p_more boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_active();if p_next<>p_offset+100 then raise exception 'Ungültige Importfolge';end if;
 update public.vp_territories set import_cursor=p_next,import_finished=not p_more where id=p_id and import_cursor=p_offset;
 if not found then raise exception 'Importstand zwischenzeitlich verändert';end if;end$$;
create or replace function public.vp_import_addresses(p_territory uuid,p_rows jsonb,p_source text,p_coverage text) returns integer language plpgsql security definer set search_path=public,pg_temp as $$declare t public.vp_territories%rowtype;r jsonb;n integer:=0;begin
 perform public.vp_require_active();select * into t from public.vp_territories where id=p_territory;
 if not found then raise exception 'Gebiet nicht gefunden';end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>500 or length(p_source)<5 then raise exception 'Importumfang oder Quelle ungültig';end if;
 for r in select * from jsonb_array_elements(p_rows) loop
 if length(coalesce(r->>'source_key',''))<3 or length(coalesce(r->>'street',''))<1 or length(coalesce(r->>'house_number',''))<1 or length(coalesce(r->>'city',''))<1 or not ((r->>'longitude')::double precision between t.west and t.east and (r->>'latitude')::double precision between t.south and t.north) then raise exception 'Unvollständiger Adressdatensatz oder außerhalb des Gebiets';end if;
 if exists(select 1 from public.vp_addresses a where lower(a.street)=lower(r->>'street') and lower(a.house_number)=lower(r->>'house_number') and abs(a.longitude-(r->>'longitude')::float8)<0.0006 and abs(a.latitude-(r->>'latitude')::float8)<0.0006) then continue;end if;
 insert into public.vp_addresses(source_key,street,house_number,city,postal_code,longitude,latitude,source) values(left(r->>'source_key',240),left(r->>'street',200),left(r->>'house_number',40),left(r->>'city',160),left(coalesce(r->>'postal_code',''),12),(r->>'longitude')::double precision,(r->>'latitude')::double precision,left(p_source,500)) on conflict(source_key) do nothing;n=n+1;
 end loop;
 update public.vp_territories set source=left(p_source,500),coverage=left(p_coverage,500),imported_at=now() where id=t.id;return n;end$$;
create or replace function public.vp_guard_shared_address() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.role()='authenticated' then
 perform public.vp_require_active();if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 if TG_OP='UPDATE' and new.status is distinct from old.status and not public.vp_is_admin() and (old.claimed_by is distinct from auth.uid() or old.claim_until is null or old.claim_until<=now() or old.blocked) then raise exception 'Keine aktive eigene Adressreservierung';end if;
 end if;return new;end$$;
create or replace function public.vp_qualify_address(p_id uuid,p_status text,p_households integer default null) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare a public.vp_addresses%rowtype;begin
 perform public.vp_require_active();if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 select * into a from public.vp_addresses where id=p_id for update;
 if not found or (not public.vp_is_admin() and (a.claimed_by is distinct from auth.uid() or a.claim_until is null or a.claim_until<=now() or a.blocked)) then raise exception 'Keine gültige eigene Adressreservierung';end if;
 if p_status not in ('not_home','no_interest','appointment','qualified','customer','do_not_contact') then raise exception 'Ungültiger Qualifizierungsstatus';end if;
 update public.vp_addresses set status=p_status,households=coalesce(p_households,households),last_visit=now(),last_qualified_by=auth.uid(),next_allowed_at=now()+make_interval(days=>(select cooldown_days from public.vp_settings where id)),blocked=blocked or p_status in ('no_interest','do_not_contact') where id=p_id;
 insert into public.vp_d2d_visits(address_id,actor,status) values(p_id,auth.uid(),p_status);end$$;
update public.vp_addresses a set last_qualified_by=v.actor from (select distinct on(address_id) address_id,actor from public.vp_d2d_visits order by address_id,created_at desc) v where a.id=v.address_id and a.last_qualified_by is null;
create or replace function public.vp_select_territory(p_label text,p_bbox double precision[],p_city text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare i uuid;begin
 perform public.vp_require_active();
 if array_length(p_bbox,1) is distinct from 4 or p_label is null or length(btrim(p_label))<3 or exists(select 1 from unnest(p_bbox) n where n is null or n='NaN'::float8) or not(p_bbox[1]>=5 and p_bbox[3]<=16 and p_bbox[2]>=47 and p_bbox[4]<=56 and p_bbox[1]<p_bbox[3] and p_bbox[2]<p_bbox[4]) or p_bbox[3]-p_bbox[1]>.04 or p_bbox[4]-p_bbox[2]>.03 then raise exception 'Bitte einen kleinen Gebietsausschnitt in Deutschland auswählen';end if;
 perform pg_advisory_xact_lock(472093);
 select id into i from public.vp_territories where west=p_bbox[1] and south=p_bbox[2] and east=p_bbox[3] and north=p_bbox[4] limit 1;
 if i is null then insert into public.vp_territories(label,west,south,east,north,source,locality) values(left(p_label,200),p_bbox[1],p_bbox[2],p_bbox[3],p_bbox[4],'OpenStreetMap / ODbL',left(p_city,160)) returning id into i;end if;
 return i;end$$;
revoke all on function public.vp_select_territory(text,double precision[],text) from public,anon;
grant execute on function public.vp_select_territory(text,double precision[],text) to authenticated;
create table public.vp_geo_throttle(id boolean primary key default true check(id),requested_at timestamptz not null default '-infinity');
insert into public.vp_geo_throttle(id) values(true);
alter table public.vp_geo_throttle enable row level security;
revoke all on public.vp_geo_throttle from public,anon,authenticated;
create function public.vp_geo_request() returns boolean language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_active();
 update public.vp_geo_throttle set requested_at=clock_timestamp() where id and requested_at<clock_timestamp()-interval '3 seconds';return found;end$$;
revoke all on function public.vp_geo_request() from public,anon;
grant execute on function public.vp_geo_request() to authenticated;
update public.vp_settings set d2d_open=true where id;
