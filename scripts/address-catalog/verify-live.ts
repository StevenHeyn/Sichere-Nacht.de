/** Temporary, token-authorized verification hook. Never part of the deployed portal.
 * Inject into the catalog Edge Function only for the acceptance check, then restore
 * the original function and revoke the temporary import token. No emails are sent.
 */
async function verifyLive(token:string){
 const tokenHash=await hash(new TextEncoder().encode(token));
 const permission=await admin.from('vp_address_import_tokens').select('expires_at').eq('token_hash',tokenHash).maybeSingle();
 if(!permission.data||new Date(permission.data.expires_at)<=new Date())return reply({error:'Verification authorization required'},403);
 let userId:string|undefined,newPoint:string|undefined;
 const checks:Record<string,unknown>={};
 try{
  const email=`qa-address-${crypto.randomUUID()}@example.invalid`,password=crypto.randomUUID()+crypto.randomUUID();
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true});
  if(created.error||!created.data.user)throw new Error('QA account creation failed');userId=created.data.user.id;
  const account=await admin.from('vp_accounts').upsert({user_id:userId,email,full_name:'Automatischer Karten-Funktionstest',status:'active',role:'vp',sales_passed_at:new Date().toISOString(),sales_quiz_version:'ajax-basics-v1'});
  if(account.error)throw new Error('QA partner setup failed');
  const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const login=await client.auth.signInWithPassword({email,password});if(login.error||!login.data.session)throw new Error('QA login failed');
  const cookie='sn-vp-auth=base64-'+btoa(JSON.stringify(login.data.session)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const origin='https://vp.sichere-nacht.de';
  async function call(path:string,body?:unknown){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{cookie,origin,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok)throw new Error('Portal check '+r.status+': '+String(data.error).slice(0,120));return data}
  const places=await call('/api/address-map?search=25499');if(!places.places.some((p:any)=>p.postcode==='25499'))throw new Error('Saved postcode not found');checks.postcode_search=true;
  const view=await call('/api/address-map?bbox=9.84,53.67,9.86,53.69&zoom=16');if(!view.points.length||!view.snapshot?.address_count)throw new Error('Saved map points missing');checks.map_points=view.points.length;checks.snapshot_count=view.snapshot.address_count;
  const point=view.points.find((p:any)=>!p.id);if(!point)throw new Error('No fresh catalog point in test viewport');
  const opened=await call('/api/address-map',{x:point.x,y:point.y,source_key:point.source_key});newPoint=opened.id;
  const detail=await call('/api/data?view=d2d&address='+encodeURIComponent(opened.id));
  if(detail.selectedAddress?.id!==opened.id||detail.selectedAddress?.street!==point.street||detail.contacts?.length)throw new Error('Selected address or private contact isolation failed');checks.open_address=true;checks.private_contacts_isolated=true;
 }finally{
  // A successfully opened real base address may remain; never delete user addresses.
  if(newPoint)checks.base_point_stored_without_qualification=true;
  if(userId){const a=await admin.from('vp_accounts').delete().eq('user_id',userId);if(a.error)throw new Error('QA account cleanup failed');const u=await admin.auth.admin.deleteUser(userId);if(u.error)throw new Error('QA auth cleanup failed');checks.qa_account_removed=true}
 }
 return reply({ok:true,checks});
}
