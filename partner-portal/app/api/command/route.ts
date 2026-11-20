import {sendSmtp} from '../../../lib/smtp.mjs';
import {partnerEmail} from '../../../lib/partner-email.mjs';
import {resolvePostalArea} from '../../../lib/postal-area';
import {body,member,json,failure} from '../../../lib/server';
export const dynamic='force-dynamic';export const maxDuration=60;
const str=(v:unknown,max=1000)=>typeof v==='string'?v.slice(0,max):'';
export async function POST(request:Request){try{const d=await body(request,120000),{db,user,account}=await member();let fn:string,args:Record<string,unknown>;
 if(str(d.action).startsWith('admin_')&&account.role!=='admin')throw new Error('Adminzugang erforderlich.');
 switch(d.action){
 case 'admin_test_smtp':{
  const userEmail=String(user.email||'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))throw new Error('Die bestätigte E-Mail-Adresse deines Admin-Logins ist ungültig.');
  const host=process.env.SMTP_HOST,port=process.env.SMTP_PORT,smtpUser=process.env.SMTP_USER,password=process.env.SMTP_PASSWORD;
  if(!host||!port||!smtpUser||!password)throw new Error('SMTP ist serverseitig unvollständig konfiguriert.');
  if(host!=='smtp.ionos.de'||port!=='465')throw new Error('Die SMTP-Testkonfiguration stimmt nicht mit IONOS Port 465 überein.');
  const html=partnerEmail({firstName:String(account.full_name||'').trim().split(' ')[0]||'Admin',eyebrow:'E-MAIL-SYSTEMTEST',headline:'Dein SMTP-Test von Sichere Nacht',message:'Dies ist eine Testnachricht aus dem Sichere-Nacht-Partnerportal. Wenn du sie liest, hat IONOS die Nachricht angenommen und sie wurde an dein Postfach zugestellt.',status:'Testnachricht',note:'Es wurden keine Erinnerungen an Vertriebspartner ausgelöst.',buttonText:'Partnerportal öffnen'});
  try{
   await sendSmtp({host,port,user:smtpUser,password,to:userEmail,subject:'Sichere Nacht | IONOS-SMTP-Test',html});
  }catch(e){console.error('VP_SMTP_TEST_FAILED',e instanceof Error?e.message:'unknown');throw new Error('IONOS hat den SMTP-Test nicht erfolgreich angenommen. Bitte Serverprotokoll prüfen.');}
  return json({ok:true,result:{accepted:true,recipient:userEmail}});
 }
 case 'admin_job_cancel':fn='vp_cancel_installation_job';args={p_id:d.id};break;
 case 'reminder_preference':fn='vp_set_reminder_opt_out';args={p_opt_out:d.optOut===true};break;
 case 'sales_quiz':fn='vp_submit_sales_quiz';args={p_answers:d.answers,p_version:d.version};break;
 case 'installer_quiz':fn='vp_submit_installer_quiz';args={p_answers:d.answers,p_version:d.version};break;
 case 'job_accept':fn='vp_accept_installation_job';args={p_id:d.id};break;
 case 'admin_job':{const permit=await db.rpc('vp_geo_request');if(permit.error||!permit.data)throw new Error('Bitte einige Sekunden warten.');const postalCode=str(d.postalCode,5),area=await resolvePostalArea(postalCode);fn='vp_publish_installation_job';args={p_data:{title:d.title,description:d.description,location:d.location,postalCode,...area,customerName:d.customerName,customerPhone:d.customerPhone,customerEmail:d.customerEmail}};break;}
 case 'installer_area':{if(account.status!=='active')throw new Error('Aktiver Partnerzugang erforderlich.');const permit=await db.rpc('vp_geo_request');if(permit.error||!permit.data)throw new Error('Bitte einige Sekunden warten.');const postalCode=str(d.postalCode,5),area=await resolvePostalArea(postalCode);fn='vp_save_installer_area';args={p_postal_code:postalCode,p_locality:area.locality,p_latitude:area.latitude,p_longitude:area.longitude,p_radius:Number(d.radius)};break;}
 case 'password':{const password=str(d.password,129);if(password.length<12||password.length>128)throw new Error('Passwort muss 12 bis 128 Zeichen haben.');const {error}=await db.auth.updateUser({password});if(error)throw new Error('Passwortänderung fehlgeschlagen.');return json({ok:true})}
 case 'application':if(d.acceptTerms!==true||!d.profile||typeof d.profile!=='object'||Array.isArray(d.profile))throw new Error('Profil und ausdrückliche Vertragsannahme erforderlich.');fn='vp_submit_application';args={p_profile:{...d.profile,termsAccepted:true},p_terms_id:d.termsId,p_invite_token:str(d.inviteToken,128)||null};break;
 case 'recruitment_link':fn='vp_recruitment_link';args={};break;
 case 'invite':fn='vp_invite';args={p_name:str(d.name,160),p_email:str(d.email,200)};break;
 case 'book':fn='vp_book_training';args={p_slot:d.slotId,p_cancel:d.cancel===true};break;
 case 'installer':fn='vp_request_installer';args={};break;
 case 'merch_request':fn='vp_merch_request';args={p_product:d.productId,p_quantity:d.quantity};break;
 case 'merch_accept':if(d.accept!==true)throw new Error('Kostenpflichtiges Angebot ausdrücklich bestätigen.');fn='vp_merch_accept';args={p_id:d.id,p_version:d.version};break;
 case 'create_address':fn='vp_create_map_address';args={p_data:d.address};break;
 case 'select_street':throw new Error('Bitte die gespeicherte Deutschland-Karte und Orts-/PLZ-Suche verwenden.');
 case 'select_area':throw new Error('Bitte eine Straße mit Postleitzahl auswählen. Die Umkreissuche wurde entfernt.');
 case 'claim_area':fn='vp_claim_territory';args={p_id:d.id};break;
 case 'claim_address':fn='vp_claim_address';args={p_id:d.id};break;
 case 'building':fn='vp_update_building';args={p_id:d.id,p_kind:d.kind,p_units:d.units||null};break;
 case 'qualify':fn='vp_qualify_address';args={p_id:d.id,p_status:d.status,p_households:d.households||null};break;
 case 'contact':fn='vp_save_contact';args={p_address:d.addressId,p_contact:d.id||null,p_data:d.contact};break;
 case 'delete_contact':fn='vp_delete_contact';args={p_id:d.id};break;
 case 'permission_use':fn='vp_record_permission_use';args={p_id:d.id,p_reason:str(d.reason)};break;
 case 'admin_account':{
  const userId=str(d.userId,40),operation=str(d.operation,24),reason=str(d.reason,500);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))throw new Error('Ungültige Partnerkennung. Bitte Partnerliste aktualisieren.');
  if(operation==='approve'){
   if(reason.trim().length<5)throw new Error('Bitte eine nachvollziehbare Prüfbegründung eingeben.');
   const approved=await db.rpc('vp_admin_account',{p_user:userId,p_action:'approve',p_reason:reason});
   if(approved.error){console.error('VP_APPROVAL_RPC_FAILED',{code:approved.error.code});throw new Error(approved.error.message||'Freigabe durch Datenbank abgelehnt.');}
   const checked=await db.from('vp_accounts').select('user_id,status,approved_at').eq('user_id',userId).single();
   if(checked.error||checked.data?.status!=='active'){console.error('VP_APPROVAL_VERIFY_FAILED',{code:checked.error?.code||'status_not_active'});throw new Error('Freigabe nicht bestätigt. Bitte den aktuellen Partnerstatus prüfen.');}
   return json({ok:true,result:{approved:true,userId,status:'active',approvedAt:checked.data.approved_at}});
  }
  fn='vp_admin_account';args={p_user:userId,p_action:operation,p_reason:reason};break;
 }
 case 'admin_learning':fn='vp_admin_learning';args={p_action:d.operation,p_data:d.data};break;
 case 'admin_merch':fn='vp_admin_merch';args={p_id:d.id,p_total:d.totalCents,p_description:str(d.description,5000)};break;
 case 'admin_area':fn='vp_admin_area';args={p_label:str(d.label,200),p_bbox:d.bbox};break;
 case 'admin_address':fn='vp_admin_address';args={p_id:d.id,p_reason:str(d.reason),p_reset_import:d.resetImport===true};break;
 case 'admin_terms':if(typeof d.text!=='string'||d.text.length>100000)throw new Error('Vertragsfassung fehlt oder überschreitet die zulässige Länge. Sie wurde nicht gekürzt.');fn='vp_publish_terms';args={p_version:str(d.version,100),p_title:str(d.title,200),p_body:d.text,p_review:str(d.review,1000)};break;
 case 'admin_settings':fn='vp_admin_settings';args={p_registration:d.registration===true,p_d2d:d.d2d===true,p_settlement:d.settlement===true,p_reason:str(d.reason)};break;
 case 'admin_reconcile':fn='vp_reconcile_earning';args={p_id:d.id,p_status:d.status,p_remaining:d.remainingCents,p_reference:str(d.reference,1000)};break;
 case 'admin_close_month':fn='vp_close_month';args={p_month:d.month,p_reason:str(d.reason)};break;
 case 'admin_paid':fn='vp_statement_paid';args={p_id:d.id,p_reference:str(d.reference,500)};break;
 case 'admin_reserve':fn='vp_reserve_release';args={p_earner:d.userId,p_payment_reference:str(d.reference,500)||null};break;
 default:throw new Error('Unbekannte Portalaktion.');
 }
 const {data,error}=await db.rpc(fn,args);if(error)throw new Error(error.message);
 return json({ok:true,result:d.action==='invite'?{invitationUrl:new URL('/login?invite='+encodeURIComponent(String(data)),request.url).href}:data});
 }catch(e){return failure(e)}}
