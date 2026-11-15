import 'server-only';
/** Uses the shop's existing server-only connection; never grants the portal service-role access. */
export async function activePortalPartner(code:string):Promise<boolean>{
 if(!/^VP-[A-Z0-9]{3,16}$/.test(code))return false;
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)return false;
 try{const url=new URL('/rest/v1/vp_accounts',base);url.searchParams.set('select','user_id,role,status,agency_id');url.searchParams.set('referral_code','eq.'+code);url.searchParams.set('limit','1');const r=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store',signal:AbortSignal.timeout(5000)});if(!r.ok)return false;const list=await r.json();const p=list[0];if(!p||p.status!=='active'||!['vp','agency'].includes(p.role))return false;if(!p.agency_id)return true;const a=new URL('/rest/v1/vp_accounts',base);a.searchParams.set('select','role,status');a.searchParams.set('user_id','eq.'+p.agency_id);a.searchParams.set('limit','1');const response=await fetch(a,{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store',signal:AbortSignal.timeout(5000)});if(!response.ok)return false;const agency=(await response.json())[0];return agency?.role==='agency'&&agency.status==='active';}catch{return false}
}
