-- Mandatory sales qualification, independent of installer approval.
create schema if not exists vp_private;
revoke all on schema vp_private from public,anon,authenticated;
create table vp_private.sales_quiz (version text primary key, questions jsonb not null);
alter table vp_private.sales_quiz enable row level security;
insert into vp_private.sales_quiz values ('ajax-basics-v1',$quiz$[{"id": 1, "prompt": "Welche Aufgabe hat der Hub?", "options": ["Er ersetzt alle Melder.", "Er verarbeitet Ereignisse und verbindet die Komponenten.", "Er ist nur eine Sirene."], "correct": 1, "explanation": "Der Hub ist die Zentrale: Er verarbeitet Meldungen und steuert die eingerichtete Reaktion."}, {"id": 2, "prompt": "Wie kommunizieren Jeweller-Funkmelder mit dem Hub?", "options": ["Jeder Melder braucht Kunden-WLAN.", "Ausschließlich über ein Netzwerkkabel.", "Über das geschützte Jeweller-Funkprotokoll."], "correct": 2, "explanation": "Jeweller ist die Funkverbindung der Geräte zum Hub; sie ist nicht das WLAN des Kunden."}, {"id": 3, "prompt": "Was erkennt ein einfacher DoorProtect?", "options": ["Das Öffnen durch Trennung von Magnet und Melder.", "Jeden Glasbruch.", "Jede Bewegung im ganzen Raum."], "correct": 0, "explanation": "Ein Öffnungsmelder überwacht das Öffnen. Andere Ereignisse benötigen passende Sensoren."}, {"id": 4, "prompt": "Was macht ein MotionProtect ohne Kamerafunktion?", "options": ["Er zeichnet dauerhaft Videos auf.", "Er erkennt Bewegung mithilfe eines Infrarotsensors.", "Er erkennt Wasser am Boden."], "correct": 1, "explanation": "Ein PIR-Bewegungsmelder erkennt Änderungen der Wärmestrahlung im Erfassungsbereich und macht keine Bilder."}, {"id": 5, "prompt": "Wozu dienen Fotos eines geeigneten MotionCam?", "options": ["Sie garantieren einen Polizeieinsatz.", "Sie ersetzen die Prüfung der Kompatibilität.", "Sie helfen, ein Alarmereignis einzuordnen."], "correct": 2, "explanation": "Fotoverifizierung unterstützt die Einordnung; Hub, Gerätevariante und Berechtigungen müssen passen."}, {"id": 6, "prompt": "Was bedeutet eine Tierimmunitätsfunktion?", "options": ["Geeignete Geräte, Montage und Einstellungen können Tierbewegungen berücksichtigen.", "Kein Tier kann jemals einen Alarm auslösen.", "Mit Haustieren darf nie eine Alarmanlage eingesetzt werden."], "correct": 0, "explanation": "Haustiere gehören in die Planung. Eine pauschale Fehlalarmfreiheit darf nicht versprochen werden."}, {"id": 7, "prompt": "Dreht LeaksProtect allein das Wasser ab?", "options": ["Ja, ohne weitere Geräte.", "Nein, dafür braucht es zusätzliche passende Technik und ein Szenario.", "Nur wenn die Einbruchmelder scharf sind."], "correct": 1, "explanation": "LeaksProtect meldet Wasser, das seine Kontakte erreicht. Eine Absperrung benötigt zusätzliche Technik."}, {"id": 8, "prompt": "Erkennt jeder FireProtect Rauch, Hitze und CO?", "options": ["Ja, alle Varianten sind identisch.", "Nur bei aktiver Einbruch-Scharfschaltung.", "Nein, die erkannten Gefahren hängen von der Variante ab."], "correct": 2, "explanation": "Die genaue Gerätebezeichnung ist entscheidend. CO bedeutet Kohlenmonoxid, nicht CO₂."}, {"id": 9, "prompt": "Was gilt bei einem Internetausfall?", "options": ["Lokale Alarmierung kann weiterarbeiten; Fernmeldungen brauchen einen verfügbaren Übertragungsweg.", "Die Anlage funktioniert garantiert unbegrenzt vollständig weiter.", "Jeder Funkmelder verliert dadurch automatisch seine Verbindung zum Hub."], "correct": 0, "explanation": "Stromversorgung und lokale Funkverbindung sind vom Weg nach außen zu unterscheiden. Backup muss passend eingerichtet sein."}, {"id": 10, "prompt": "Was darfst du zum Alarmfall zusagen?", "options": ["Die Polizei kommt bei jedem Alarm automatisch.", "Empfänger und Reaktion werden konkret eingerichtet bzw. vereinbart.", "Eine Meldung verhindert jeden Einbruch."], "correct": 1, "explanation": "Benachrichtigung ist keine Intervention. Einen Sicherheitsdiensteinsatz nur als tatsächlich vereinbarte Leistung zusagen."}]$quiz$::jsonb);
alter table public.vp_accounts add column sales_passed_at timestamptz, add column sales_quiz_version text;
create table public.vp_sales_quiz_attempts(id uuid primary key default gen_random_uuid(), user_id uuid not null references public.vp_accounts(user_id), version text not null, score integer not null check(score between 0 and 10), passed boolean not null, created_at timestamptz not null default now());
alter table public.vp_sales_quiz_attempts enable row level security;
revoke all on public.vp_sales_quiz_attempts from public,anon,authenticated;
grant select on public.vp_sales_quiz_attempts to authenticated;
create policy own_quiz_attempts on public.vp_sales_quiz_attempts for select to authenticated using(user_id=auth.uid() or public.vp_is_admin());
create index vp_quiz_attempts_user_time on public.vp_sales_quiz_attempts(user_id,created_at desc);
create function public.vp_sales_quiz_questions() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform public.vp_require_active();
 return (select jsonb_agg(q-'correct'-'explanation' order by (q->>'id')::int) from vp_private.sales_quiz v cross join lateral jsonb_array_elements(v.questions) q where v.version='ajax-basics-v1');
