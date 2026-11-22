-- Radius is straight-line distance between postal-code centres, not road distance.
alter table public.vp_accounts add column installer_postal_code text, add column installer_locality text, add column installer_latitude double precision, add column installer_longitude double precision, add column installer_radius_km integer check(installer_radius_km between 5 and 250);
alter table public.vp_installation_jobs alter column installer_id drop not null, alter column scheduled_at drop not null;
alter table public.vp_installation_jobs add column postal_code text, add column locality text, add column latitude double precision, add column longitude double precision, add column customer_name text, add column customer_phone text, add column customer_email text;
create function vp_private.distance_km(a double precision,b double precision,c double precision,d double precision) returns double precision language sql immutable strict set search_path='' as $$select 6371*2*asin(sqrt(least(1::double precision,greatest(0::double precision,power(sin(radians(c-a)/2),2)+cos(radians(a))*cos(radians(c))*power(sin(radians(d-b)/2),2)))))$$;
revoke all on function vp_private.distance_km(double precision,double precision,double precision,double precision) from public,anon,authenticated;
create function public.vp_save_installer_area(p_postal_code text,p_locality text,p_latitude double precision,p_longitude double precision,p_radius integer) returns void language plpgsql security definer set search_path='' as $$begin
 perform public.vp_require_active();
 if p_postal_code is null or p_postal_code!~'^[0-9]{5}$' or length(coalesce(p_locality,'')) not between 2 and 200 or p_latitude is null or p_longitude is null or not(p_latitude between 47 and 56 and p_longitude between 5 and 16) or p_radius is null or p_radius not between 5 and 250 then raise exception 'Gültige deutsche PLZ und Radius zwischen 5 und 250 km erforderlich.';end if;
 update public.vp_accounts set installer_postal_code=p_postal_code,installer_locality=p_locality,installer_latitude=p_latitude,installer_longitude=p_longitude,installer_radius_km=p_radius where user_id=auth.uid();
end$$;
create function public.vp_publish_installation_job(p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare i uuid;lat double precision;lng double precision;begin
 perform public.vp_require_admin();
 lat=(p_data->>'latitude')::double precision;lng=(p_data->>'longitude')::double precision;
 if length(btrim(coalesce(p_data->>'title',''))) not between 5 and 200 or length(btrim(coalesce(p_data->>'description',''))) not between 30 and 5000 or length(btrim(coalesce(p_data->>'location',''))) not between 3 and 500 or coalesce(p_data->>'postalCode','')!~'^[0-9]{5}$' or length(coalesce(p_data->>'locality','')) not between 2 and 200 or lat is null or lng is null or not(lat between 47 and 56 and lng between 5 and 16) or length(btrim(coalesce(p_data->>'customerName',''))) not between 2 and 200 or (length(btrim(coalesce(p_data->>'customerPhone','')))<5 and length(btrim(coalesce(p_data->>'customerEmail','')))<5) then raise exception 'Auftrag, vollständige Adresse und Kundenkontakt erforderlich.';end if;
 insert into public.vp_installation_jobs(title,description,location,created_by,postal_code,locality,latitude,longitude,customer_name,customer_phone,customer_email) values(btrim(p_data->>'title'),btrim(p_data->>'description'),btrim(p_data->>'location'),auth.uid(),p_data->>'postalCode',p_data->>'locality',lat,lng,btrim(p_data->>'customerName'),left(p_data->>'customerPhone',80),left(p_data->>'customerEmail',200)) returning id into i;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'installation_published',i::text);return i;
end$$;
create function public.vp_installation_pool() returns jsonb language plpgsql security definer set search_path='' as $$declare a public.vp_accounts%rowtype;begin
 perform public.vp_require_active();select * into a from public.vp_accounts where user_id=auth.uid();
 if a.installer_approved_at is null or a.installer_quiz_version is distinct from 'installer-v1' then return '[]'::jsonb;end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',j.id,'title',j.title,'description',j.description,'postal_code',j.postal_code,'locality',j.locality,'status',j.status,'distance_km',round(vp_private.distance_km(a.installer_latitude,a.installer_longitude,j.latitude,j.longitude)::numeric,1),'accepted_at',j.accepted_at,'location',case when j.installer_id=a.user_id then j.location end,'customer_name',case when j.installer_id=a.user_id then j.customer_name end,'customer_phone',case when j.installer_id=a.user_id then j.customer_phone end,'customer_email',case when j.installer_id=a.user_id then j.customer_email end) order by j.created_at desc) from public.vp_installation_jobs j where j.installer_id=a.user_id or (j.status='offered' and j.installer_id is null and a.installer_radius_km is not null and vp_private.distance_km(a.installer_latitude,a.installer_longitude,j.latitude,j.longitude)<=a.installer_radius_km)),'[]'::jsonb);
end$$;
create or replace function public.vp_accept_installation_job(p_id uuid) returns void language plpgsql security definer set search_path='' as $$declare a public.vp_accounts%rowtype;j public.vp_installation_jobs%rowtype;begin
 perform public.vp_require_active();select * into a from public.vp_accounts where user_id=auth.uid() for update;
 if a.installer_approved_at is null or a.installer_quiz_version is distinct from 'installer-v1' then raise exception 'Masterclass zuerst bestehen.' using errcode='42501';end if;
 if a.installer_radius_km is null or a.installer_latitude is null or a.installer_longitude is null then raise exception 'Zuerst PLZ und Einsatzradius hinterlegen.';end if;
 select * into j from public.vp_installation_jobs where id=p_id for update;
 if not found then raise exception 'Auftrag nicht verfügbar.';end if;
 if j.status='accepted' and j.installer_id=a.user_id then return;end if;
 if j.status<>'offered' or j.installer_id is not null then raise exception 'Auftrag ist bereits vergeben oder nicht mehr verfügbar.';end if;
 if j.latitude is null or j.longitude is null or vp_private.distance_km(a.installer_latitude,a.installer_longitude,j.latitude,j.longitude)>a.installer_radius_km then raise exception 'Auftrag liegt außerhalb deines Einsatzradius.' using errcode='42501';end if;
 update public.vp_installation_jobs set installer_id=a.user_id,status='accepted',accepted_at=clock_timestamp() where id=p_id;
 insert into public.vp_audit(actor,event,target) values(a.user_id,'installation_accepted',p_id::text);
end$$;
-- Old assigned/time-based creation endpoint is superseded by the pool.
revoke all on function public.vp_offer_installation_job(uuid,text,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.vp_save_installer_area(text,text,double precision,double precision,integer),public.vp_publish_installation_job(jsonb),public.vp_installation_pool() from public,anon,authenticated;
grant execute on function public.vp_save_installer_area(text,text,double precision,double precision,integer),public.vp_publish_installation_job(jsonb),public.vp_installation_pool() to authenticated;
-- Existing RLS allows direct access only to administration and the assigned installer.
notify pgrst,'reload schema';
