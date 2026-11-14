-- Requires isolate_test_invoice_numbers.sql. No email/network requests.
-- All rows roll back; the real invoice sequence must remain untouched.
begin;
do $$
declare sid text:='cs_test_InvoiceIsolation'||replace(gen_random_uuid()::text,'-',''); oid bigint; before_seq bigint; after_seq bigint; first_invoice jsonb; repeated_invoice jsonb;
begin
 select last_value into before_seq from public.sichere_nacht_invoice_seq;
 insert into public.orders(stripe_session_id,stripe_event_id,status,amount_total,amount_subtotal,amount_tax,shipping_amount,currency,customer_email,customer_name,shipping_name,shipping_country,shipping_address,billing_address,items,test_mode,created_at)
 values(sid,'evt_test_invoice_isolation','paid',15980,14990,2551,990,'eur','fixture@example.invalid','Testrechnung','Testempfänger','DE','{"line1":"Testweg 1","postal_code":"12345","city":"Teststadt","country":"DE"}','{"line1":"Testweg 1","postal_code":"12345","city":"Teststadt","country":"DE"}','[{"sku":"38198.02.WH1","name":"Testartikel","quantity":1,"amount_total":14990}]',true,now()-interval '1 minute') returning id into oid;
 perform public.record_secplan_progress(sid,'submitted','TEST-ROLLBACK - keine Beauftragung',true,'TEST - kein echter Bestand');
 perform public.record_secplan_progress(sid,'confirmed','TEST-ROLLBACK - simulierte Annahme');
 perform public.record_secplan_progress(sid,'shipped','TEST-ROLLBACK - kein echter Versand',false,null,true,now());
 first_invoice:=public.issue_shipped_invoice(sid);
 repeated_invoice:=public.issue_shipped_invoice(sid);
 if first_invoice->>'invoice_number' not like 'SN-TEST-%' then raise exception 'Wrong sandbox number prefix';end if;
 if first_invoice is distinct from repeated_invoice then raise exception 'Repeated invoice is not stable';end if;
 if (select count(*) from public.order_mail_jobs where order_id=oid and kind='invoice')<>1 then raise exception 'Duplicate invoice job';end if;
 select last_value into after_seq from public.sichere_nacht_invoice_seq;
 if before_seq<>after_seq then raise exception 'Real invoice sequence advanced';end if;
 if has_function_privilege('anon','public.issue_shipped_invoice(text)','EXECUTE') or has_function_privilege('authenticated','public.issue_shipped_invoice(text)','EXECUTE') then raise exception 'Public invoice access';end if;
end $$;
select 'passed: separate test number, stable replay, one invoice job, real sequence unchanged and restricted access' as regression_result;
rollback;
