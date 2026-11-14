alter table public.vp_addresses add column building_type text check(building_type in ('single_family','multi_family','commercial')),add column residential_units integer,add column created_by uuid references public.vp_accounts(user_id);
alter table public.vp_addresses add constraint vp_building_units check((building_type is null and residential_units is null) or (building_type='single_family' and residential_units is not null and residential_units=1) or (building_type='multi_family' and residential_units is not null and residential_units between 2 and 1000) or (building_type='commercial' and residential_units is null));
create function public.vp_create_address(p_territory uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.vp_territories%rowtype;i uuid;k text;s text;n text;c text;z text;kind text;units integer;lng float8;lat float8;
begin
 perform public.vp_require_active();
 if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D derzeit gesperrt';end if;
 select * into t from public.vp_territories where id=p_territory;if not found then raise exception 'Zuerst ein Gebiet auswählen';end if;
 s=btrim(p_data->>'street');n=btrim(p_data->>'house_number');c=btrim(p_data->>'city');z=btrim(p_data->>'postal_code');kind=p_data->>'building_type';
 if s is null or length(s) not between 2 and 200 or n is null or length(n) not between 1 and 40 or c is null or length(c) not between 2 and 160 or z is null or z!~'^[0-9]{5}$' then raise exception 'Straße, Hausnummer, Ort und fünfstellige PLZ sind erforderlich';end if;
 if kind is null or kind not in ('single_family','multi_family','commercial') then raise exception 'Gebäudetyp auswählen';end if;
 if kind='single_family' then units=1;elsif kind='multi_family' then units=(p_data->>'residential_units')::integer;if units is null or units not between 2 and 1000 then raise exception 'Mehrfamilienhaus: 2 bis 1000 Wohneinheiten angeben';end if;else units=null;end if;
 lng=(p_data->>'longitude')::float8;lat=(p_data->>'latitude')::float8;
 if lng is null or lat is null or not(lng between t.west and t.east and lat between t.south and t.north) then raise exception 'Position innerhalb des ausgewählten Gebiets angeben';end if;
 k=lower(regexp_replace(s||'|'||n||'|'||z||'|'||c,'\s','','g'));
 perform pg_advisory_xact_lock(472094);
 select id into i from public.vp_addresses a where lower(regexp_replace(a.street,'\s','','g'))=lower(regexp_replace(s,'\s','','g')) and lower(regexp_replace(a.house_number,'\s','','g'))=lower(regexp_replace(n,'\s','','g')) and ((a.postal_code=z and lower(a.city)=lower(c)) or (abs(a.longitude-lng)<0.0006 and abs(a.latitude-lat)<0.0006)) limit 1;
 if i is not null then return jsonb_build_object('id',i,'created',false);end if;
 insert into public.vp_addresses(source_key,street,house_number,city,postal_code,longitude,latitude,source,building_type,residential_units,created_by)
 values('manual:'||md5(k),s,n,c,z,lng,lat,'Manuell durch Vertriebspartner erfasst',kind,units,auth.uid()) returning id into i;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'manual_address_created',i::text);
 return jsonb_build_object('id',i,'created',true);
end$$;
revoke all on function public.vp_create_address(uuid,jsonb) from public,anon;
grant execute on function public.vp_create_address(uuid,jsonb) to authenticated;

create or replace function public.vp_import_addresses(p_territory uuid,p_rows jsonb,p_source text,p_coverage text) returns integer language plpgsql security definer set search_path=public,pg_temp as $$declare t public.vp_territories%rowtype;r jsonb;n integer:=0;begin
 perform public.vp_require_active();select * into t from public.vp_territories where id=p_territory;
 if not found then raise exception 'Gebiet nicht gefunden';end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>500 or length(p_source)<5 then raise exception 'Importumfang oder Quelle ungültig';end if;
 perform pg_advisory_xact_lock(472094);
 for r in select * from jsonb_array_elements(p_rows) loop
 if length(coalesce(r->>'source_key',''))<3 or length(coalesce(r->>'street',''))<1 or length(coalesce(r->>'house_number',''))<1 or length(coalesce(r->>'city',''))<1 or not ((r->>'longitude')::double precision between t.west and t.east and (r->>'latitude')::double precision between t.south and t.north) then raise exception 'Unvollständiger Adressdatensatz oder außerhalb des Gebiets';end if;
 if exists(select 1 from public.vp_addresses a where lower(a.street)=lower(r->>'street') and lower(a.house_number)=lower(r->>'house_number') and abs(a.longitude-(r->>'longitude')::float8)<0.0006 and abs(a.latitude-(r->>'latitude')::float8)<0.0006) then continue;end if;
 insert into public.vp_addresses(source_key,street,house_number,city,postal_code,longitude,latitude,source) values(left(r->>'source_key',240),left(r->>'street',200),left(r->>'house_number',40),left(r->>'city',160),left(coalesce(r->>'postal_code',''),12),(r->>'longitude')::double precision,(r->>'latitude')::double precision,left(p_source,500)) on conflict(source_key) do nothing;n=n+1;
 end loop;
 update public.vp_territories set source=left(p_source,500),coverage=left(p_coverage,500),imported_at=now() where id=t.id;return n;end$$;
