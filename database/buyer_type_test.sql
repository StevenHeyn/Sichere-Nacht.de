begin;
do $$
declare sid text:='cs_test_BuyerRegression'||replace(gen_random_uuid()::text,'-',''); oid bigint; blocked boolean;
begin
 insert into public.orders(stripe_session_id,stripe_event_id,status,amount_total,currency,test_mode) values(sid,'evt_test_buyer','paid',11900,'eur',true) returning id into oid;
 if (select customer_type from public.orders where id=oid)<>'unclassified' then raise exception 'FAIL legacy default';end if;
 blocked:=false;begin update public.orders set customer_type='b2b' where id=oid;exception when check_violation then blocked:=true;end;if not blocked then raise exception 'FAIL b2b without evidence';end if;
 blocked:=false;begin update public.orders set customer_type='b2b',buyer_company='Example GmbH',business_purchase_declared=true,buyer_declared_at=now(),buyer_policy_version=null where id=oid;exception when check_violation then blocked:=true;end;if not blocked then raise exception 'FAIL null policy version';end if;
 update public.orders set customer_type='b2b',buyer_company='Example GmbH',business_purchase_declared=true,buyer_declared_at=now(),buyer_policy_version='2026-11-13-v1' where id=oid;
 update public.orders set stripe_event_id='evt_test_replayed',amount_total=11900 where id=oid;
 blocked:=false;begin update public.orders set customer_type='b2c' where id=oid;exception when raise_exception then blocked:=true;end;if not blocked then raise exception 'FAIL changed declaration';end if;
 blocked:=false;begin update public.orders set buyer_company='Changed GmbH' where id=oid;exception when raise_exception then blocked:=true;end;if not blocked then raise exception 'FAIL changed company';end if;
 if (select customer_type from public.orders where id=oid)<>'b2b' then raise exception 'FAIL immutable type';end if;
 if position('buyer_company' in pg_get_functiondef('public.issue_shipped_invoice(text)'::regprocedure))=0 then raise exception 'FAIL missing invoice snapshot';end if;
 if has_table_privilege('anon','public.orders','SELECT') or has_function_privilege('authenticated','public.issue_shipped_invoice(text)','EXECUTE') then raise exception 'FAIL public access';end if;
end $$;
select 'passed: unclassified legacy default, mandatory B2B evidence, non-null version, immutable declaration, replay-safe payment update, frozen invoice fields, private access' as regression_result;
rollback;
