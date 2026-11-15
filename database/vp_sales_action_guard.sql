do $$declare d text;begin
 select pg_get_functiondef('public.vp_qualify_address(uuid,text,integer)'::regprocedure) into d;
 execute replace(d,'perform public.vp_require_active();','perform public.vp_require_active();if p_status not in (''no_interest'',''do_not_contact'') then perform public.vp_require_sales();end if;');
 select pg_get_functiondef('public.vp_record_permission_use(bigint,text)'::regprocedure) into d;
 execute replace(d,'perform public.vp_require_active();','perform public.vp_require_sales();');
end$$;
