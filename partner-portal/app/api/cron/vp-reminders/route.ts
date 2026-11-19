import {createClient} from '@supabase/supabase-js';
export const dynamic='force-dynamic';
export const maxDuration=60;
const portal='https://vp.sichere-nacht.de';
const berlinParts=(d:Date)=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get('authorization')!==`Bearer ${secret}`)return Response.json({error:'Unauthorized'},{status:401});
 const now=new Date(),parts=berlinParts(now);
 // Vercel Hobby allows one daily UTC run: 09:00 CET in winter, 10:00 CEST in summer.
 if(!['09','10'].includes(parts.hour))return Response.json({ok:true,skipped:'outside_daily_window'});
 // Disabled by default: explicit launch only after email/legal review and database migration.
 if(process.env.VP_REMINDERS_ENABLED!=='true')return Response.json({ok:true,skipped:'disabled'});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,apiKey=process.env.RESEND_API_KEY;
 if(!url||!key||!apiKey)return Response.json({error:'Missing server configuration'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const date=`${parts.year}-${parts.month}-${parts.day}`;
 const {data:accounts,error}=await db.from('vp_accounts').select('user_id,email,full_name,status,role,submitted_at,sales_passed_at,created_at,reminder_opt_out').in('status',['onboarding','active']).neq('role','admin').eq('reminder_opt_out',false).limit(500);
 if(error)return Response.json({error:'Unable to read eligible accounts'},{status:503});
 let sent=0,failed=0,skipped=0;
 for(const account of accounts||[]){
  if(!account.email||!account.created_at||Date.now()-new Date(account.created_at).getTime()<24*3600*1000){skipped++;continue}
  const profile=account.status==='onboarding'&&!account.submitted_at;
  const training=account.status==='active'&&!account.sales_passed_at;
  if(!profile&&!training){skipped++;continue}
  const kind=profile&&training?'both':profile?'profile':'training';
  const {data:reservation,error:reserveError}=await db.from('vp_daily_reminders').insert({user_id:account.user_id,reminder_date:date,reminder_kind:kind,status:'reserved'}).select('id').single();
  if(reserveError||!reservation){skipped++;continue}
  const name=escapeHtml((account.full_name||'').trim().split(' ')[0]||'Vertriebspartner');
  const detail=kind==='profile'?'Bitte vervollständige deinen Partnerantrag und lade die erforderlichen Unterlagen hoch.':kind==='training'?'Bitte absolviere den verpflichtenden Grundlagen-Test in unserer Akademie.':'Bitte vervollständige deinen Partnerantrag und absolviere anschließend den Grundlagen-Test.';
  const subject=kind==='profile'?'Dein Partnerantrag wartet auf dich | Sichere Nacht':'Deine nächsten Schritte im VP-Portal | Sichere Nacht';
  const html=`<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#10243b"><h2>SICHERE NACHT</h2><p>Hallo ${name},</p><p>${detail}</p><p><a href="${portal}/portal" style="display:inline-block;background:#176a98;color:#fff;padding:14px 22px;border-radius:7px;text-decoration:none">Zum VP-Portal</a></p><p>Wenn du die Schritte inzwischen abgeschlossen hast, kannst du diese Nachricht ignorieren.</p><p style="font-size:12px;color:#627487">H&amp;K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt · <a href="${portal}/datenschutz">Datenschutz</a></p></div>`;
  try{
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'authorization':`Bearer ${apiKey}`,'content-type':'application/json','Idempotency-Key':`vp-reminder-${date}-${account.user_id}`},body:JSON.stringify({from:'Sichere Nacht <noreply@sichere-nacht.de>',to:[account.email],subject,html})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.id)throw new Error('Provider did not accept email');
   await db.from('vp_daily_reminders').update({status:'sent',sent_at:new Date().toISOString(),provider_message_id:String(result.id)}).eq('id',reservation.id);
   sent++;
  }catch{await db.from('vp_daily_reminders').update({status:'failed'}).eq('id',reservation.id);failed++}
 }
 return Response.json({ok:true,date,sent,failed,skipped});
}
