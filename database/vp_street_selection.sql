-- Street selection is distinct from rectangular area selection.
alter table public.vp_territories add column if not exists street_name text;
alter table public.vp_territories add column if not exists street_postal_code text;
create unique index if not exists vp_street_selection_unique on public.vp_territories(lower(street_name),street_postal_code) where street_name is not null;
create or replace function public.vp_select_street(p_street text,p_postal_code text,p_bbox double precision[]) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare i uuid;
begin
 perform public.vp_require_active();
 if not (select d2d_open from public.vp_settings where id) then raise exception 'D2D noch nicht freigegeben';end if;
 if p_street is null or length(btrim(p_street))<3 or length(p_street)>160 or p_postal_code is null or p_postal_code !~ '^[0-9]{5}$' then raise exception 'Straße und fünfstellige PLZ erforderlich';end if;
 if array_length(p_bbox,1) is distinct from 4 or exists(select 1 from unnest(p_bbox) n where n is null or n='NaN'::float8) or not(p_bbox[1]>=5 and p_bbox[3]<=16 and p_bbox[2]>=47 and p_bbox[4]<=56 and p_bbox[1]<p_bbox[3] and p_bbox[2]<p_bbox[4]) then raise exception 'Ungültige Adresskoordinaten';end if;
 perform pg_advisory_xact_lock(472093);
 select id into i from public.vp_territories where lower(street_name)=lower(btrim(p_street)) and street_postal_code=p_postal_code limit 1;
 if i is null then insert into public.vp_territories(label,west,south,east,north,source,locality,street_name,street_postal_code)
 values(left(btrim(p_street)||' · '||p_postal_code||' · gesamte Straße im PLZ-Bereich',200),p_bbox[1],p_bbox[2],p_bbox[3],p_bbox[4],'OpenStreetMap / ODbL','PLZ '||p_postal_code,btrim(p_street),p_postal_code) returning id into i;
 end if;
 return i;
end $$;
revoke all on function public.vp_select_street(text,text,double precision[]) from public,anon;
grant execute on function public.vp_select_street(text,text,double precision[]) to authenticated;
