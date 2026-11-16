export const MERCH_SHOP='sichere-nacht-merch';
export const PORTAL_ORIGIN='https://vp.sichere-nacht.de';
export const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function isMerchSession(v:any):boolean{return v?.object==='checkout.session'&&v?.metadata?.shop===MERCH_SHOP&&!v.metadata.diagnostic&&uuid(v.metadata.merch_order_id)&&uuid(v.metadata.partner_user_id)}
export function checkoutUrl(value:unknown):string{if(typeof value!=='string')throw Error('Zahlungslink fehlt.');const u=new URL(value);if(u.protocol!=='https:'||u.hostname!=='checkout.stripe.com')throw Error('Ungültiger Zahlungslink.');return value}
export function invoiceUrl(value:unknown):string|null{if(typeof value!=='string')return null;try{const u=new URL(value);return u.protocol==='https:'&&['invoice.stripe.com','pay.stripe.com'].includes(u.hostname)?value:null}catch{return null}}
export function paymentState(session:any,eventType?:string){
 if(session.status==='complete'&&session.payment_status==='paid')return 'paid';
 if(session.status==='expired')return 'expired';
 if(eventType==='checkout.session.async_payment_failed')return 'failed';
 if(session.status==='complete'&&session.payment_status==='unpaid')return 'processing';
 return 'pending';
}
export function checkoutForm(order:any,email:string,taxRate:string){
 if(!uuid(order.id)||!uuid(order.user_id)||!Number.isSafeInteger(order.quote_total_cents)||order.quote_total_cents<1)throw Error('Ungültige Bestellung.');
 const workwear=order.product_id==='strauss-workwear-set';
 const sizeText=workwear&&order.size?' Größen: '+String(order.size):'';
 const form=new URLSearchParams({mode:'payment',locale:'de',submit_type:'pay',
  success_url:PORTAL_ORIGIN+'/portal?view=merch&payment=return&order='+order.id,
  cancel_url:PORTAL_ORIGIN+'/portal?view=merch&payment=cancelled&order='+order.id,
  customer_creation:'always',customer_email:email,billing_address_collection:'required',
  'shipping_address_collection[allowed_countries][0]':'DE',
  'invoice_creation[enabled]':'true',
  'invoice_creation[invoice_data][description]':'Sichere Nacht · Werbemittel · Bestellung '+order.id,
  'custom_text[submit][message]':'Inklusive 19 % MwSt. und Standardversand Deutschland. Personalisierung und Druckansicht werden vor der Produktion mit dir abgestimmt.',
  'branding_settings[display_name]':'Sichere Nacht',
  integration_identifier:'sn_merch_hosted_nqvprxsa',
  'metadata[shop]':MERCH_SHOP,'metadata[merch_order_id]':order.id,'metadata[partner_user_id]':order.user_id,
  'payment_intent_data[metadata][shop]':MERCH_SHOP,'payment_intent_data[metadata][merch_order_id]':order.id,
  'line_items[0][price_data][currency]':'eur','line_items[0][price_data][unit_amount]':String(order.quote_total_cents),
  'line_items[0][price_data][tax_behavior]':'inclusive',
  'line_items[0][price_data][product_data][name]':String(order.quote_description).split('\n')[0].slice(0,240),
  'line_items[0][price_data][product_data][description]':workwear?'6-teiliges Strauss-Set: Winterjacke, Softshelljacke, 3 Poloshirts und Pullover. Weißes Rückenlogo auf allen Teilen. Standardversand Deutschland inklusive.'+sizeText:'Personalisiertes Druckpaket. Eigener Empfehlungs-QR; persönliche Druckfreigabe vor Produktion. Standardversand Deutschland inklusive.',
  'line_items[0][quantity]':'1','line_items[0][tax_rates][0]':taxRate,
  'adaptive_pricing[enabled]':'false'});
 return form;
}
