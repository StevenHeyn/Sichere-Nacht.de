import {createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
export const runtime='nodejs';
const send=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'cache-control':'no-store'}});
export async function POST(request:Request){
 const key=process.env.CONTACT_RESEND_API_KEY||process.env.RESEND_API_KEY,from=process.env.CONTACT_FROM_EMAIL||process.env.ORDER_EMAIL_FROM,to=process.env.CONTACT_TO_EMAIL||process.env.INVOICE_CONTACT_EMAIL;
 if(!key||!from||!to)return send({error:'Das Kontaktformular ist derzeit nicht eingerichtet. Bitte schreibe an bestellungen@sichere-nacht.de.'},503);
 if(Number(request.headers.get('content-length')||0)>10000)return send({error:'Anfrage zu groß.'},413);
 const raw=await request.text();if(raw.length>10000)return send({error:'Anfrage zu groß.'},413);
 let body;try{body=JSON.parse(raw)}catch{return send({error:'Ungültige Anfrage.'},400)}
 if(body?.website)return send({ok:true});
 const name=typeof body?.name==='string'?body.name.trim():'',email=typeof body?.email==='string'?body.email.trim():'',message=typeof body?.message==='string'?body.message.trim():'';
 if(!name||name.length>100||/[\r\n]/.test(name)||!/^\S+@\S+\.\S+$/.test(email)||email.length>200||message.length<10||message.length>5000)return send({error:'Bitte gültigen Namen, E-Mail-Adresse und eine Nachricht mit 10 bis 5.000 Zeichen eingeben.'},400);
 const id=createHash('sha256').update(email+'\n'+name+'\n'+message+'\n'+Math.floor(Date.now()/600000)).digest('hex');
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'sn-contact-'+id},body:JSON.stringify({from,to:[to],reply_to:email,subject:'Sichere Nacht: Beratungsanfrage',text:'Von: '+name+' <'+email+'>\n\n'+message}),cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)return send({error:'Nachricht nicht versendet. Bitte nutze alternativ bestellungen@sichere-nacht.de.'},502);return send({ok:true})}catch{return send({error:'Nachricht nicht bestätigt. Bitte nutze alternativ unsere E-Mail-Adresse.'},502)}
}
