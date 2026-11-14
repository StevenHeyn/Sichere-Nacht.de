import 'server-only';
import {buildSecplanDraft,type SupplierDraftOrder} from './secplan-draft';
async function db(path:string,init:RequestInit={}) {
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Datenbank nicht eingerichtet.');
 const response=await fetch(new URL('/rest/v1/'+path,url),{...init,headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json',...init.headers},cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!response.ok){
  const data=await response.json().catch(()=>null);
  // Only controlled database validation errors, never credentials or full rows.
  if(data?.code==='P0001'&&typeof data.message==='string')throw new Error(data.message.slice(0,300));
  throw new Error('Lieferantenstatus nicht verfügbar (HTTP '+response.status+').');
 }
 return response.json();
}
export async function secplanDraft(sessionId:string) {
 const fields='id,status,test_mode,shipping_name,shipping_country,shipping_address,items';
 const rows=await db('orders?select='+fields+'&stripe_session_id=eq.'+encodeURIComponent(sessionId)+'&limit=1') as SupplierDraftOrder[];
 if(!rows[0])throw new Error('Bestellung nicht gefunden.');
 return buildSecplanDraft(rows[0]);
}
export async function secplanProgress(sessionId:string,body:Record<string,unknown>) {
 return db('rpc/record_secplan_progress',{method:'POST',body:JSON.stringify({
  p_session_id:sessionId,p_action:body.action,p_reference:body.reference,
  p_stock_confirmed:body.stockConfirmed===true,p_stock_evidence:body.stockEvidence||null,
  p_complete:body.complete===true,p_dispatched_at:body.dispatchedAt||null,
  p_carrier:body.carrier||null,p_tracking:body.tracking||null
 })});
}
