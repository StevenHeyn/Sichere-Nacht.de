import {NextResponse} from 'next/server';
export const runtime='nodejs';
const error=(message:string,status:number)=>NextResponse.json({error:message},{status});
type RequestData={name?:string;email?:string;reference?:string;message?:string};
export async function POST(request:Request){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY,base=process.env.SUPABASE_URL,resendKey=process.env.RESEND_API_KEY;
 const from=process.env.ORDER_EMAIL_FROM,recipient=process.env.ORDER_EMAIL_TEST_TO||'bestellungen@sichere-nacht.de';
 if(!key||!base||!resendKey||!from)return error('Die elektronische Widerrufsfunktion ist noch nicht vollständig eingerichtet. Bitte den Widerruf per E-Mail erklären.',503);
 const input=await request.json().catch(()=>null) as RequestData|null;
 const name=typeof input?.name==='string'?input.name.trim():'';
 const email=typeof input?.email==='string'?input.email.trim():'';
 const reference=typeof input?.reference==='string'?input.reference.trim():'';
 const message=typeof input?.message==='string'?input.message.trim():'';
 if(name.length<2||name.length>150||email.length>240||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||reference.length<3||reference.length>150||message.length>1500)
  return error('Bitte Name, E-Mail-Adresse und Vertragskennung gültig eingeben.',400);
 const api=new URL(base).origin+'/rest/v1/shop_withdrawal_requests';
 const dbHeaders={apikey:key,Authorization:'Bearer '+key,'content-type':'application/json'};
 const saved=await fetch(api,{method:'POST',headers:{...dbHeaders,Prefer:'return=representation'},body:JSON.stringify({customer_name:name,customer_email:email,order_reference:reference,message}),cache:'no-store'}).catch(()=>null);
 if(!saved?.ok)return error('Übermittlung derzeit nicht möglich. Bitte senden Sie Ihren Widerruf direkt per E-Mail.',503);
 const rows=await saved.json() as Array<{id:string;created_at:string}>;
 const record=rows[0];if(!record?.id)return error('Widerruf gespeichert, aber Bestätigung nicht verfügbar. Bitte kontaktieren Sie uns.',503);
 const safe=(s:string)=>s.replace(/[\r\n]/g,' ').trim();
 const content=['Widerrufserklärung zu sichere-nacht.de','Eingegangen: '+record.created_at,'Eingangsnummer: '+record.id,'Name: '+safe(name),'E-Mail: '+safe(email),'Vertragskennung: '+safe(reference),'Erklärung: Hiermit widerrufe ich den genannten Vertrag beziehungsweise die bezeichneten Positionen.','Zusätzliche Angaben: '+safe(message),'','Diese Nachricht bestätigt den Eingang der Erklärung, nicht die Prüfung des Bestehens eines Widerrufsrechts.'].join('\n');
 const send=async(to:string[],subject:string,text:string,replyTo?:string)=>{
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+resendKey,'Content-Type':'application/json','Idempotency-Key':'sichere-nacht-widerruf-'+record.id+'-'+(replyTo?'internal':'receipt')},body:JSON.stringify({from,to,subject,text,reply_to:replyTo}),cache:'no-store'});
  return r.ok;
 };
 // The consumer receipt is required; do not return a success message without sending it.
 let receipt=false;try{receipt=await send([email],'Sichere Nacht: Eingang Ihres Widerrufs',content);}catch{receipt=false;}
 if(receipt){await fetch(api+'?id=eq.'+encodeURIComponent(record.id),{method:'PATCH',headers:dbHeaders,body:JSON.stringify({receipt_sent_at:new Date().toISOString()}),cache:'no-store'}).catch(()=>null);}
 let internal=false;try{internal=await send([recipient],'Sichere Nacht: Widerruf eingegangen',content,email);}catch{internal=false;}
 if(internal){await fetch(api+'?id=eq.'+encodeURIComponent(record.id),{method:'PATCH',headers:dbHeaders,body:JSON.stringify({internal_notification_sent_at:new Date().toISOString()}),cache:'no-store'}).catch(()=>null);}
 if(!receipt)return error('Ihr Widerruf wurde gespeichert, die E-Mail-Eingangsbestätigung konnte jedoch nicht verschickt werden. Bitte kontaktieren Sie uns zusätzlich per E-Mail mit Ihrer Bestellkennung.',502);
 return NextResponse.json({ok:true,reference:record.id,receivedAt:record.created_at});
}
