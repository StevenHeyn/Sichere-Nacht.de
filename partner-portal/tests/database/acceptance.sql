-- Run against the configured Supabase database. Every fixture and change rolls back.
-- No emails, payments or persistent accounts are created.
begin;
create temporary table vp_qa_ids(label text primary key,id uuid not null default gen_random_uuid());
insert into vp_qa_ids(label) values('admin'),('agency'),('owner'),('other'),('area'),('overlap'),('address'),('course'),('slot');
grant select on vp_qa_ids to authenticated;
create function pg_temp.qa_id(p text) returns uuid language sql as $$select id from vp_qa_ids where label=p$$;
create function pg_temp.assert_true(ok boolean,message text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'QA failed: %',message;end if;end$$;
create function pg_temp.login_as(p text) returns void language plpgsql as $$begin perform set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.qa_id(p),'role','authenticated')::text,true);end$$;
insert into auth.users(id,email,email_confirmed_at,aud,role)
select id,'qa-'||id||'@example.invalid',now(),'authenticated','authenticated' from vp_qa_ids where label in ('admin','agency','owner','other');
insert into public.vp_accounts(user_id,email,full_name,role,status,clothing_size)
select id,'qa-'||id||'@example.invalid','Rollback QA '||label,case when label in ('admin','agency') then label else 'vp' end,'active','M' from vp_qa_ids where label in ('admin','agency','owner','other');
update public.vp_accounts set agency_id=pg_temp.qa_id('agency') where user_id=pg_temp.qa_id('owner');
update public.vp_settings set d2d_open=true,settlement_open=true;
insert into public.vp_territories(id,label,west,south,east,north) values
(pg_temp.qa_id('area'),'Rollback QA area',9.19,50.4,9.21,50.42),
(pg_temp.qa_id('overlap'),'Rollback QA overlapping area',9.20,50.41,9.22,50.43);
insert into public.vp_addresses(id,source_key,street,house_number,city,longitude,latitude,source)
values(pg_temp.qa_id('address'),'qa:'||pg_temp.qa_id('address'),'Rollback Teststraße','1','Testgebiet',9.205,50.415,'Rollback fixture, no real address');
insert into public.vp_courses(id,title,body,masterclass,published) values(pg_temp.qa_id('course'),'QA Masterclass','Rollback only; no real event.',true,true);
insert into public.vp_training_slots(id,course_id,starts_at,ends_at,location,capacity) values(pg_temp.qa_id('slot'),pg_temp.qa_id('course'),now()+interval '2 days',now()+interval '3 days','Rollback QA',1);
set local role authenticated;
select pg_temp.login_as('owner');
select public.vp_claim_territory(pg_temp.qa_id('area'));
select public.vp_claim_address(pg_temp.qa_id('address'));
select public.vp_save_contact(pg_temp.qa_id('address'),null,jsonb_build_object('full_name','Private QA Contact','purpose','Requested consultation in rollback test','privacy_notice_at',now(),'retain_until',now()+interval '30 days'));
select pg_temp.assert_true((select count(*)=1 from public.vp_d2d_contacts where address_id=pg_temp.qa_id('address')),'owner can read own contact');
select public.vp_book_training(pg_temp.qa_id('slot'),false);
select public.vp_book_training(pg_temp.qa_id('slot'),false);
select pg_temp.assert_true((select count(*)=1 from public.vp_training_bookings where slot_id=pg_temp.qa_id('slot')),'repeat booking is idempotent');
select public.vp_request_installer();
do $$begin
 begin perform public.vp_admin_account(pg_temp.qa_id('owner'),'agency','QA self-escalation');raise exception 'QA unauthorized role accepted';exception when insufficient_privilege then null;end;
 begin update public.vp_accounts set role='admin' where user_id=pg_temp.qa_id('owner');raise exception 'QA direct role update accepted';exception when insufficient_privilege then null;end;
end$$;
select pg_temp.login_as('agency');
select pg_temp.assert_true((select count(*)=0 from public.vp_d2d_contacts where address_id=pg_temp.qa_id('address')),'agency cannot read employee contacts');
select pg_temp.assert_true((select count(*)=1 from public.vp_roster() where user_id=pg_temp.qa_id('owner')),'agency can see own partner roster');
select pg_temp.login_as('other');
select pg_temp.assert_true((select count(*)=0 from public.vp_d2d_contacts where address_id=pg_temp.qa_id('address')),'other VP cannot read contact');
do $$begin
 begin perform public.vp_claim_territory(pg_temp.qa_id('overlap'));raise exception 'QA overlap accepted';exception when raise_exception then if sqlerrm='QA overlap accepted' then raise;end if;end;
 begin perform public.vp_claim_address(pg_temp.qa_id('address'));raise exception 'QA foreign address accepted';exception when raise_exception then if sqlerrm='QA foreign address accepted' then raise;end if;end;
 begin perform public.vp_book_training(pg_temp.qa_id('slot'),false);raise exception 'QA overbooking accepted';exception when raise_exception then if sqlerrm='QA overbooking accepted' then raise;end if;end;
