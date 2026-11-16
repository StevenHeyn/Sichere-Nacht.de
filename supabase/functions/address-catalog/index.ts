import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
const url=Deno.env.get('SUPABASE_URL')!;
const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket='vp-address-catalog';
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const hash=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(n=>n.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{try{
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)return reply({error:'Authentication required'},401);
 const query=new URL(req.url).searchParams;
 if(query.get('mode')==='upload'){
  const h=await hash(new TextEncoder().encode(token));
  const {data:grant,error}=await admin.from('vp_address_import_tokens').select('snapshot_id,expires_at').eq('token_hash',h).maybeSingle();
  if(error||!grant||new Date(grant.expires_at)<=new Date())return reply({error:'Import authorization expired or invalid'},403);
  const {data:snapshot}=await admin.from('vp_address_snapshots').select('status').eq('id',grant.snapshot_id).single();
  if(snapshot?.status!=='building')return reply({error:'Snapshot is immutable'},409);
  const path=query.get('path')||'';
  if(!/^(tiles\/\d{1,4}\/\d{1,4}\.json\.gz|summary\.json\.gz|postcodes\.json\.gz|manifest\.json)$/.test(path))return reply({error:'Invalid path'},400);
  if(Number(req.headers.get('content-length')||0)>12000000)return reply({error:'File too large'},413);
  const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length>12000000)return reply({error:'File too large'},413);
  const sha=await hash(bytes);if(sha!==req.headers.get('x-content-sha256'))return reply({error:'Checksum mismatch'},400);
  const existing=await admin.from('vp_address_snapshot_files').select('sha256').eq('snapshot_id',grant.snapshot_id).eq('path',path).maybeSingle();
  if(existing.data)return existing.data.sha256===sha?reply({ok:true,sha256:sha,reused:true}):reply({error:'Immutable file conflict'},409);
  const full=grant.snapshot_id+'/'+path;
  const upload=await admin.storage.from(bucket).upload(full,bytes,{contentType:path.endsWith('.gz')?'application/gzip':'application/json',cacheControl:'31536000',upsert:false});
  if(upload.error){
   // A retry may follow a completed upload whose metadata write was interrupted.
   const prior=await admin.storage.from(bucket).download(full);
   if(prior.error||await hash(new Uint8Array(await prior.data.arrayBuffer()))!==sha)throw new Error('Storage upload failed');
  }
  const record=await admin.from('vp_address_snapshot_files').upsert({snapshot_id:grant.snapshot_id,path,sha256:sha,bytes:bytes.length},{onConflict:'snapshot_id,path',ignoreDuplicates:true});
  if(record.error)throw new Error('Snapshot receipt failed');
  return reply({ok:true,sha256:sha});
 }
 const {data:auth,error:authError}=await admin.auth.getUser(token);
 if(authError||!auth.user)return reply({error:'Anmeldung erforderlich'},401);
 const userDb=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false}});
 const permitted=await userDb.rpc('vp_require_sales');
 const settings=await admin.from('vp_settings').select('d2d_open').single();
 if(permitted.error||!settings.data?.d2d_open)return reply({error:'Aktiver, freigegebener Vertriebspartnerzugang erforderlich'},403);
 const input=await req.json();
 if(!Number.isInteger(input.x)||!Number.isInteger(input.y)||input.x<0||input.x>4095||input.y<0||input.y>4095||!/^osm:(node|way|relation):\d+$/.test(input.key))return reply({error:'Ungültiger Adresspunkt'},400);
 const {data:snapshot}=await admin.from('vp_address_snapshots').select('id').eq('active',true).single();
 if(!snapshot)return reply({error:'Adressbestand noch nicht verfügbar'},503);
 const file=await admin.storage.from(bucket).download(`${snapshot.id}/tiles/${input.x}/${input.y}.json.gz`);
 if(file.error)return reply({error:'Adresspunkt nicht im gespeicherten Bestand'},404);
 const text=await new Response(file.data.stream().pipeThrough(new DecompressionStream('gzip'))).text();
 const row=JSON.parse(text).find((r:unknown[])=>r[0]===input.key);
 if(!row)return reply({error:'Adresspunkt nicht gefunden'},404);
 const saved=await admin.rpc('vp_catalog_materialize',{p_row:row});
 if(saved.error)throw new Error('Adresspunkt konnte nicht geöffnet werden');
 return reply({id:saved.data});
}catch(e){console.error(e instanceof Error?e.message:'catalog error');return reply({error:e instanceof Error?e.message:'Katalogfehler'},500)}});
