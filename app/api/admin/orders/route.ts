import {NextResponse} from 'next/server';
import {createHash,timingSafeEqual} from 'node:crypto';
import {listOrders,ordersConfigured} from '../../../../lib/orders';
import {dispatchOrderMail,markShipped} from '../../../../lib/order-notifications';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const expected=process.env.ORDERS_ADMIN_TOKEN;
 const auth=req.headers.get('authorization');
 const given=auth?.startsWith('Bearer ')?auth.slice(7):'';
 if(!expected||!given)return NextResponse.json({error:'Nicht autorisiert'},{status:401,headers:{'cache-control':'no-store'}});
 const a=createHash('sha256').update(expected).digest();
 const b=createHash('sha256').update(given).digest();
 if(!timingSafeEqual(a,b))return NextResponse.json({error:'Nicht autorisiert'},{status:401,headers:{'cache-control':'no-store'}});
 if(!ordersConfigured())return NextResponse.json({error:'Bestelldatenbank noch nicht eingerichtet'},{status:503});
 try{
  return NextResponse.json({orders:await listOrders()},{headers:{'cache-control':'no-store'}});
 }catch{return NextResponse.json({error:'Bestellungen konnten nicht geladen werden'},{status:503})}
}

export async function POST(req:Request){
 const expected=process.env.ORDERS_ADMIN_TOKEN;
 const supplied=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!expected||!supplied)return NextResponse.json({error:'Nicht autorisiert'},{status:401});
 const a=createHash('sha256').update(expected).digest();
 const b=createHash('sha256').update(supplied).digest();
 if(!timingSafeEqual(a,b))return NextResponse.json({error:'Nicht autorisiert'},{status:401});
 if(!ordersConfigured())return NextResponse.json({error:'Datenbank nicht eingerichtet'},{status:503});
 const body=await req.json().catch(()=>null);
 const sessionId=body?.sessionId;
 if(typeof sessionId!=='string'||!/^cs_(test|live)_[a-zA-Z0-9]+$/.test(sessionId))return NextResponse.json({error:'Ungültige Bestellreferenz'},{status:400});
 if(body.action==='shipped'){
  try{
   const result=await markShipped(sessionId);
   let mail='pending';
   if(result.invoice_ready){
    try{const response=await dispatchOrderMail(sessionId,'invoice');mail=response.status;}
    catch(e){mail='blocked: '+(e instanceof Error?e.message:'Versand nicht verfügbar');}
   }else mail='blocked: Steuerdaten oder Lieferland erfordern Rechnungsprüfung';
   return NextResponse.json({shipped:true,invoiceMail:mail},{headers:{'cache-control':'no-store'}});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Versandstatus fehlgeschlagen'},{status:409})}
 }
 if(body.action==='retry_confirmation'||body.action==='retry_invoice'){
  try{
   const result=await dispatchOrderMail(sessionId,body.action==='retry_confirmation'?'confirmation':'invoice');
   return NextResponse.json(result,{headers:{'cache-control':'no-store'}});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Mailversand fehlgeschlagen'},{status:409})}
 }
 return NextResponse.json({error:'Unbekannte Aktion'},{status:400});
}
