-- Execute after migration. The transaction rolls all fixtures and events back.
-- No email function or invoice-number allocation is called.
begin;
do $$
declare sid text:='cs_test_DropshipRegression'||replace(gen_random_uuid()::text,'-',''); oid bigint; blocked boolean; state jsonb; count_events integer; actual timestamptz:=now();
begin
 insert into public.orders(stripe_session_id,stripe_event_id,status,amount_total,amount_subtotal,amount_tax,shipping_amount,currency,customer_name,customer_email,shipping_name,shipping_country,shipping_address,items,test_mode,created_at)
 values(sid,'evt_test_dropship','paid',15980,14990,2551,990,'eur','Testrechnung','test@example.invalid','Testempfänger','DE','{"line1":"Testweg 1","postal_code":"12345","city":"Teststadt","country":"DE"}','[{"sku":"38198.02.WH1","name":"Testartikel","quantity":1,"amount_total":14990}]',true,now()-interval '1 minute') returning id into oid;
 if (select status from public.supplier_fulfillments where order_id=oid)<>'pending' then raise exception 'FAIL: missing pending supplier state'; end if;
 blocked:=false;begin perform public.mark_order_shipped(sid);exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'FAIL: old shipment shortcut was allowed';end if;
 blocked:=false;begin perform public.record_secplan_progress(sid,'submitted','portal-test',false,'stock-test');exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'FAIL: unchecked stock accepted';end if;
 perform public.record_secplan_progress(sid,'submitted','portal-test',true,'stock-test');
 perform public.record_secplan_progress(sid,'submitted','portal-test',true,'stock-test');
 select count(*) into count_events from public.supplier_fulfillment_events where order_id=oid;
 if count_events<>1 then raise exception 'FAIL: duplicate submission event';end if;
 blocked:=false;begin perform public.record_secplan_progress(sid,'shipped','dispatch-test',false,null,true,actual);exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'FAIL: shipment before confirmation accepted';end if;
 perform public.record_secplan_progress(sid,'confirmed','SECPLAN-test');
 blocked:=false;begin perform public.record_secplan_progress(sid,'shipped','dispatch-test',false,null,false,actual);exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'FAIL: partial shipment marked complete';end if;
 blocked:=false;begin perform public.record_secplan_progress(sid,'shipped','dispatch-test',false,null,true,now()+interval '1 day');exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'FAIL: future shipment accepted';end if;
 perform public.record_secplan_progress(sid,'shipped','dispatch-test',false,null,true,actual,'TestCarrier','TEST123');
 perform public.record_secplan_progress(sid,'shipped','dispatch-test',false,null,true,actual,'TestCarrier','TEST123');
 state:=public.mark_order_shipped(sid);
 if state->>'invoice_ready'<>'true' then raise exception 'FAIL: valid shipment not available to existing invoice pipeline';end if;
 select count(*) into count_events from public.supplier_fulfillment_events where order_id=oid;
 if count_events<>3 then raise exception 'FAIL: idempotence of supplier events';end if;
 update public.orders set stripe_event_id='evt_test_replayed',amount_total=15980 where id=oid;
 if (select status from public.supplier_fulfillments where order_id=oid)<>'shipped' then raise exception 'FAIL: payment update reset fulfillment';end if;
 if has_table_privilege('anon','public.supplier_fulfillments','SELECT') or has_function_privilege('authenticated','public.record_secplan_progress(text,text,text,boolean,text,boolean,timestamptz,text,text)','EXECUTE') then raise exception 'FAIL: public supplier access';end if;
end $$;
select 'passed: initial state, blocked shortcuts, stock confirmation, ordered transitions, no partial/future shipping, idempotence, preserved payment replay, private access' as regression_result;
rollback;
