import 'server-only';
import {validPartner} from './referral-consent';
export async function activePortalPartner(code:string):Promise<boolean>{
 if(!validPartner(code))return false;
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw new Error('Partnerprüfung nicht konfiguriert');
 async function read(query:string){
  const r=await fetch(new URL('/rest/v1/vp_accounts?'+query,base!),{headers:{apikey:key!,Authorization:'Bearer '+key},cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error('Partnerprüfung nicht verfügbar');return r.json();
 }
 const rows=await read(new URLSearchParams({select:'status,sales_passed_at,sales_quiz_version,agency_id',referral_code:'eq.'+code,limit:'1'}).toString());
 const p=rows[0];if(!p||p.status!=='active'||!p.sales_passed_at||p.sales_quiz_version!=='ajax-basics-v1')return false;
 if(p.agency_id){const agency=await read(new URLSearchParams({select:'status,role',user_id:'eq.'+p.agency_id,limit:'1'}).toString());return agency[0]?.status==='active'&&agency[0]?.role==='agency';}
 return true;
}
