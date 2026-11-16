-- Extend the existing authenticated order boundary with immutable garment sizes.
-- No browser-supplied price is accepted. The old three-argument API stays compatible.
create or replace function public.vp_merch_checkout_order(p_product text,p_quantity integer,p_request_key uuid,p_sizes jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare me public.vp_accounts%rowtype;p public.vp_merch_products%rowtype;o public.vp_merch_orders%rowtype;
 offer jsonb;n integer;k text;sizes jsonb:='{}'::jsonb;size_label text;unit_label text:=' Stück';
begin
 perform public.vp_require_active();
 if p_request_key is null or p_quantity is null then raise exception 'Paket fehlt';end if;
 if p_product='strauss-workwear-set' then
  if p_quantity<>1 then raise exception 'Bitte ein einzelnes Komplettset auswählen';end if;
  if jsonb_typeof(p_sizes) is distinct from 'object' then raise exception 'Konfektionsgrößen fehlen';end if;
  foreach k in array array['winter','softshell','polos','sweatshirt'] loop
   if coalesce(p_sizes->>k,'') not in ('XS','S','M','L','XL','XXL','3XL','4XL') then raise exception 'Bitte alle vier Konfektionsgrößen auswählen';end if;
   sizes:=sizes||jsonb_build_object(k,p_sizes->>k);
  end loop;
  if sizes<>p_sizes then raise exception 'Ungültige Größenangaben';end if;
  unit_label:=' Set';
  size_label:='Winterjacke: '||(sizes->>'winter')||' · Softshell: '||(sizes->>'softshell')||' · 3 Polos: '||(sizes->>'polos')||' · Pullover: '||(sizes->>'sweatshirt');
 end if;
 select * into me from public.vp_accounts where user_id=auth.uid() for update;
 select * into o from public.vp_merch_orders where user_id=auth.uid() and checkout_request_key=p_request_key;
 if found then
  if o.product_id<>p_product or o.quantity<>p_quantity or coalesce(o.personalization->'sizes','{}'::jsonb)<>sizes then raise exception 'Bestellanfrage wurde verändert';end if;
  return o.id;
 end if;
 select * into p from public.vp_merch_products where id=p_product and active;
 if not found then raise exception 'Werbemittel nicht verfügbar';end if;
 select x into offer from jsonb_array_elements(p.price_options) x where (x->>'quantity')::integer=p_quantity;
 if offer is null or coalesce((offer->>'total_cents')::integer,0)<1 then raise exception 'Für diese Menge bitte ein Angebot anfragen';end if;
 select count(*) into n from public.vp_merch_orders where user_id=auth.uid() and created_at>now()-interval '1 day';
 if n>=20 then raise exception 'Anfragelimit erreicht';end if;
 insert into public.vp_merch_orders(user_id,product_id,quantity,size,referral_url,status,quote_total_cents,quote_description,quote_version,quoted_at,payment_status,checkout_request_key,personalization)
 values(auth.uid(),p.id,p_quantity,coalesce(size_label,me.clothing_size),'https://sichere-nacht.de/?vp='||me.referral_code,'quoted',(offer->>'total_cents')::integer,
 p_quantity||unit_label||' · '||p.title||E'\n'||p.description||case when size_label is not null then E'\n'||size_label else '' end,
 1,now(),'pending',p_request_key,
 jsonb_build_object('name',me.full_name,'company',me.company,'email',me.email,'phone',me.phone,'referral_url','https://sichere-nacht.de/?vp='||me.referral_code,'print_approval','required','sizes',sizes,'product_title',p.title,'kind',p.kind,'net_cents',(offer->>'net_cents')::integer)) returning id into o.id;
 return o.id;
end $$;
revoke all on function public.vp_merch_checkout_order(text,integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.vp_merch_checkout_order(text,integer,uuid,jsonb) to authenticated;
create or replace function public.vp_merch_checkout_order(p_product text,p_quantity integer,p_request_key uuid)
returns uuid language sql security invoker set search_path=public,pg_temp as $$
 select public.vp_merch_checkout_order(p_product,p_quantity,p_request_key,'{}'::jsonb);
$$;
