import {createHmac,timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';

export const runtime='nodejs';

type StripeEvent = {
 id?:string;
 type?:string;
 livemode?:boolean;
 data?:{object?:{
  id?:string;
  object?:string;
  mode?:string;
  payment_status?:string;
  amount_total?:number;
  currency?:string;
  metadata?:Record<string,string>;
 }};
};

function isValidSignature(payload:string,header:string,secret:string):boolean{
 const pairs=header.split(',').map(p=>p.trim().split('=',2));
 const timestamp=pairs.find(([key])=>key==='t')?.[1];
 const signatures=pairs.filter(([key])=>key==='v1').map(([,value])=>value);
 if(!timestamp||!/^\d+$/.test(timestamp)||signatures.length===0)return false;
 const seconds=Number(timestamp);
 if(!Number.isSafeInteger(seconds)||Math.abs(Date.now()/1000-seconds)>300)return false;
 const expected=createHmac('sha256',secret).update(timestamp+'.'+payload).digest();
 return signatures.some(hex=>{
  if(!/^[0-9a-f]{64}$/i.test(hex))return false;
  const actual=Buffer.from(hex,'hex');
  return timingSafeEqual(expected,actual);
 });
}

/**
 * Stripe's signature-authenticated event receiver.
 * Important: No order database has been configured yet. Payment records stay
 * accessible in Stripe, but warehouse fulfillment and emails are NOT automatic.
 * See STRIPE_INTEGRATION_TODO.md before allowing live payments.
 */
export async function POST(request:Request){
 const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;
 if(!webhookSecret)return NextResponse.json({error:'Webhook noch nicht eingerichtet.'},{status:503});
 const signature=request.headers.get('stripe-signature');
 if(!signature)return NextResponse.json({error:'Signatur fehlt.'},{status:400});
 let body:string;
 try{body=await request.text()}catch{return NextResponse.json({error:'Nachricht nicht lesbar.'},{status:400})}
 if(!isValidSignature(body,signature,webhookSecret)){
  return NextResponse.json({error:'Ungültige Stripe-Signatur.'},{status:400});
 }
 let event:StripeEvent;
 try{event=JSON.parse(body) as StripeEvent}catch{return NextResponse.json({error:'Ungültige JSON-Nachricht.'},{status:400})}
 if(!event.id||!event.type)return NextResponse.json({error:'Unvollständiges Stripe-Ereignis.'},{status:400});
 if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
  const session=event.data?.object;
  if(session?.object!=='checkout.session'||!session.id)return NextResponse.json({error:'Ungültige Checkout-Session.'},{status:400});
  if(session.payment_status==='paid'&&session.mode==='payment'){
   // Intentionally log only non-sensitive IDs, never address/payment data.
   // Stripe keeps transaction records. A separate idempotent order store
   // and fulfillment worker must be implemented before live launch.
   console.info('Stripe payment confirmed, order fulfillment not configured', {
    eventId:event.id,sessionId:session.id,amountTotal:session.amount_total,currency:session.currency
   });
  }
 }
 return NextResponse.json({received:true});
}
