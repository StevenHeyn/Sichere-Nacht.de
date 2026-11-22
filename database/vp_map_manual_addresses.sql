-- Reuse the validated manual-address writer without a provider lookup.
insert into public.vp_territories(label,west,south,east,north,source,coverage,import_finished)
select 'Manuelle Adresspunkte Deutschland',5,47,16,56,'manual-catalog','Manuell bestätigte Gebäudeadressen',true
where not exists(select 1 from public.vp_territories where source='manual-catalog');
create function public.vp_create_map_address(p_data jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare territory uuid;
begin
 perform public.vp_require_sales();
 select id into territory from public.vp_territories where source='manual-catalog' limit 1;
 return public.vp_create_address(territory,p_data);
end$$;
revoke all on function public.vp_create_map_address(jsonb) from public,anon;
grant execute on function public.vp_create_map_address(jsonb) to authenticated;
