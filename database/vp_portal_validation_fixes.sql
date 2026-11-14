-- Correct validation after regression testing. Definitions must match before a targeted edit.
do $$declare s text;old text;begin
 s=pg_get_functiondef('public.vp_submit_application(jsonb,uuid,text)'::regprocedure);
 old='array[''full_name'',''street'',''postal_code'',''city'',''phone'',''clothing_size'']';
 if position(old in s)=0 then raise exception 'Application validation marker missing';end if;
 s=replace(s,old,'array[''full_name'',''street'',''postal_code'',''city'',''phone'']');
 old='if coalesce(p_profile->>''country'',''DE'')<>''DE''';
 if position(old in s)=0 then raise exception 'Application country marker missing';end if;
 s=replace(s,old,'if p_profile->>''clothing_size'' is null or p_profile->>''clothing_size'' not in (''XS'',''S'',''M'',''L'',''XL'',''XXL'',''3XL'',''4XL'',''Sondergröße'') then raise exception ''Konfektionsgröße prüfen'';end if; if p_profile->>''termsAccepted'' is distinct from ''true'' then raise exception ''Ausdrückliche Vertragsannahme erforderlich'';end if; '||old);
 s=replace(s,'inv.accepted_by is not null','(inv.accepted_by is not null and inv.accepted_by<>auth.uid())');execute s;
 s=pg_get_functiondef('public.vp_admin_account(uuid,text,text)'::regprocedure);
 s=replace(s,'exists(select 1 from public.vp_term_acceptances where user_id=p_user)','exists(select 1 from public.vp_term_acceptances a join public.vp_terms t on t.id=a.terms_id where a.user_id=p_user and t.status=''published'' and a.content_hash=t.content_hash)');execute s;
 s=pg_get_functiondef('public.vp_reconcile_earning(uuid,text,integer,text)'::regprocedure);
 old='rd=-least(r.balance_cents,round(abs(edelta)*0.05)::integer);';if position(old in s)=0 then raise exception 'Reserve correction marker missing';end if;
 s=replace(s,old,'rd=-least(r.balance_cents,greatest(0,coalesce((select sum(l.reserve_delta_cents) from public.vp_finance_lines l where l.earning_id=e.id),0))::integer,round(abs(edelta)*0.05)::integer);');execute s;
 s=pg_get_functiondef('public.vp_reserve_release(uuid,text)'::regprocedure);s=replace(s,'if r.balance_cents<=0','if r.earner_id is null or r.balance_cents<=0');execute s;
 s=pg_get_functiondef('public.vp_bootstrap_admin(text)'::regprocedure);s=replace(s,'auth.role()<>''service_role''','auth.role() is distinct from ''service_role''');execute s;
end$$;
-- Keep existing privilege grants: CREATE OR REPLACE does not broaden them.
