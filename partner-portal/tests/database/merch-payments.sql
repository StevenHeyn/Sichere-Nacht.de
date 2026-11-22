-- Run after the migration inside an explicit transaction. No real order survives.
begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.vp_accounts where status='active' order by created_at limit 1),true);
do $$ declare u uuid:=auth.uid();k uuid:=gen_random_uuid();o uuid;again uuid;amount integer;begin
 if u is null then raise exception 'Active test context missing';end if;
 o:=public.vp_merch_checkout_order('business-card',500,k);
 again:=public.vp_merch_checkout_order('business-card',500,k);
 if o<>again then raise exception 'Duplicate order';end if;
 select quote_total_cents into amount from public.vp_merch_orders where id=o;
 if amount<>2908 then raise exception 'Incorrect gross amount';end if;
 begin perform public.vp_merch_checkout_order('qr-flyer',1000,k);raise exception 'Changed request accepted';exception when others then if sqlerrm='Changed request accepted' then raise;end if;end;
 begin perform public.vp_merch_checkout_order('business-card',501,gen_random_uuid());raise exception 'Unpriced quantity accepted';exception when others then if sqlerrm='Unpriced quantity accepted' then raise;end if;end;
 perform public.vp_merch_attach_session(o,u,'cs_live_rollback_test');
 begin perform public.vp_merch_record_payment(o,'cs_live_rollback_test',u,'paid',1,'eur','{}','evt_fixture');raise exception 'Wrong amount accepted';exception when others then if sqlerrm='Wrong amount accepted' then raise;end if;end;
 begin perform public.vp_merch_record_payment(o,'cs_live_rollback_test',gen_random_uuid(),'paid',2908,'eur','{}','evt_fixture');raise exception 'Wrong owner accepted';exception when others then if sqlerrm='Wrong owner accepted' then raise;end if;end;
 begin perform public.vp_merch_record_payment(o,'cs_live_rollback_test',u,'paid',2908,'eur','{"tax":464,"shipping":{"address":{"country":"AT"}}}','evt_fixture');raise exception 'Wrong country accepted';exception when others then if sqlerrm='Wrong country accepted' then raise;end if;end;
 perform public.vp_merch_record_payment(o,'cs_live_rollback_test',u,'processing',2908,'eur','{}','evt_pending');
 if (select payment_status from public.vp_merch_orders where id=o)<>'processing' then raise exception 'Processing missing';end if;
 perform public.vp_merch_record_payment(o,'cs_live_rollback_test',u,'failed',2908,'eur','{}','evt_failure');
 perform public.vp_merch_record_payment(o,'cs_live_rollback_test',u,'processing',2908,'eur','{}','evt_reconcile');
 if (select payment_status from public.vp_merch_orders where id=o)<>'failed' then raise exception 'Failure regressed to processing';end if;
 perform public.vp_merch_record_payment(o,'cs_live_rollback_test',u,'paid',2908,'eur','{"tax":464,"shipping":{"address":{"country":"DE"}}}','evt_paid');
 perform public.vp_merch_record_payment(o,'cs_live_rollback_test',u,'failed',2908,'eur','{}','evt_old_failure');
 if (select payment_status from public.vp_merch_orders where id=o)<>'paid' then raise exception 'Late failure regressed payment';end if;
 if (select status from public.vp_merch_orders where id=o)<>'accepted' then raise exception 'Paid order not accepted';end if;
 if has_function_privilege('authenticated','public.vp_merch_record_payment(uuid,text,uuid,text,integer,text,jsonb,text)','EXECUTE') then raise exception 'Partner can mark payments';end if;
 if has_table_privilege('authenticated','public.vp_merch_orders','UPDATE') then raise exception 'Partner can change order';end if;
end $$;
rollback;