end$$;
create function public.vp_submit_sales_quiz(p_answers jsonb,p_version text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.vp_accounts%rowtype; q jsonb; qs jsonb; score integer:=0; feedback jsonb:='[]'::jsonb; ok boolean; passed_at timestamptz;
begin
 perform public.vp_require_active();
 select * into a from public.vp_accounts where user_id=auth.uid() for update;
 if p_version is distinct from 'ajax-basics-v1' then raise exception 'Testversion geändert. Bitte neu laden.';end if;
 if a.sales_passed_at is not null and a.sales_quiz_version=p_version then return jsonb_build_object('passed',true,'alreadyPassed',true,'passedAt',a.sales_passed_at);end if;
 if jsonb_typeof(p_answers) is distinct from 'array' then raise exception 'Bitte alle zehn Fragen beantworten.';end if;
 if jsonb_array_length(p_answers)<>10 or exists(select 1 from jsonb_array_elements(p_answers) x where jsonb_typeof(x)<>'number' or x::text not in ('0','1','2')) then raise exception 'Für jede Frage genau eine gültige Antwort wählen.';end if;
 if exists(select 1 from public.vp_sales_quiz_attempts where user_id=a.user_id and created_at>clock_timestamp()-interval '5 seconds') then raise exception 'Bitte fünf Sekunden bis zum nächsten Versuch warten.';end if;
 select questions into qs from vp_private.sales_quiz where version=p_version;
 for q in select value from jsonb_array_elements(qs) loop
  ok=(p_answers->>((q->>'id')::int-1))::int=(q->>'correct')::int;
  if ok then score=score+1;end if;
  feedback=feedback||jsonb_build_array(jsonb_build_object('id',q->'id','correct',ok,'explanation',q->>'explanation'));
 end loop;
 insert into public.vp_sales_quiz_attempts(user_id,version,score,passed) values(a.user_id,p_version,score,score>=8);
 if score>=8 then
  passed_at=clock_timestamp();
  update public.vp_accounts set sales_passed_at=passed_at,sales_quiz_version=p_version where user_id=a.user_id;
  insert into public.vp_audit(actor,event,target,details) values(a.user_id,'sales_quiz_passed',a.user_id::text,jsonb_build_object('version',p_version,'score',score));
 end if;
 return jsonb_build_object('passed',score>=8,'score',score,'total',10,'required',8,'feedback',feedback,'passedAt',passed_at);
end$$;
create function public.vp_require_sales() returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.vp_require_active();
 if not public.vp_is_admin() and not exists(select 1 from public.vp_accounts where user_id=auth.uid() and sales_passed_at is not null and sales_quiz_version='ajax-basics-v1') then raise exception 'Bitte zuerst den Grundlagen-Test in der Akademie bestehen.' using errcode='42501';end if;
end$$;
revoke all on function public.vp_sales_quiz_questions(),public.vp_submit_sales_quiz(jsonb,text),public.vp_require_sales() from public,anon,authenticated;
grant execute on function public.vp_sales_quiz_questions(),public.vp_submit_sales_quiz(jsonb,text),public.vp_require_sales() to authenticated;
-- Snapshot at first receipt: later passing or webhook retries cannot award old unqualified sales.
-- Existing orders retain NULL and existing earnings remain intact.
alter table public.orders add column vp_sales_qualified boolean;
create function vp_private.snapshot_sales_qualification() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then new.vp_sales_qualified=old.vp_sales_qualified;return new;end if;
 new.vp_sales_qualified=exists(select 1 from public.vp_accounts a where a.referral_code=new.vp_id and a.status='active' and a.sales_passed_at is not null and a.sales_passed_at<=new.created_at and a.sales_quiz_version='ajax-basics-v1' and (a.agency_id is null or exists(select 1 from public.vp_accounts agency where agency.user_id=a.agency_id and agency.status='active')));
 return new;
end$$;
revoke all on function vp_private.snapshot_sales_qualification() from public,anon,authenticated;
create trigger vp_sales_qualification before insert or update on public.orders for each row execute function vp_private.snapshot_sales_qualification();
-- Add the guard to current definitions, preserving already-deployed business rules.
do $guard$
declare f record; definition text;
begin
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('vp_create_address','vp_select_territory','vp_claim_territory','vp_claim_address','vp_save_contact') loop
  definition=pg_get_functiondef(f.oid);
  if position('perform public.vp_require_active();' in definition)=0 then raise exception 'Expected guard missing in %',f.proname;end if;
  execute replace(definition,'perform public.vp_require_active();','perform public.vp_require_sales();');
 end loop;
 select pg_get_functiondef('public.vp_capture_earning()'::regprocedure) into definition;
 if position('if new.test_mode' in definition)=0 then raise exception 'Expected earnings guard missing';end if;
 execute replace(definition,'if new.test_mode','if new.vp_sales_qualified is false or new.test_mode');
end$guard$;
notify pgrst,'reload schema';
