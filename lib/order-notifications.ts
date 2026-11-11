import 'server-only';
import {randomUUID} from 'node:crypto';
import {invoicePdf,confirmationPdf,type InvoiceSnapshot} from './invoice-pdf';
type DbOrder={
 stripe_session_id:string;created_at?:string;customer_email:string|null;customer_name:string|null;
 amount_total:number;amount_tax:number|null;shipping_amount:number|null;currency:string;shipping_country:string|null;
 shipped_at:string|null;invoice_number:string|null;invoice_snapshot:InvoiceSnapshot|null;
 test_mode:boolean;
 items:Array<{name:string;sku:string|null;quantity:number;amount_total:number|null}>;
 shipping_address:Record<string,unknown>|null;
 billing_address:Record<string,unknown>|null;
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
 if(!o.billing_address||!o.customer_name)throw new Error('Rechnungsadresse oder Kundenname fehlt');
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
   const attachment=confirmationPdf({
    stripe_session_id:o.stripe_session_id,created_at:o.created_at,
    customer_name:o.customer_name,customer_email:o.customer_email,
    billing_address:o.billing_address,shipping_address:o.shipping_address,
    amount_total:o.amount_total,amount_tax:o.amount_tax,shipping_amount:o.shipping_amount,
    currency:o.currency,items:o.items,test_mode:o.test_mode
   },issuer());
   attachments.push({filename:'Auftragsbestaetigung-Sichere-Nacht.pdf',
    content:attachment.toString('base64'),content_type:'application/pdf'});
   html='<div style="max-width:640px;margin:auto;font-family:Arial,sans-serif;color:#202833">'+
     '<div style="border-top:8px solid #c51f2b;padding:26px 28px;background:#151c26;color:white">'+
     '<strong style="font-size:24px">SICHERE <span style="color:#ee4651">NACHT</span></strong></div>'+
     '<div style="padding:28px"><h1 style="font-size:24px">Vielen Dank für deine Bestellung!</h1>'+
     '<p>Wir haben die Zahlung erhalten und bereiten deine Bestellung vor.</p>'+
     '<p><strong>Deine Artikel</strong></p><ul>'+o.items.map(i=>'<li>'+i.quantity+' &times; '+escapeHtml(i.name)+'</li>').join('')+'</ul>'+
     '<p style="padding:16px;background:#f5f6f7"><strong>Gesamtbetrag inklusive Versand: '+
     (o.amount_total/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'})+'</strong></p>'+
     '<p>Deine Auftragsbestätigung im passenden Sichere-Nacht-Design findest du als PDF im Anhang.</p>'+
     '<p style="font-size:12px;color:#67717d">Dies ist keine Rechnung und keine Versandbestätigung.</p>'+
     '</div><div style="padding:16px 28px;border-top:1px solid #ddd;font-size:12px;color:#67717d">'+
     'H&amp;K Projekt UG (haftungsbeschränkt) · Lehmkoppel 7 · 25499 Tangstedt</div></div>';
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
 const r=await fetch(url+'/rest/v1/orders?select=stripe_session_id,customer_email,customer_name,amount_total,amount_tax,shipping_country,shipped_at,invoice_number,invoice_snapshot,test_mode,billing_address,shipping_address,items&stripe_session_id=eq.'+encodeURIComponent(sessionId)+'&limit=1',
 {headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store'});
 if(!r.ok)throw new Error('Bestellung nicht lesbar');
 const list=await r.json() as DbOrder[];
 return list[0]||null;
}
