import {createHmac,timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {ordersConfigured,savePaidOrder,type StoredOrder} from '../../../../lib/orders';
import {dispatchOrderMail} from '../../../../lib/order-notifications';
import {isSichereNachtCheckout} from '../../../../lib/stripe-shop';
import {stripeShipping} from '../../../../lib/stripe-shipping';
export const runtime='nodejs';
type StripeEvent={id?:string;type?:string;livemode?:boolean;data?:{object?:{id?:string;object?:string;mode?:string;payment_status?:string;metadata?:Record<string,string>}}};
type StripeAddress=Record<string,unknown>;
type StripeSession={
 id:string;object:string;mode:string;status:string;payment_status:string;livemode:boolean;
 amount_total:number;amount_subtotal?:number|null;total_details?:{amount_tax?:number|null};currency:string;payment_intent?:string|null;
 customer_details?:{email?:string|null;name?:string|null;address?:StripeAddress|null};
 collected_information?:{shipping_details?:{name?:string|null;address?:StripeAddress|null}};
 shipping_details?:{name?:string|null;address?:StripeAddress|null};shipping_cost?:{amount_total?:number};metadata?:Record<string,string>;
};
type StripeLine={description?:string;quantity?:number;amount_total?:number;price?:{product?:{metadata?:{sku?:string}}}};
function validSignature(payload:string,header:string,secret:string){
 const segments=header.split(',').map(x=>x.trim().split('=',2)),t=segments.find(([k])=>k==='t')?.[1],v=segments.filter(([k])=>k==='v1').map(([,h])=>h);
 if(!t||!/^\d+$/.test(t)||v.length===0)return false;
 const when=Number(t);if(!Number.isSafeInteger(when)||Math.abs(Date.now()/1000-when)>300)return false;
 const expected=createHmac('sha256',secret).update(t+'.'+payload).digest();
 return v.some(hex=>/^[0-9a-f]{64}$/i.test(hex)&&timingSafeEqual(expected,Buffer.from(hex,'hex')));
}
async function stripeGet<T>(endpoint:string):Promise<T>{
 const key=process.env.STRIPE_SECRET_KEY;if(!key)throw new Error('Stripe API nicht konfiguriert');
 const result=await fetch('https://api.stripe.com/v1/'+endpoint,{headers:{Authorization:'Bearer '+key,'Stripe-Version':'2026-03-25.dahlia'},cache:'no-store'});
 if(!result.ok)throw new Error('Stripe API Status '+result.status);return result.json() as Promise<T>;
}
async function verifiedPaidOrder(event:StripeEvent,sessionId:string):Promise<StoredOrder|null|'ignored'>{
 const session=await stripeGet<StripeSession>('checkout/sessions/'+encodeURIComponent(sessionId));
 if(session.id!==sessionId||session.object!=='checkout.session'||session.mode!=='payment')throw new Error('Stripe Session ungültig');
 if(!isSichereNachtCheckout(session))return 'ignored';
 if(session.status!=='complete'||session.payment_status!=='paid')return null;
 const inPreview=process.env.VERCEL_ENV==='preview',inProduction=process.env.VERCEL_ENV==='production',key=process.env.STRIPE_SECRET_KEY||'';
 const testAllowed=inPreview&&key.startsWith('sk_test_')&&session.livemode===false&&event.livemode===false;
 const liveAllowed=inProduction&&(key.startsWith('sk_live_')||key.startsWith('rk_live_'))&&session.livemode===true&&event.livemode===true&&process.env.PAYMENTS_LIVE_APPROVED==='true';
 if(!testAllowed&&!liveAllowed)throw new Error('Stripe-Modus nicht passend zur geprüften Checkout-Freigabe');
 if(!Number.isInteger(session.amount_total)||session.amount_total<0||!session.currency)throw new Error('Stripe Session ohne Zahlungsbetrag');
 const params=new URLSearchParams({limit:'100'});params.append('expand[]','data.price.product');
 const lines=await stripeGet<{data:StripeLine[];has_more:boolean}>('checkout/sessions/'+encodeURIComponent(sessionId)+'/line_items?'+params);
 if(lines.has_more||!Array.isArray(lines.data)||lines.data.length===0)throw new Error('Bestellpositionen unvollständig');
 const shipping=stripeShipping(session);
 return {stripe_session_id:session.id,stripe_payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:null,stripe_event_id:event.id!,status:'paid',amount_total:session.amount_total,amount_subtotal:session.amount_subtotal??null,amount_tax:session.total_details?.amount_tax??null,shipping_amount:session.shipping_cost?.amount_total??null,currency:session.currency,customer_email:session.customer_details?.email??null,customer_name:session.customer_details?.name??null,shipping_name:shipping.name,shipping_address:shipping.address,billing_address:session.customer_details?.address??null,items:lines.data.map(item=>({sku:item.price?.product?.metadata?.sku||null,name:item.description||'Artikel',quantity:item.quantity||1,amount_total:item.amount_total??null})),shipping_country:typeof shipping.address?.country==='string'?shipping.address.country:session.metadata?.shipping_country||null,vp_id:session.metadata?.vp_id||null,test_mode:!session.livemode};
}
export async function POST(request:Request){
 const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;if(!webhookSecret)return NextResponse.json({error:'Webhook nicht konfiguriert'},{status:503});
 const signature=request.headers.get('stripe-signature');if(!signature)return NextResponse.json({error:'Signatur fehlt'},{status:400});
 let raw:string;try{raw=await request.text()}catch{return NextResponse.json({error:'Ungültiger Body'},{status:400})}
 if(!validSignature(raw,signature,webhookSecret))return NextResponse.json({error:'Ungültige Signatur'},{status:400});
 let event:StripeEvent;try{event=JSON.parse(raw) as StripeEvent}catch{return NextResponse.json({error:'Ungültiges JSON'},{status:400})}
 if(!event||typeof event.id!=='string'||!event.id||typeof event.type!=='string'||!event.type)return NextResponse.json({error:'Unvollständiges Event'},{status:400});
 if(event.type!=='checkout.session.completed'&&event.type!=='checkout.session.async_payment_succeeded')return NextResponse.json({received:true,ignored:true});
 const object=event.data?.object;if(object?.object!=='checkout.session'||!object.id)return NextResponse.json({error:'Ungültiges Session-Event'},{status:400});
 if(!isSichereNachtCheckout(object))return NextResponse.json({received:true,ignored:true});
 if(!ordersConfigured()){console.error('Webhook empfangen, Bestelldatenbank fehlt',event.id);return NextResponse.json({error:'Bestelldatenbank noch nicht eingerichtet'},{status:503})}
 try{
  const order=await verifiedPaidOrder(event,object.id);
  if(order==='ignored')return NextResponse.json({received:true,ignored:true});
  if(!order)return NextResponse.json({received:true,payment_pending:true});
  await savePaidOrder(order);
  try{await dispatchOrderMail(order.stripe_session_id,'confirmation')}catch(err){console.error('Bestätigung vorgemerkt, E-Mail-Versand ausstehend',err instanceof Error?err.message:'Unbekannt')}
  console.info('Stripe-Bestellung gespeichert',{sessionId:order.stripe_session_id,eventId:event.id});
  return NextResponse.json({received:true,stored:true});
 }catch(e){console.error('Stripe-Webhookspeicherung fehlgeschlagen',e instanceof Error?e.message:'Unbekannt');return NextResponse.json({error:'Bestellung konnte nicht gespeichert werden'},{status:503})}
}
