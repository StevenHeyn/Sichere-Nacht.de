import 'server-only';
import {checkoutForm,checkoutUrl,invoiceUrl,isMerchSession,paymentState,uuid} from './merch-payment-model';

const apiVersion='2026-09-30.endive';
function settings(){const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)throw Error('Bestellspeicherung nicht verfügbar.');return {base:new URL(base).origin,key}}
async function db(path:string,method='GET',data?:unknown){const {base,key}=settings();const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Werbemittelbestellung konnte nicht verarbeitet werden.');return r.status===204?null:r.json()}
function stripeKey(){const key=process.env.STRIPE_SECRET_KEY||'';const live=process.env.VERCEL_ENV==='production'&&process.env.PAYMENTS_LIVE_APPROVED==='true'&&/^(sk|rk)_live_/.test(key);const test=process.env.VERCEL_ENV==='preview'&&process.env.CHECKOUT_TEST_ENABLED==='true'&&/^(sk|rk)_test_/.test(key);if(!live&&!test)throw Error('Onlinezahlung ist noch nicht freigeschaltet.');return {key,live}}
async function stripe(path:string,form?:URLSearchParams,idempotency?:string){const {key}=stripeKey();const r=await fetch('https://api.stripe.com/v1/'+path,{method:form?'POST':'GET',headers:{Authorization:'Bearer '+key,'Stripe-Version':apiVersion,...(form?{'content-type':'application/x-www-form-urlencoded'}:{}),...(idempotency?{'Idempotency-Key':idempotency}:{})},body:form?.toString(),cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok){console.error('Merch Stripe request failed',{status:r.status,path:path.split('?')[0]});throw Error('Der Zahlungsdienst ist momentan nicht verfügbar.');}return r.json()}
export async function merchMember(authorization:string|null){
 if(!authorization?.startsWith('Bearer ')||authorization.length>8192)throw Error('Anmeldung erforderlich.');
 const {base,key}=settings();const r=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:authorization},cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Anmeldung erforderlich.');const user=await r.json();if(!uuid(user.id)||!user.email_confirmed_at||!user.email)throw Error('Bestätigte Anmeldung erforderlich.');
 const accounts=await db('vp_accounts?select=user_id,status&user_id=eq.'+user.id+'&limit=1');if(accounts[0]?.status!=='active')throw Error('Aktiver Partnerzugang erforderlich.');return {id:user.id as string,email:user.email as string};
}
async function ownedOrder(id:string,userId:string){if(!uuid(id)||!uuid(userId))throw Error('Bestellung fehlt.');const list=await db('vp_merch_orders?select=*&id=eq.'+id+'&user_id=eq.'+userId+'&limit=1');const order=list[0];if(!order?.payment_status)throw Error('Onlinebestellung nicht gefunden.');return order}
async function vatRate(){
 const rates=await stripe('tax_rates?active=true&limit=100');const rate=rates.data.find((r:any)=>r.active&&r.inclusive&&r.percentage===19&&r.country==='DE');if(rate)return rate.id as string;
 const created=await stripe('tax_rates',new URLSearchParams({display_name:'MwSt.',percentage:'19',inclusive:'true',country:'DE',jurisdiction:'Deutschland',description:'Sichere Nacht Werbemittel · 19 % inklusive'}),'sn-merch-vat-de-inclusive-v1');return created.id as string;
}
export async function startMerchCheckout(id:string,user:{id:string,email:string}){
 stripeKey();const order=await ownedOrder(id,user.id);
 if(order.payment_status==='paid')return {orderId:id,state:'paid'};
 if(order.stripe_session_id){const session=await stripe('checkout/sessions/'+encodeURIComponent(order.stripe_session_id));const state=await recordSession(session,undefined,'reconcile');if(state!=='pending')return {orderId:id,state};return {orderId:id,state,url:checkoutUrl(session.url)}}
 if(order.payment_status!=='pending'||Date.now()-Date.parse(order.created_at)>23*3600000)throw Error('Diese Zahlung ist abgelaufen. Bitte das Paket neu auswählen.');
 const tax=await vatRate(),session=await stripe('checkout/sessions',checkoutForm(order,user.email,tax),'sn-merch-order-'+id);
 if(!isMerchSession(session)||session.metadata.merch_order_id!==id||session.amount_total!==order.quote_total_cents||session.livemode!==stripeKey().live)throw Error('Zahlung konnte nicht geprüft werden.');
 const url=checkoutUrl(session.url);await db('rpc/vp_merch_attach_session','POST',{p_order:id,p_user:user.id,p_session:session.id});return {orderId:id,state:'pending',url};
}
async function recordSession(session:any,eventType?:string,eventId='reconcile'){
 if(!isMerchSession(session)||session.mode!=='payment'||session.livemode!==stripeKey().live)throw Error('Falscher Zahlungsbereich.');
 const state=paymentState(session,eventType);if(state==='pending')return state;
 let invoice:any=null;if(state==='paid'&&typeof session.invoice==='string')invoice=await stripe('invoices/'+encodeURIComponent(session.invoice));
 const shipping=session.collected_information?.shipping_details||session.shipping_details;
 await db('rpc/vp_merch_record_payment','POST',{p_order:session.metadata.merch_order_id,p_session:session.id,p_user:session.metadata.partner_user_id,p_state:state,p_amount:session.amount_total,p_currency:session.currency,p_event:eventId,
  p_details:{tax:session.total_details?.amount_tax,email:session.customer_details?.email,name:session.customer_details?.name,billing_address:session.customer_details?.address,shipping,payment_intent:session.payment_intent,invoice_url:invoiceUrl(invoice?.hosted_invoice_url),invoice_pdf:invoiceUrl(invoice?.invoice_pdf)}});
 const saved=await ownedOrder(session.metadata.merch_order_id,session.metadata.partner_user_id);return saved.payment_status;
}
export async function syncMerchOrder(id:string,userId:string){const order=await ownedOrder(id,userId);if(!order.stripe_session_id)return {state:order.payment_status,orderId:id};const session=await stripe('checkout/sessions/'+encodeURIComponent(order.stripe_session_id));const state=await recordSession(session);return {state:order.payment_status==='paid'?'paid':state,orderId:id}}
// Called only after the existing shop webhook has verified Stripe's signature.
export async function handleMerchWebhook(event:any){
 const object=event.data?.object;if(!isMerchSession(object))return null;
 if(event.livemode!==stripeKey().live)throw Error('Webhook-Modus passt nicht.');
 const session=await stripe('checkout/sessions/'+encodeURIComponent(object.id));return {received:true,merch:true,state:await recordSession(session,event.type,event.id)};
}
