create index vp_address_import_snapshot_idx on public.vp_address_import_tokens(snapshot_id);
create or replace function public.vp_catalog_materialize(p_row jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare i uuid;s text:=p_row->>1;n text:=p_row->>2;lon float8:=(p_row->>5)::float8;lat float8:=(p_row->>6)::float8;
begin
 if jsonb_array_length(p_row)<>7 or p_row->>0 !~ '^osm:(node|way|relation):[0-9]+$' or length(s) not between 1 and 200 or length(n) not between 1 and 40 or not(lon between 5 and 16 and lat between 47 and 56) then raise exception 'Ungültiger Katalogpunkt';end if;
 perform pg_advisory_xact_lock(hashtextextended(lower(s)||'|'||lower(n),0));
 select id into i from public.vp_addresses where source_key=p_row->>0;
 if i is null then
 select id into i from public.vp_addresses where lower(street)=lower(s) and lower(house_number)=lower(n) and (postal_code='' or coalesce(p_row->>4,'')='' or postal_code=p_row->>4) and abs(longitude-lon)<0.0006 and abs(latitude-lat)<0.0006 order by imported_at limit 1;
 end if;
 if i is not null then return i;end if;
 insert into public.vp_addresses(source_key,street,house_number,city,postal_code,longitude,latitude,source)
 values(p_row->>0,s,n,left(coalesce(nullif(p_row->>3,''),'PLZ '||(p_row->>4)),160),left(p_row->>4,12),lon,lat,'OpenStreetMap contributors / ODbL – eigener Deutschland-Snapshot')
 on conflict(source_key) do update set source_key=excluded.source_key returning id into i;
 return i;
end$$;

-- The old per-street provider import must not be callable by partner JWTs.
revoke execute on function public.vp_import_addresses(uuid,jsonb,text,text),public.vp_begin_address_import(uuid),public.vp_finish_address_import(uuid,integer,integer,boolean) from public,anon,authenticated;
