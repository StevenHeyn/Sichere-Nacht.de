-- Immutable public base-data snapshots. Operational/person data stays separate.
create table public.vp_address_snapshots (
 id text primary key check(id ~ '^[a-z0-9-]{8,64}$'),
 status text not null default 'building' check(status in ('building','ready','retired')),
 active boolean not null default false,
 source_at timestamptz not null,
 address_count bigint not null default 0,
 file_count integer not null default 0,
 total_bytes bigint not null default 0,
 manifest_sha256 text,
 created_at timestamptz not null default now(), verified_at timestamptz,
 check(not active or (status='ready' and verified_at is not null and address_count>0))
);
create unique index vp_one_active_address_snapshot on public.vp_address_snapshots(active) where active;
create table public.vp_address_import_tokens (
 token_hash text primary key, snapshot_id text not null references public.vp_address_snapshots(id),
 expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table public.vp_address_snapshot_files (
 snapshot_id text not null references public.vp_address_snapshots(id),path text not null,
 sha256 text not null,bytes bigint not null,created_at timestamptz not null default now(),
 primary key(snapshot_id,path)
);
alter table public.vp_address_snapshots enable row level security;
alter table public.vp_address_import_tokens enable row level security;
alter table public.vp_address_snapshot_files enable row level security;
revoke all on public.vp_address_snapshots,public.vp_address_import_tokens,public.vp_address_snapshot_files from public,anon,authenticated;
grant select on public.vp_address_snapshots to authenticated;
grant all on public.vp_address_snapshots,public.vp_address_import_tokens,public.vp_address_snapshot_files to service_role;
create policy vp_snapshot_read on public.vp_address_snapshots for select to authenticated using((select public.vp_is_active()));
create index vp_address_map_position on public.vp_addresses using gist(point(longitude,latitude));
create index vp_address_match on public.vp_addresses(lower(street),lower(house_number));

create function public.vp_map_overlays(p_west float8,p_south float8,p_east float8,p_north float8)
returns setof public.vp_addresses language plpgsql stable security invoker set search_path=public,pg_temp as $$
begin
 perform public.vp_require_active();
 if p_west is null or p_south is null or p_east is null or p_north is null or not(p_west>=5 and p_east<=16 and p_south>=47 and p_north<=56 and p_west<p_east and p_south<p_north) then raise exception 'Ungültiger Kartenausschnitt';end if;
 return query select * from public.vp_addresses where point(longitude,latitude) <@ box(point(p_west,p_south),point(p_east,p_north)) order by id limit 2001;
end$$;
-- Only the authenticated Edge Function may materialize a row from a verified archive.
create function public.vp_catalog_materialize(p_row jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare i uuid;s text:=p_row->>1;n text:=p_row->>2;lon float8:=(p_row->>5)::float8;lat float8:=(p_row->>6)::float8;
begin
 if jsonb_array_length(p_row)<>7 or p_row->>0 !~ '^osm:(node|way|relation):[0-9]+$' or length(s) not between 1 and 200 or length(n) not between 1 and 40 or not(lon between 5 and 16 and lat between 47 and 56) then raise exception 'Ungültiger Katalogpunkt';end if;
 perform pg_advisory_xact_lock(hashtextextended(lower(s)||'|'||lower(n),0));
 select id into i from public.vp_addresses where source_key=p_row->>0;
 if i is null then
 select id into i from public.vp_addresses where lower(street)=lower(s) and lower(house_number)=lower(n) and abs(longitude-lon)<0.0006 and abs(latitude-lat)<0.0006 order by imported_at limit 1;
 end if;
 if i is not null then return i;end if;
 insert into public.vp_addresses(source_key,street,house_number,city,postal_code,longitude,latitude,source)
 values(p_row->>0,s,n,left(coalesce(nullif(p_row->>3,''),'PLZ '||(p_row->>4)),160),left(p_row->>4,12),lon,lat,'OpenStreetMap contributors / ODbL – eigener Deutschland-Snapshot')
 on conflict(source_key) do update set source_key=excluded.source_key returning id into i;
 return i;
end$$;

create function public.vp_update_building(p_id uuid,p_kind text,p_units integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.vp_addresses%rowtype;u integer;
begin
 perform public.vp_require_sales();
 if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 select * into a from public.vp_addresses where id=p_id for update;
 if not found or a.blocked or (not public.vp_is_admin() and (a.claimed_by is distinct from auth.uid() or a.claim_until is null or a.claim_until<=now())) then raise exception 'Eigene gültige Reservierung erforderlich';end if;
 if p_kind='single_family' then u=1;elsif p_kind='multi_family' and p_units between 2 and 1000 then u=p_units;elsif p_kind='commercial' then u=null;else raise exception 'Gebäudetyp und Wohneinheiten prüfen';end if;
 update public.vp_addresses set building_type=p_kind,residential_units=u where id=p_id;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'building_qualified',p_id::text);
end$$;
revoke all on function public.vp_map_overlays(float8,float8,float8,float8),public.vp_catalog_materialize(jsonb),public.vp_update_building(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.vp_map_overlays(float8,float8,float8,float8),public.vp_update_building(uuid,text,integer) to authenticated;
grant execute on function public.vp_catalog_materialize(jsonb) to service_role;
