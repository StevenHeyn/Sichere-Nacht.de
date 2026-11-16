import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
const url=Deno.env.get('SUPABASE_URL')!;
const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket='vp-address-catalog';
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const hash=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(n=>n.toString(16).padStart(2,'0')).join('');
async function saveFile(snapshot:string,path:string,bytes:Uint8Array,expected:string){
  if(!/^(tiles\/\d{1,4}\/\d{1,4}\.json\.gz|summary\.json\.gz|postcodes\.json\.gz|manifest\.json)$/.test(path))throw new Error('Invalid path');
  if(bytes.length>12000000)throw new Error('File too large');
  const sha=await hash(bytes);if(sha!==expected)throw new Error('Checksum mismatch');
  const existing=await admin.from('vp_address_snapshot_files').select('sha256').eq('snapshot_id',snapshot).eq('path',path).maybeSingle();
  if(existing.data&&existing.data.sha256!==sha)throw new Error('Immutable file conflict');
  const full=snapshot+'/'+path;
  const upload=existing.data?{error:null}:await admin.storage.from(bucket).upload(full,bytes,{contentType:path.endsWith('.gz')?'application/gzip':'application/json',cacheControl:'31536000',upsert:false});
  if(upload.error){
   // A retry may follow a completed upload whose metadata write was interrupted.
   const prior=await admin.storage.from(bucket).download(full);
   if(prior.error||await hash(new Uint8Array(await prior.data.arrayBuffer()))!==sha)throw new Error('Storage upload failed');
  }
  const record=await admin.from('vp_address_snapshot_files').upsert({snapshot_id:snapshot,path,sha256:sha,bytes:bytes.length},{onConflict:'snapshot_id,path',ignoreDuplicates:true});
  if(record.error)throw new Error('Snapshot receipt failed');
  const check=await admin.storage.from(bucket).download(full);
  if(check.error||await hash(new Uint8Array(await check.data.arrayBuffer()))!==sha)throw new Error('Stored file verification failed');
  return {path,sha256:sha,bytes:bytes.length};
}

Deno.serve(async req=>{try{
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)return reply({error:'Authentication required'},401);
 const query=new URL(req.url).searchParams;
 if(['upload','upload-batch'].includes(query.get('mode')||'')){
  const h=await hash(new TextEncoder().encode(token));
  const {data:grant,error}=await admin.from('vp_address_import_tokens').select('snapshot_id,expires_at').eq('token_hash',h).maybeSingle();
  if(error||!grant||new Date(grant.expires_at)<=new Date())return reply({error:'Import authorization expired or invalid'},403);
  const {data:snapshot}=await admin.from('vp_address_snapshots').select('status').eq('id',grant.snapshot_id).single();
  if(snapshot?.status!=='building')return reply({error:'Snapshot is immutable'},409);
  if(Number(req.headers.get('content-length')||0)>12000000)return reply({error:'Batch too large'},413);
  if(query.get('mode')==='upload-batch'){
   const raw=await req.text();if(raw.length>12000000)return reply({error:'Batch too large'},413);
   const input=JSON.parse(raw);if(!Array.isArray(input.files)||input.files.length<1||input.files.length>16)return reply({error:'Invalid batch'},400);
   const verified=[];
   for(let i=0;i<input.files.length;i+=4){
    const chunk=await Promise.allSettled(input.files.slice(i,i+4).map((f:any)=>saveFile(grant.snapshot_id,String(f.path),Uint8Array.from(atob(f.content),c=>c.charCodeAt(0)),String(f.sha256))));
    for(const r of chunk){if(r.status==='rejected')throw new Error('Batch file upload or verification failed');verified.push(r.value)}
   }
   return reply({ok:true,verified});
  }
  const result=await saveFile(grant.snapshot_id,query.get('path')||'',new Uint8Array(await req.arrayBuffer()),req.headers.get('x-content-sha256')||'');
  return reply({ok:true,sha256:result.sha256});
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
