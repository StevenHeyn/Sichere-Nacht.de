import {createClient} from '@supabase/supabase-js';
import {sendSmtp} from './smtp.mjs';

const destination=()=>process.env.VP_SIGNUP_NOTIFY_EMAIL||'';
const escapeHtml=(s)=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const service=()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('signup_alert_db_not_configured');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
};
function emailContent(signupEmail){
 const shown=escapeHtml(signupEmail);
 return '<!doctype html><html lang="de"><head><meta charset="utf-8"></head><body style="margin:0;background:#edf2f6;font-family:Arial,Helvetica,sans-serif;color:#183047"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden"><tr><td style="background:#10243b;color:#fff;padding:26px 30px;font-size:24px;font-weight:bold">SICHERE NACHT <span style="color:#8be0c3;font-size:13px">· PARTNERPORTAL</span></td></tr><tr><td style="padding:28px 30px"><div style="font-size:12px;color:#157d72;font-weight:bold;letter-spacing:1px">NEUE VP-REGISTRIERUNG</div><h1 style="font-size:23px;color:#10243b;line-height:1.3">Ein neues Partnerkonto wurde erstellt.</h1><p style="line-height:1.7">Ein Interessent hat die Registrierung im Sichere-Nacht-Partnerportal gestartet.</p><p style="background:#edf7f5;padding:15px;border-radius:8px;overflow-wrap:anywhere"><strong>Registrierte E-Mail:</strong><br>'+shown+'</p><p style="font-size:14px;line-height:1.7">Die E-Mail-Bestätigung, der vollständige Partnerantrag und die manuelle Freigabe können noch ausstehen. Diese Nachricht ist keine Freigabebestätigung.</p><p style="margin:25px 0"><a href="https://vp.sichere-nacht.de/portal" style="background:#176a98;color:#fff;padding:14px 20px;text-decoration:none;border-radius:6px;font-weight:bold">Zum Adminbereich</a></p></td></tr><tr><td style="padding:18px 30px;background:#f8fafc;color:#63788b;font-size:12px">Automatische Verwaltungsbenachrichtigung · H&amp;K Projekt UG (haftungsbeschränkt)<br>Lehmkoppel 7, 25499 Tangstedt</td></tr></table></td></tr></table></body></html>';
}
const smtp=()=>{
 const host=process.env.SMTP_HOST,port=process.env.SMTP_PORT,user=process.env.SMTP_USER,password=process.env.SMTP_PASSWORD,to=destination();
 if(!host||!port||!user||!password||!to)throw new Error('signup_alert_smtp_not_configured');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))throw new Error('signup_alert_destination_invalid');
 return {host,port,user,password,to};
};
export async function sendSignupAdminNotifications({limit=5,userId=null}={}){
 const db=service(),cfg=smtp();
 let query=db.from('vp_signup_admin_notifications')
  .select('user_id,attempts').in('status',['pending','failed']).lt('attempts',4)
  .order('created_at',{ascending:true}).limit(limit);
 if(userId)query=query.eq('user_id',userId);
 const {data:pending,error:listError}=await query;
 if(listError)throw new Error('signup_alert_queue_read_failed');
 let sent=0,failed=0;
 for(const item of pending||[]){
  // One atomic claim: concurrent requests cannot claim the same notification.
  const {data:claim,error:claimError}=await db.from('vp_signup_admin_notifications')
   .update({status:'sending',last_attempt_at:new Date().toISOString(),attempts:item.attempts+1})
   .eq('user_id',item.user_id).eq('attempts',item.attempts).in('status',['pending','failed'])
   .select('user_id,signup_email,attempts').maybeSingle();
  if(claimError||!claim)continue;
  try{
   await sendSmtp({...cfg,subject:'Sichere Nacht | Neue VP-Registrierung',html:emailContent(claim.signup_email)});
   const {error:markError}=await db.from('vp_signup_admin_notifications').update({status:'sent',sent_at:new Date().toISOString(),last_error_code:null}).eq('user_id',claim.user_id).eq('status','sending');
   if(markError)console.error('VP_SIGNUP_ALERT_MARK_SENT_FAILED',{code:markError.code});
   sent++;
  }catch{
   await db.from('vp_signup_admin_notifications').update({status:'failed',last_error_code:'smtp_delivery_failed'}).eq('user_id',claim.user_id).eq('status','sending');
   failed++;
  }
 }
 return {sent,failed};
}
export async function queueSignupAdminNotification({userId,email}){
 if(!/^[0-9a-f-]{36}$/i.test(String(userId||''))||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||'')))return;
 const db=service();
 const {error}=await db.from('vp_signup_admin_notifications').insert({user_id:userId,signup_email:String(email).toLowerCase(),status:'pending'});
 if(error){if(error.code==='23505')return;throw new Error('signup_alert_queue_write_failed')}
 return sendSignupAdminNotifications({limit:1,userId});
}
