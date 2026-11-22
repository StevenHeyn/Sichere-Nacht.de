-- Keep gates and least-privilege rules enforced even for direct REST/RPC clients.
alter table public.vp_territories add column import_cursor integer not null default 0 check(import_cursor>=0);
alter table public.vp_territories add column import_finished boolean not null default false;
alter table public.vp_territories add column import_requested_at timestamptz;
create function public.vp_begin_address_import(p_id uuid) returns integer language plpgsql security definer set search_path=public,pg_temp as $$declare t public.vp_territories%rowtype;begin
 perform public.vp_require_active();if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 select * into t from public.vp_territories where id=p_id for update;
 if not found or (not public.vp_is_admin() and (t.claimed_by is distinct from auth.uid() or t.claim_until is null or t.claim_until<=now())) then raise exception 'Keine aktive eigene Gebietsreservierung';end if;
 if t.import_finished then raise exception 'Der bestehende Ausschnitt wurde bereits abgefragt. Aktualisierung durch Administration erforderlich';end if;
 if t.import_requested_at>now()-interval '30 seconds' then raise exception 'Bitte 30 Sekunden bis zur nächsten Adressseite warten';end if;
 update public.vp_territories set import_requested_at=now() where id=p_id;return t.import_cursor;end$$;
create function public.vp_finish_address_import(p_id uuid,p_offset integer,p_next integer,p_more boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_active();if p_next<>p_offset+100 then raise exception 'Ungültige Importfolge';end if;
 update public.vp_territories set import_cursor=p_next,import_finished=not p_more where id=p_id and import_cursor=p_offset and (public.vp_is_admin() or (claimed_by=auth.uid() and claim_until>now()));
 if not found then raise exception 'Importstand zwischenzeitlich verändert';end if;end$$;
create function public.vp_guard_shared_address() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.role()='authenticated' then
 perform public.vp_require_active();if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 if TG_OP='INSERT' and not public.vp_is_admin() and not exists(select 1 from public.vp_territories t where t.claimed_by=auth.uid() and t.claim_until>now() and new.longitude between t.west and t.east and new.latitude between t.south and t.north) then raise exception 'Adressimport nur in eigener aktiver Reservierung';end if;
 if TG_OP='UPDATE' and new.status is distinct from old.status and not public.vp_is_admin() and (old.claimed_by is distinct from auth.uid() or old.claim_until is null or old.claim_until<=now() or old.blocked) then raise exception 'Keine aktive eigene Adressreservierung';end if;
 end if;return new;end$$;
create trigger vp_shared_address_guard before insert or update on public.vp_addresses for each row execute function public.vp_guard_shared_address();
create function public.vp_guard_contact() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.role()='authenticated' then
 perform public.vp_require_active();if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 if not public.vp_is_admin() and (new.owner_id<>auth.uid() or not exists(select 1 from public.vp_addresses a where a.id=new.address_id and a.claimed_by=auth.uid() and a.claim_until>now() and not a.blocked)) then raise exception 'Kontakt nur in eigener aktiver Adressreservierung';end if;
 end if;return new;end$$;
create trigger vp_private_contact_guard before insert or update on public.vp_d2d_contacts for each row execute function public.vp_guard_contact();
-- Separate proof from operational contact deletion. This records the supplied evidence,
-- not an automated determination that a legally sufficient consent really exists.
create table public.vp_contact_evidence(id bigint generated always as identity primary key,contact_id uuid not null,owner_id uuid not null references public.vp_accounts(user_id),full_name text not null,phone text not null,email text not null,phone_permission boolean not null,email_permission boolean not null,evidence text not null,recorded_at timestamptz not null default now(),retain_until timestamptz not null,last_use_at timestamptz);
alter table public.vp_contact_evidence enable row level security;
revoke all on public.vp_contact_evidence from public,anon,authenticated;
grant select on public.vp_contact_evidence to authenticated;
create policy vp_evidence_read on public.vp_contact_evidence for select to authenticated using(public.vp_is_admin() or (owner_id=auth.uid() and public.vp_is_active()));
create function public.vp_preserve_contact_evidence() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if (new.phone_permission or new.email_permission) and (TG_OP='INSERT' or new.permission_evidence is distinct from old.permission_evidence or new.phone_permission is distinct from old.phone_permission or new.email_permission is distinct from old.email_permission or new.phone is distinct from old.phone or new.email is distinct from old.email) then
 insert into public.vp_contact_evidence(contact_id,owner_id,full_name,phone,email,phone_permission,email_permission,evidence,retain_until) values(new.id,new.owner_id,new.full_name,new.phone,new.email,new.phone_permission,new.email_permission,new.permission_evidence,case when new.phone_permission then now()+interval '5 years' else new.retain_until end);
 end if;return new;end$$;
create trigger vp_contact_evidence_record after insert or update on public.vp_d2d_contacts for each row execute function public.vp_preserve_contact_evidence();
create function public.vp_record_permission_use(p_id bigint,p_reason text) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_active();if length(p_reason)<10 then raise exception 'Konkreten Verwendungsvorgang dokumentieren';end if;
 update public.vp_contact_evidence e set last_use_at=now(),retain_until=greatest(e.retain_until,now()+interval '5 years') where e.id=p_id and e.phone_permission and (e.owner_id=auth.uid() or public.vp_is_admin()) and exists(select 1 from public.vp_d2d_contacts c join public.vp_addresses a on a.id=c.address_id where c.id=e.contact_id and c.phone_permission and c.retain_until>now() and not a.blocked);
 if not found then raise exception 'Aktuelle, nicht gesperrte Kontaktfreigabe erforderlich';end if;
 insert into public.vp_audit(actor,event,target,details) values(auth.uid(),'permission_use_recorded',p_id::text,jsonb_build_object('reason',left(p_reason,500)));end$$;
-- Actual scan/review and retention decisions remain an administrative obligation.
create function public.vp_admin_address(p_id uuid,p_reason text,p_reset_import boolean default false) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_admin();if length(p_reason)<15 then raise exception 'Begründete Prüfung erforderlich';end if;
 if p_reset_import then update public.vp_territories set import_cursor=0,import_finished=false,import_requested_at=null where id=p_id;
 else update public.vp_addresses set blocked=false,status='new',claimed_by=null,claim_until=null,next_allowed_at=null where id=p_id;end if;
 if not found then raise exception 'Datensatz nicht gefunden';end if;insert into public.vp_audit(actor,event,target,details) values(auth.uid(),'address_admin_review',p_id::text,jsonb_build_object('reason',p_reason,'import_reset',p_reset_import));end$$;
revoke all on function public.vp_begin_address_import(uuid),public.vp_finish_address_import(uuid,integer,integer,boolean),public.vp_guard_shared_address(),public.vp_guard_contact(),public.vp_preserve_contact_evidence(),public.vp_record_permission_use(bigint,text),public.vp_admin_address(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.vp_begin_address_import(uuid),public.vp_finish_address_import(uuid,integer,integer,boolean),public.vp_record_permission_use(bigint,text),public.vp_admin_address(uuid,text,boolean) to authenticated;
-- A clearly bounded pilot area; no user, resident or contact is seeded.
insert into public.vp_territories(label,west,south,east,north,coverage) values('Gedern – Zentrum, begrenzter Suchausschnitt',9.19,50.42,9.22,50.44,'Noch nicht importiert. Rechteckiger Pilot-Ausschnitt, keine Zusage des vollständigen Stadtgebiets.');
-- Prevent accepted terms from being silently edited after acceptance.
create function public.vp_immutable_terms() returns trigger language plpgsql set search_path=public,pg_temp as $$begin
 if old.status in ('published','retired') and (new.version is distinct from old.version or new.body is distinct from old.body or new.content_hash is distinct from old.content_hash) then raise exception 'Veröffentlichte Vertragsfassung ist unveränderlich; neue Version anlegen';end if;return new;end$$;
create trigger vp_terms_immutable before update on public.vp_terms for each row execute function public.vp_immutable_terms();
revoke all on function public.vp_immutable_terms() from public,anon,authenticated;
grant select on public.vp_accounts to service_role;
