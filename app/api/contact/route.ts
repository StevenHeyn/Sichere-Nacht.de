import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function POST(request:Request){
 if(!process.env.CONTACT_RESEND_API_KEY||!process.env.CONTACT_TO_EMAIL||!process.env.CONTACT_FROM_EMAIL)return NextResponse.json({error:'Das Kontaktformular ist derzeit noch nicht eingerichtet. Bitte später erneut versuchen.'},{status:503});
 const body=await request.json().catch(()=>null);
 const name=typeof body?.name==='string'?body.name.trim():'';
 const email=typeof body?.email==='string'?body.email.trim():'';
 const message=typeof body?.message==='string'?body.message.trim():'';
 if(!name||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>200||message.length<10||message.length>5000)return NextResponse.json({error:'Bitte gültige Kontaktangaben eingeben.'},{status:400});
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.CONTACT_RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.CONTACT_FROM_EMAIL,to:[process.env.CONTACT_TO_EMAIL],reply_to:email,subject:'Sichere Nacht: Kontaktanfrage',text:'Von: '+name+' <'+email+'>\n\n'+message}),cache:'no-store'});
 if(!response.ok)return NextResponse.json({error:'Der Nachrichtenversand ist derzeit nicht möglich.'},{status:502});
 return NextResponse.json({ok:true});
}
