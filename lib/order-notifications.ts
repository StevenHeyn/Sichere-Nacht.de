import 'server-only';
import {randomUUID} from 'node:crypto';
import {invoicePdf,type InvoiceSnapshot} from './invoice-pdf';
type DbOrder={
 stripe_session_id:string;customer_email:string|null;customer_name:string|null;
 amount_total:number;amount_tax:number|null;shipping_country:string|null;
 shipped_at:string|null;invoice_number:string|null;invoice_snapshot:InvoiceSnapshot|null;
 test_mode:boolean;
};
const dbBase=()=>{const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Supabase nicht konfiguriert');return {url:new URL(url).origin,key}};
async function rpc<T>(name:string,args:Record<string,unknown>):Promise<T>{
 const {url,key}=dbBase();
 const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify(args),cache:'no-store'});
 if(!r.ok)throw new Error('Bestellstatus konnte nicht verarbeitet werden ('+r.status+')');
 return r.json() as Promise<T>;
}
function configured(){
 if(!process.env.RESEND_API_KEY||!process.env.ORDER_EMAIL_FROM)throw new Error('E-Mail-Absender noch nicht eingerichtet');
}
function issuer(){
 const props=['INVOICE_COMPANY_NAME','INVOICE_COMPANY_STREET','INVOICE_COMPANY_CITY','INVOICE_VAT_ID','INVOICE_REGISTRY','INVOICE_CONTACT_EMAIL'] as const;
 if(props.some(key=>!process.env[key]))throw new Error('Rechnungs-Pflichtangaben fehlen');
 return {name:process.env.INVOICE_COMPANY_NAME!,street:process.env.INVOICE_COMPANY_STREET!,postalCity:process.env.INVOICE_COMPANY_CITY!,
 vatId:process.env.INVOICE_VAT_ID!,registry:process.env.INVOICE_REGISTRY!,email:process.env.INVOICE_CONTACT_EMAIL!};
}
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));}
function verifyTax(o:DbOrder){
 if(o.shipping_country!=='DE')throw new Error('Rechnungen für Auslandslieferungen benötigen gesonderte Steuerprüfung');
 if(o.amount_tax===null||o.amount_tax<=0)throw new Error('Steuerbetrag fehlt oder ist 0; Rechnung gesperrt');
 const expected=Math.round(o.amount_total*19/119);
 if(Math.abs(expected-o.amount_tax)>4)throw new Error('Stripe-Steuerbetrag entspricht nicht 19 Prozent des Bruttobetrags');
}
export async function markShipped(sessionId:string){return rpc<{shipped_at:string;invoice_ready:boolean}>('mark_order_shipped',{p_session_id:sessionId});}
export async function dispatchOrderMail(sessionId:string,kind:'confirmation'|'invoice'){
 configured();
 if(kind==='invoice'){
  const o=await readOrder(sessionId);
  if(!o?.shipped_at)throw new Error('Bestellung noch nicht versendet');
  verifyTax(o);issuer();
  await rpc('issue_shipped_invoice',{p_session_id:sessionId});
 }
 const token=randomUUID();
 const o=await rpc<DbOrder|null>('claim_order_mail',{p_session_id:sessionId,p_kind:kind,p_token:token});
 if(!o)return {status:'already_sent_or_locked'};
 try{
  const realEmail=o.customer_email;
  if(!realEmail)throw new Error('Kunden-E-Mail fehlt');
  if(o.test_mode&&!process.env.ORDER_EMAIL_TEST_TO)throw new Error('Testmodus: ORDER_EMAIL_TEST_TO ist noch nicht eingerichtet');
  const to=o.test_mode?process.env.ORDER_EMAIL_TEST_TO!:realEmail;
  const subject=kind==='confirmation'?'Sichere Nacht: Deine Bestellbestätigung':'Sichere Nacht: Deine Rechnung';
  const attachments: {filename:string;content:string;content_type:string}[]=[];
  let html:string;
  if(kind==='confirmation'){
   html='<h1>Vielen Dank für deine Bestellung!</h1><p>Wir haben die Zahlung erhalten und bereiten deine Bestellung vor.</p>'+
     '<p>Gesamtbetrag: <strong>'+(o.amount_total/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'})+'</strong></p>'+
     '<p>Dies ist eine Bestellbestätigung, keine Versandbestätigung und keine Rechnung.</p>';
  }else{
   const snapshot=o.invoice_snapshot;
   if(!snapshot||!o.invoice_number)throw new Error('Rechnungs-Snapshot fehlt');
   verifyTax(o);
   const pdf=invoicePdf(snapshot,issuer());
   attachments.push({filename:'Rechnung-'+o.invoice_number+'.pdf',content:pdf.toString('base64'),content_type:'application/pdf'});
   html='<h1>Deine Bestellung wurde versendet</h1><p>Im Anhang findest du deine Rechnung <strong>'+escapeHtml(o.invoice_number)+'</strong> als PDF.</p>'+
   '<p>Die Bestellung ist bereits bezahlt. Es ist keine weitere Zahlung erforderlich.</p>';
  }
  const request=await fetch('https://api.resend.com/emails',{method:'POST',headers:{
   Authorization:'Bearer '+process.env.RESEND_API_KEY,
   'Content-Type':'application/json','Idempotency-Key':'sichere-nacht-'+kind+'-'+sessionId
  },body:JSON.stringify({from:process.env.ORDER_EMAIL_FROM,to:[to],reply_to:process.env.ORDER_REPLY_TO||undefined,subject,html,
   attachments:attachments.length?attachments:undefined}),cache:'no-store'});
  if(!request.ok)throw new Error('E-Mail-Anbieter meldet HTTP '+request.status);
  await rpc('finish_order_mail',{p_session_id:sessionId,p_kind:kind,p_token:token,p_success:true,p_error:null});
  return {status:'sent'};
 }catch(e){
  const message=e instanceof Error?e.message:'Mailversand fehlgeschlagen';
  await rpc('finish_order_mail',{p_session_id:sessionId,p_kind:kind,p_token:token,p_success:false,p_error:message});
  throw new Error(message);
 }
}
async function readOrder(sessionId:string):Promise<DbOrder|null>{
 const {url,key}=dbBase();
 const r=await fetch(url+'/rest/v1/orders?select=stripe_session_id,customer_email,customer_name,amount_total,amount_tax,shipping_country,shipped_at,invoice_number,invoice_snapshot,test_mode&stripe_session_id=eq.'+encodeURIComponent(sessionId)+'&limit=1',
 {headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store'});
 if(!r.ok)throw new Error('Bestellung nicht lesbar');
 const list=await r.json() as DbOrder[];
 return list[0]||null;
}
