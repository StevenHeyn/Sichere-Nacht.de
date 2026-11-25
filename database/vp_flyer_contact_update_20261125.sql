-- Active partners can correct their own flyer contact details only.
-- Historical personalization snapshots on existing orders remain unchanged.
create or replace function public.vp_update_flyer_contact(p_name text,p_phone text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare n text:=btrim(coalesce(p_name,'')); t text:=btrim(coalesce(p_phone,''));
begin
  perform public.vp_require_active();
  if length(n)<3 or length(n)>100 or n !~ '[[:alpha:]]' or n ~ '[[:cntrl:]]'
    then raise exception 'Bitte vollständigen Namen (3 bis 100 Zeichen) eingeben'; end if;
  if length(t)<6 or length(t)>40 or t !~ '^[+0-9() /-]+$' or t !~ '[0-9].*[0-9]'
    then raise exception 'Bitte eine gültige Telefonnummer eingeben'; end if;
  update public.vp_accounts
     set full_name=n, phone=t
   where user_id=auth.uid() and status='active';
  if not found then raise exception 'Aktives Partnerkonto nicht gefunden'; end if;
end $$;
revoke all on function public.vp_update_flyer_contact(text,text) from public,anon,authenticated;
grant execute on function public.vp_update_flyer_contact(text,text) to authenticated;