end$$;
select pg_temp.login_as('admin');
select pg_temp.assert_true((select count(*)=1 from public.vp_d2d_contacts where address_id=pg_temp.qa_id('address')),'admin can read contact');
do $$begin
 begin perform public.vp_admin_learning('approve_installer',jsonb_build_object('user_id',pg_temp.qa_id('owner')));raise exception 'QA unqualified installer approved';exception when raise_exception then if sqlerrm='QA unqualified installer approved' then raise;end if;end;
end$$;
reset role;
select set_config('request.jwt.claims','{}',true);
update public.vp_training_slots set starts_at=now()-interval '2 days',ends_at=now()-interval '1 day' where id=pg_temp.qa_id('slot');
set local role authenticated;
select pg_temp.login_as('admin');
select public.vp_admin_learning('grade',jsonb_build_object('user_id',pg_temp.qa_id('owner'),'slot_id',pg_temp.qa_id('slot'),'status','passed'));
select public.vp_admin_learning('approve_installer',jsonb_build_object('user_id',pg_temp.qa_id('owner')));
select pg_temp.assert_true((select installer_approved_at is not null from public.vp_accounts where user_id=pg_temp.qa_id('owner')),'passed masterclass allows installer approval');
select pg_temp.login_as('owner');
select public.vp_qualify_address(pg_temp.qa_id('address'),'no_interest',2);
select pg_temp.assert_true((select blocked and households=2 from public.vp_addresses where id=pg_temp.qa_id('address')),'no interest creates persistent contact block');
reset role;
select set_config('request.jwt.claims','{}',true);
-- Paid-order fixtures remain inside this transaction; queues roll back with them.
insert into public.orders(stripe_session_id,stripe_event_id,status,amount_total,amount_tax,shipping_amount,currency,items,vp_id,test_mode,created_at)
select 'qa_'||a.user_id,'qa_event_'||a.user_id,'paid',119000,19000,0,'eur','[]'::jsonb,a.referral_code,false,date_trunc('month',now())-interval '3 months'+interval '5 days'
from public.vp_accounts a where a.user_id in (pg_temp.qa_id('owner'),pg_temp.qa_id('other'));
set local role authenticated;
select pg_temp.login_as('admin');
do $$declare e record;begin for e in select id from public.vp_earnings where earner_id in (pg_temp.qa_id('owner'),pg_temp.qa_id('other')) loop perform public.vp_reconcile_earning(e.id,'eligible',100000,'Rollback QA payment reconciliation');end loop;end$$;
select public.vp_close_month((date_trunc('month',now())-interval '3 months')::date,'Rollback QA monthly close');
select pg_temp.assert_true((select commission_cents=20000 and reserve_delta_cents=750 and payable_cents=19250 from public.vp_statements where payee_id=pg_temp.qa_id('agency')),'agency receives 20% including VP15; reserve only once');
select pg_temp.assert_true((select commission_cents=15000 and reserve_delta_cents=750 and payable_cents=14250 from public.vp_statements where payee_id=pg_temp.qa_id('other')),'direct VP15 and five-percent reserve');
select pg_temp.assert_true(public.vp_close_month((date_trunc('month',now())-interval '3 months')::date,'Rollback QA repeat close')=0,'monthly close is idempotent');
do $$begin
 begin perform public.vp_close_month(date_trunc('month',now())::date,'Rollback QA early close');raise exception 'QA early close accepted';exception when raise_exception then if sqlerrm='QA early close accepted' then raise;end if;end;
 begin perform public.vp_reserve_release(pg_temp.qa_id('owner'),null);raise exception 'QA early reserve accepted';exception when raise_exception then if sqlerrm='QA early reserve accepted' then raise;end if;end;
end$$;
select public.vp_reconcile_earning((select id from public.vp_earnings where earner_id=pg_temp.qa_id('owner')),'cancelled',0,'Rollback QA full refund evidence');
select pg_temp.assert_true((select balance_cents=0 from public.vp_reserves where earner_id=pg_temp.qa_id('owner')),'refund reverses held reserve');
reset role;
select set_config('request.jwt.claims','{}',true);
update public.vp_reserves set last_order_at=now()-interval '13 months' where earner_id=pg_temp.qa_id('other');
set local role authenticated;
select pg_temp.login_as('admin');
select public.vp_reserve_release(pg_temp.qa_id('other'),null);
select public.vp_reserve_release(pg_temp.qa_id('other'),'Rollback QA actual payment receipt');
select pg_temp.assert_true((select balance_cents=0 from public.vp_reserves where earner_id=pg_temp.qa_id('other')),'mature reserve can be recorded as paid');
select 'PASS: roles, D2D privacy, overlaps, training capacity, masterclass, agency/direct commission, monthly timing, refunds, reserve release' as result;
rollback;
