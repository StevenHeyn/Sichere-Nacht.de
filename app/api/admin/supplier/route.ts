import {createHash,timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {secplanDraft,secplanProgress} from '../../../../lib/secplan-fulfillment';
import {dispatchOrderMail,markShipped} from '../../../../lib/order-notifications';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'cache-control':'no-store','referrer-policy':'no-referrer'};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers});
export async function POST(request:Request){
 const expected=process.env.ORDERS_ADMIN_TOKEN,auth=request.headers.get('authorization')||'';
 if(!expected||!auth.startsWith('Bearer ')||auth.length>4096||!timingSafeEqual(createHash('sha256').update(expected).digest(),createHash('sha256').update(auth.slice(7)).digest()))return fail('Nicht autorisiert.',401);
 const allowed=new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://sichere-nacht.de').origin;
 const origin=request.headers.get('origin');
 if(origin!==allowed&&!(allowed==='https://sichere-nacht.de'&&origin==='https://www.sichere-nacht.de'))return fail('Bitte die zugehörige Bestellverwaltung verwenden.',403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return fail('JSON erforderlich.',415);
 if(Number(request.headers.get('content-length')||0)>4096)return fail('Anfrage zu groß.',413);
 const raw=await request.text();if(raw.length>4096)return fail('Anfrage zu groß.',413);
 let body:Record<string,unknown>;try{body=JSON.parse(raw)}catch{return fail('Ungültiges JSON.',400)}
 if(!body||typeof body!=='object'||typeof body.sessionId!=='string'||!/^cs_(?:live|test)_[A-Za-z0-9]+$/.test(body.sessionId))return fail('Ungültige Bestellreferenz.',400);
 if(!['draft','submitted','confirmed','shipped'].includes(String(body.action)))return fail('Unbekannte Lieferantenaktion.',400);
 for(const name of ['reference','stockEvidence','dispatchedAt','carrier','tracking']){
  if(body[name]!==undefined&&(typeof body[name]!=='string'||(body[name] as string).length>240))return fail('Angaben zu '+name+' prüfen.',400);
 }
 try{
  if(body.action==='draft')return NextResponse.json({draft:await secplanDraft(body.sessionId),sent:false},{headers});
  const supplier=await secplanProgress(body.sessionId,body);
  let invoiceMail:string|undefined;
  if(body.action==='shipped'){
   const verified=await markShipped(body.sessionId);
   if(verified.invoice_ready){try{invoiceMail=(await dispatchOrderMail(body.sessionId,'invoice')).status}catch{invoiceMail='ausstehend; Rechnungsdaten, Steuerprüfung oder E-Mail-Versand prüfen'}}
   else invoiceMail='gesperrt; Steuerdaten oder Lieferland prüfen';
  }
  return NextResponse.json({supplier,invoiceMail,sentToSupplier:false},{headers});
 }catch(e){return fail(e instanceof Error?e.message:'Lieferantenstatus nicht verfügbar.',409)}
}
