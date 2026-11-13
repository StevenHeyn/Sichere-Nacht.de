import {NextResponse} from 'next/server';
export const runtime='nodejs';
const json=(error:string,status:number)=>NextResponse.json({error},{status});
const valid=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>=2&&v.trim().length<=max;
function clean(v:string){return v.trim().replace(/[<>]/g,'');}
async function sendReceipt(email:string,name:string,reference:string,at:string){
 const key=process.env.RESEND_API_KEY;
 const from=process.env.ORDER_EMAIL_FROM;
 if(!key||!from)return false;
 const response=await fetch('https://api.resend.com/emails',{
  method:'POST',headers:{Authorization:'Bearer '+key,'content-type':'application/json'},
  body:JSON.stringify({
   from,to:[email],subject:'Sichere Nacht: Eingang deines Widerrufs',
   text:'Wir bestätigen den Eingang deiner Widerrufserklärung.\nName: '+name+'\nBestellung/Vertrag: '+reference+'\nEingang (UTC): '+at+'\nDies ist eine Eingangsbestätigung, keine Entscheidung über die Wirksamkeit.\nH & K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt.'
  }),cache:'no-store'
 });
 return response.ok;
}
export async function POST(request:Request){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return json('Die Online-Widerrufsfunktion ist noch nicht eingerichtet. Bitte per E-Mail widerrufen.',503);
 const data=await request.json().catch(()=>null);
 if(!data||!valid(data.name,160)||!valid(data.reference,240)||typeof data.email!=='string'||data.email.length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))return json('Bitte Namen, E-Mail und Bestellangaben prüfen.',400);
 const name=clean(data.name),email=data.email.trim(),reference=clean(data.reference);
 const createdAt=new Date().toISOString();
 try{
  const db=await fetch(new URL('/rest/v1/shop_withdrawal_requests',url),{
   method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json',Prefer:'return=representation'},
   body:JSON.stringify({customer_name:name,customer_email:email,order_reference:reference,created_at:createdAt}),cache:'no-store'
  });
  if(!db.ok){console.error('Widerruf DB Status',db.status);return json('Übermittlung fehlgeschlagen. Bitte per E-Mail widerrufen.',503)}
  const rows=await db.json() as Array<{id:string}>;
  const id=rows[0]?.id;
  let receiptSent=false;
  try{receiptSent=await sendReceipt(email,name,reference,createdAt)}catch(e){console.error('Widerruf E-Mail-Versand fehlgeschlagen',e instanceof Error?e.message:'Unbekannt')}
  if(receiptSent&&id){
   const update=await fetch(new URL('/rest/v1/shop_withdrawal_requests?id=eq.'+encodeURIComponent(id),url),{
    method:'PATCH',headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json'},
    body:JSON.stringify({receipt_sent_at:new Date().toISOString()}),cache:'no-store'
   });
   if(!update.ok)console.error('Widerruf Eingangsbestätigung nicht markiert',update.status);
  }
  return NextResponse.json({received:true,receiptSent});
 }catch(e){console.error('Widerruf fehlgeschlagen',e instanceof Error?e.message:'Unbekannt');return json('Übermittlung fehlgeschlagen. Bitte per E-Mail widerrufen.',503)}
}
