-- Server-only atomic counters shared by all deployment instances.
create table public.shop_request_limits (
 bucket_key text primary key check(length(bucket_key)=64),
 hits integer not null check(hits>0),
 expires_at timestamptz not null
);
create index shop_request_limits_expiry on public.shop_request_limits(expires_at);
alter table public.shop_request_limits enable row level security;
revoke all on public.shop_request_limits from public,anon,authenticated;
create function public.shop_take_request_slot(p_key text,p_limit integer,p_seconds integer)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.shop_request_limits%rowtype; t timestamptz:=clock_timestamp();
begin
 if p_key is null or p_key !~ '^[a-f0-9]{64}$' or p_limit is null or p_limit not between 1 and 1000 or p_seconds is null or p_seconds not between 1 and 3600 then raise exception 'Invalid limit'; end if;
 delete from public.shop_request_limits where bucket_key in (select bucket_key from public.shop_request_limits where expires_at<t limit 100);
 insert into public.shop_request_limits(bucket_key,hits,expires_at) values(p_key,1,t+make_interval(secs=>p_seconds))
 on conflict(bucket_key) do update set
 hits=case when shop_request_limits.expires_at<=t then 1 else least(shop_request_limits.hits+1,p_limit+1) end,
 expires_at=case when shop_request_limits.expires_at<=t then t+make_interval(secs=>p_seconds) else shop_request_limits.expires_at end
 returning * into r;
 return jsonb_build_object('allowed',r.hits<=p_limit,'retry_after',greatest(1,ceil(extract(epoch from r.expires_at-t))::integer));
end $$;
revoke all on function public.shop_take_request_slot(text,integer,integer) from public,anon,authenticated;
grant execute on function public.shop_take_request_slot(text,integer,integer) to service_role;
