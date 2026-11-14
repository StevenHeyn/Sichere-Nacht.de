create table public.vp_courses(id uuid primary key default gen_random_uuid(),title text not null,body text not null,masterclass boolean not null default false,published boolean not null default false,created_at timestamptz not null default now());
create table public.vp_training_slots(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.vp_courses(id),starts_at timestamptz not null,ends_at timestamptz not null,location text not null,capacity integer not null check(capacity between 1 and 500),cancelled boolean not null default false,check(ends_at>starts_at));
create table public.vp_training_bookings(slot_id uuid not null references public.vp_training_slots(id),user_id uuid not null references public.vp_accounts(user_id),status text not null default 'booked' check(status in ('booked','cancelled','attended','passed','failed')),booked_at timestamptz not null default now(),graded_at timestamptz,graded_by uuid references public.vp_accounts(user_id),primary key(slot_id,user_id));
create function public.vp_book_training(p_slot uuid,p_cancel boolean default false) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare s public.vp_training_slots%rowtype;n integer;
 begin perform public.vp_require_active();select * into s from public.vp_training_slots where id=p_slot for update;
 if not found or s.cancelled or s.starts_at<=now() or not exists(select 1 from public.vp_courses where id=s.course_id and published) then raise exception 'Termin ist nicht buchbar';end if;
 if p_cancel then update public.vp_training_bookings set status='cancelled' where slot_id=p_slot and user_id=auth.uid() and status='booked';return;end if;
 if exists(select 1 from public.vp_training_bookings where slot_id=p_slot and user_id=auth.uid() and status='booked') then return;end if;
 select count(*) into n from public.vp_training_bookings where slot_id=p_slot and status<>'cancelled';if n>=s.capacity then raise exception 'Termin ist ausgebucht';end if;
 insert into public.vp_training_bookings(slot_id,user_id,status) values(p_slot,auth.uid(),'booked') on conflict(slot_id,user_id) do update set status='booked',booked_at=now();
 end $$;
create function public.vp_training_availability() returns table(id uuid,course_id uuid,title text,masterclass boolean,starts_at timestamptz,ends_at timestamptz,location text,capacity integer,booked bigint) language sql stable security definer set search_path=public,pg_temp as $$
 select s.id,c.id,c.title,c.masterclass,s.starts_at,s.ends_at,s.location,s.capacity,count(b.user_id) filter(where b.status<>'cancelled') from public.vp_training_slots s join public.vp_courses c on c.id=s.course_id left join public.vp_training_bookings b on b.slot_id=s.id where public.vp_is_active() and not s.cancelled and c.published group by s.id,c.id $$;
create function public.vp_request_installer() returns void language plpgsql security definer set search_path=public,pg_temp as $$begin perform public.vp_require_active();update public.vp_accounts set installer_requested_at=coalesce(installer_requested_at,now()) where user_id=auth.uid();end$$;
create function public.vp_admin_learning(p_action text,p_data jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
 declare i uuid;u uuid;
 begin perform public.vp_require_admin();
 if p_action='course' then
 if length(p_data->>'title')<5 or length(p_data->>'body')<30 then raise exception 'Titel und Schulungsinhalt erforderlich';end if;
 insert into public.vp_courses(title,body,masterclass,published) values(left(p_data->>'title',200),left(p_data->>'body',100000),coalesce((p_data->>'masterclass')::boolean,false),coalesce((p_data->>'published')::boolean,false)) returning id into i;
 elsif p_action='slot' then
 insert into public.vp_training_slots(course_id,starts_at,ends_at,location,capacity) values((p_data->>'course_id')::uuid,(p_data->>'starts_at')::timestamptz,(p_data->>'ends_at')::timestamptz,left(p_data->>'location',500),(p_data->>'capacity')::integer) returning id into i;
 elsif p_action='grade' then
 u=(p_data->>'user_id')::uuid;i=(p_data->>'slot_id')::uuid;
 if not exists(select 1 from public.vp_training_slots where id=i and ends_at<=now()) then raise exception 'Schulung noch nicht abgeschlossen';end if;
 if p_data->>'status' not in ('attended','passed','failed') then raise exception 'Prüfergebnis erforderlich';end if;
 update public.vp_training_bookings set status=p_data->>'status',graded_at=now(),graded_by=auth.uid() where user_id=u and slot_id=i and status<>'cancelled';if not found then raise exception 'Keine gültige Buchung vorhanden';end if;
 elsif p_action='approve_installer' then
 u=(p_data->>'user_id')::uuid;
 if not exists(select 1 from public.vp_accounts where user_id=u and status='active' and installer_requested_at is not null) or not exists(select 1 from public.vp_training_bookings b join public.vp_training_slots s on s.id=b.slot_id join public.vp_courses c on c.id=s.course_id where b.user_id=u and b.status='passed' and c.masterclass and b.graded_at is not null) then raise exception 'Monteur-Antrag und bestandene Masterclass erforderlich';end if;
 update public.vp_accounts set installer_approved_at=now() where user_id=u;i=u;
 else raise exception 'Unbekannte Schulungsaktion';end if;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'learning_'||p_action,i::text);return i;
 end$$;
