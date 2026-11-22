import 'server-only';
import {NextResponse} from 'next/server';
import {secplanDraft,secplanProgress} from '../../../../lib/secplan-fulfillment';
import {markShipped,dispatchOrderMail} from '../../../../lib/order-notifications';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'cache-control':'no-store','referrer-policy':'no-referrer'};
const respond=(status:number,error:string)=>NextResponse.json({error},{status,headers});
const allowed=new Set(['processing','draft','submitted','confirmed','shipped','retry_invoice']);
async function supabase(path:string,method='GET',payload?:Record<string,unknown>,userToken?:string){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Bestellsystem nicht eingerichtet.');
 const res=await fetch(new URL(path,url),{method,headers:{apikey:key,Authorization:'Bearer '+(userToken||key),'content-type':'application/json'},body:payload?JSON.stringify(payload):undefined,cache:'no-store',signal:AbortSignal.timeout(12000)});
 const data=await res.json().catch(()=>null);
 if(!res.ok)throw new Error(method==='GET'?'Bestelldaten konnten nicht geprüft werden.':'Status konnte nicht gespeichert werden.');
 return data;
}
export async function POST(request:Request){
 // This endpoint is a server-to-server bridge. It never accepts browser requests directly.
 if(request.headers.get('origin'))return respond(403,'Nur serverseitige Portalaktionen erlaubt.');
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return respond(415,'JSON erforderlich.');
 if(Number(request.headers.get('content-length')||0)>4096)return respond(413,'Anfrage zu groß.');
 const bearer=request.headers.get('authorization')||'';
 if(!bearer.startsWith('Bearer ')||bearer.length>4096)return respond(401,'Nicht autorisiert.');
 const raw=await request.text();if(raw.length>4096)return respond(413,'Anfrage zu groß.');
 let body:Record<string,unknown>;
 try{body=JSON.parse(raw)}catch{return respond(400,'Ungültige Anfrage.');}
 const action=String(body?.action||''),sessionId=body?.sessionId;
 if(!allowed.has(action)||typeof sessionId!=='string'||!/^cs_live_[A-Za-z0-9]+$/.test(sessionId))return respond(400,'Aktion oder echte Bestellreferenz ungültig.');
 try{
  const token=bearer.slice(7);
  const auth=await supabase('/auth/v1/user','GET',undefined,token);
  const userId=String(auth?.id||'');
  if(!/^[0-9a-f-]{36}$/i.test(userId)||!auth.email_confirmed_at)return respond(403,'Bestätigte Anmeldung erforderlich.');
  const accounts=await supabase('/rest/v1/vp_accounts?select=user_id,role,status&user_id=eq.'+encodeURIComponent(userId)+'&limit=1');
  if(accounts?.[0]?.role!=='admin'||accounts?.[0]?.status!=='active')return respond(403,'Aktive Administration erforderlich.');
  const rows=await supabase('/rest/v1/orders?select=id,status,test_mode,shipping_country,shipped_at&stripe_session_id=eq.'+encodeURIComponent(sessionId)+'&limit=1');
  const order=rows?.[0];
  if(!order||order.test_mode!==false||order.status!=='paid')return respond(409,'Nur echte bezahlte Bestellungen.');
  if(action==='processing'){
   const result=await supabase('/rest/v1/rpc/mark_shop_order_processing','POST',{p_session_id:sessionId,p_actor:userId});
   return NextResponse.json({result,invoiceMail:null},{headers});
  }
  if(action==='draft'){
   return NextResponse.json({draft:await secplanDraft(sessionId),sentToSupplier:false},{headers});
  }
  if(action==='retry_invoice'){
   if(!order.shipped_at)return respond(409,'Vor Rechnungsversand muss tatsächlicher Versand bestätigt sein.');
   const result=await dispatchOrderMail(sessionId,'invoice');
   return NextResponse.json({invoiceMail:result.status},{headers});
  }
  if(!['submitted','confirmed','shipped'].includes(action))return respond(400,'Unbekannte Aktion.');
  const reference=typeof body.reference==='string'?body.reference.trim():'';
  if(reference.length<3||reference.length>240||/[\x00-\x1f]/.test(reference))return respond(400,'Lieferantenbeleg fehlt.');
  for(const key of ['stockEvidence','carrier','tracking','dispatchedAt']){
   if(body[key]!==undefined&&(typeof body[key]!=='string'||(body[key] as string).length>240))return respond(400,'Eingabe prüfen.');
  }
  if(action==='shipped'&&(body.complete!==true||typeof body.dispatchedAt!=='string'||!Number.isFinite(Date.parse(body.dispatchedAt))))return respond(400,'Vollständigen tatsächlichen Versand und Datum nachweisen.');
  const supplier=await secplanProgress(sessionId,{...body,action,reference});
  let invoiceMail:string|undefined;
  if(action==='shipped'){
   const verified=await markShipped(sessionId);
   if(verified.invoice_ready){
    try{invoiceMail=(await dispatchOrderMail(sessionId,'invoice')).status}
    catch(e){invoiceMail='failed';console.error('VP_ADMIN_INVOICE_DISPATCH_FAILED',{order:'redacted',reason:e instanceof Error?e.message:'unknown'});}
   }else invoiceMail='blocked_tax_review';
  }
  return NextResponse.json({supplier,invoiceMail,sentToSupplier:false},{headers});
 }catch(e){
  // Do not include raw Supabase/Auth error details or any secrets in the response.
  console.error('VP_ADMIN_FULFILLMENT_FAILED',{action,reason:e instanceof Error?e.message:'unknown'});
  return respond(409,e instanceof Error&&/^(Bestell|Nur echte|Rechnungs|Zuerst|SECPLAN|Vollständiger|Unzulässiger|Tatsächliches|Lieferempfänger)/.test(e.message)?e.message:'Die Aktion konnte nicht bestätigt werden. Bitte Bestellstatus und Belege prüfen.');
 }
}
