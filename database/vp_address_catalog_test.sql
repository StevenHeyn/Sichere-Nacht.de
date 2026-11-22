begin;
select set_config('test.geo_actor',gen_random_uuid()::text,true),set_config('test.geo_other',gen_random_uuid()::text,true);
insert into auth.users(id,email,aud,role,email_confirmed_at) values(current_setting('test.geo_actor')::uuid,'geo-check-1@example.invalid','authenticated','authenticated',now()),(current_setting('test.geo_other')::uuid,'geo-check-2@example.invalid','authenticated','authenticated',now());
insert into public.vp_accounts(user_id,email,status,sales_passed_at,sales_quiz_version) values(current_setting('test.geo_actor')::uuid,'geo-check-1@example.invalid','active',now(),'ajax-basics-v1'),(current_setting('test.geo_other')::uuid,'geo-check-2@example.invalid','active',now(),'ajax-basics-v1');
select set_config('test.geo_point',public.vp_catalog_materialize('["osm:node:9223372036854775800","QA Teststraße","999","QA","25499",9.85,53.68]')::text,true);
do $$begin
 if has_function_privilege('anon','public.vp_catalog_materialize(jsonb)','execute') or has_function_privilege('authenticated','public.vp_catalog_materialize(jsonb)','execute') then raise exception 'Materialization is public';end if;
 if has_table_privilege('authenticated','public.vp_address_import_tokens','select') or has_table_privilege('anon','public.vp_address_snapshots','select') then raise exception 'Import metadata exposed';end if;
end$$;
select set_config('request.jwt.claim.sub',current_setting('test.geo_actor'),true);
set local role authenticated;
select public.vp_claim_address(current_setting('test.geo_point')::uuid);
select public.vp_update_building(current_setting('test.geo_point')::uuid,'multi_family',3);
select public.vp_qualify_address(current_setting('test.geo_point')::uuid,'qualified',3);
select public.vp_save_contact(current_setting('test.geo_point')::uuid,null,jsonb_build_object('full_name','Private QA fixture','purpose','QA rollback contact isolation check','privacy_notice_at',now(),'retain_until',now()+interval '1 day'));
do $$begin
 if not exists(select 1 from public.vp_map_overlays(9.84,53.67,9.86,53.69) where id=current_setting('test.geo_point')::uuid and status='qualified' and residential_units=3) then raise exception 'Map qualification missing';end if;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.geo_other'),true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.vp_d2d_contacts where address_id=current_setting('test.geo_point')::uuid) then raise exception 'Private contact leaked';end if;
 begin perform public.vp_claim_address(current_setting('test.geo_point')::uuid);raise exception 'Expected claim denial';exception when others then if sqlerrm='Expected claim denial' then raise;end if;end;
 begin perform public.vp_update_building(current_setting('test.geo_point')::uuid,'single_family',1);raise exception 'Expected update denial';exception when others then if sqlerrm='Expected update denial' then raise;end if;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.geo_actor'),true);
set local role authenticated;
select public.vp_qualify_address(current_setting('test.geo_point')::uuid,'do_not_contact',3);
reset role;
do $$declare i uuid;begin
 i=public.vp_catalog_materialize('["osm:way:9223372036854775801","QA Teststraße","999","QA","25499",9.85001,53.68001]');
 if i<>current_setting('test.geo_point')::uuid or not exists(select 1 from public.vp_addresses where id=i and blocked and status='do_not_contact' and residential_units=3) then raise exception 'Snapshot overwrote qualification';end if;
end$$;
rollback;