create table public.vp_merch_products(id text primary key,title text not null,description text not null,kind text not null check(kind in ('flyer','card','clothing')),active boolean not null default true);
insert into public.vp_merch_products values('qr-flyer','QR-Flyer','Personalisierter Flyer mit deinem eigenen Empfehlungslink. Druckfreigabe und Angebot vor Produktion.','flyer',true),('business-card','Visitenkarten','Eigene Kontaktdaten und Empfehlungs-QR. Kein Druckauftrag ohne Preis- und Layoutfreigabe.','card',true),('team-clothing','Partnerkleidung','Kleidung in deiner hinterlegten Konfektionsgröße. Modell, Farbe und Preis werden im Angebot bestätigt.','clothing',true);
create table public.vp_merch_orders(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.vp_accounts(user_id),product_id text not null references public.vp_merch_products(id),quantity integer not null check(quantity between 1 and 10000),size text,referral_url text not null,status text not null default 'requested' check(status in ('requested','quoted','accepted','fulfilled','cancelled')),quote_total_cents integer check(quote_total_cents>0),quote_description text,quote_version integer not null default 0,accepted_quote_version integer,created_at timestamptz not null default now(),quoted_at timestamptz,accepted_at timestamptz);
create function public.vp_merch_request(p_product text,p_quantity integer) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$declare me public.vp_accounts%rowtype;i uuid;begin
 perform public.vp_require_active();select * into me from public.vp_accounts where user_id=auth.uid();if not exists(select 1 from public.vp_merch_products where id=p_product and active) then raise exception 'Werbemittel nicht verfügbar';end if;
 if (select count(*) from public.vp_merch_orders where user_id=auth.uid() and created_at>now()-interval '1 day')>=20 then raise exception 'Anfragelimit erreicht';end if;
 insert into public.vp_merch_orders(user_id,product_id,quantity,size,referral_url) values(auth.uid(),p_product,p_quantity,me.clothing_size,'https://sichere-nacht.de/?vp='||me.referral_code) returning id into i;return i;end$$;
create function public.vp_merch_accept(p_id uuid,p_version integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_active();update public.vp_merch_orders set status='accepted',accepted_quote_version=p_version,accepted_at=now() where id=p_id and user_id=auth.uid() and status='quoted' and quote_total_cents>0 and quote_version=p_version;
 if not found then raise exception 'Angebot verändert oder nicht verfügbar';end if;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'merch_quote_accepted',p_id::text);end$$;
create function public.vp_admin_merch(p_id uuid,p_total integer,p_description text) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform public.vp_require_admin();if p_total<1 or length(p_description)<20 then raise exception 'Gesamtbruttopreis inklusive Versand und konkrete Spezifikation erforderlich';end if;
 update public.vp_merch_orders set status='quoted',quote_total_cents=p_total,quote_description=left(p_description,5000),quote_version=quote_version+1,quoted_at=now() where id=p_id and status in ('requested','quoted');if not found then raise exception 'Anfrage nicht mehr änderbar';end if;
 insert into public.vp_audit(actor,event,target) values(auth.uid(),'merch_quote',p_id::text);end$$;
alter table public.vp_courses enable row level security;alter table public.vp_training_slots enable row level security;alter table public.vp_training_bookings enable row level security;alter table public.vp_merch_products enable row level security;alter table public.vp_merch_orders enable row level security;
revoke all on public.vp_courses,public.vp_training_slots,public.vp_training_bookings,public.vp_merch_products,public.vp_merch_orders from public,anon,authenticated;
grant select on public.vp_courses,public.vp_training_slots,public.vp_training_bookings,public.vp_merch_products,public.vp_merch_orders to authenticated;
create policy vp_courses_read on public.vp_courses for select to authenticated using((published and public.vp_is_active()) or public.vp_is_admin());
create policy vp_slots_read on public.vp_training_slots for select to authenticated using(public.vp_is_active());
create policy vp_bookings_read on public.vp_training_bookings for select to authenticated using((user_id=auth.uid() and public.vp_is_active()) or public.vp_is_admin());
create policy vp_merch_products_read on public.vp_merch_products for select to authenticated using(public.vp_is_active());
create policy vp_merch_orders_read on public.vp_merch_orders for select to authenticated using((user_id=auth.uid() and public.vp_is_active()) or public.vp_is_admin());
revoke all on function public.vp_book_training(uuid,boolean),public.vp_training_availability(),public.vp_request_installer(),public.vp_admin_learning(text,jsonb),public.vp_merch_request(text,integer),public.vp_merch_accept(uuid,integer),public.vp_admin_merch(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.vp_book_training(uuid,boolean),public.vp_training_availability(),public.vp_request_installer(),public.vp_admin_learning(text,jsonb),public.vp_merch_request(text,integer),public.vp_merch_accept(uuid,integer),public.vp_admin_merch(uuid,integer,text) to authenticated;
