import {body,member,json,failure} from '../../../lib/server';
export const dynamic='force-dynamic';export const maxDuration=60;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export async function POST(request:Request){try{
 const data=await body(request,4096),{db,account}=await member();if(account.status!=='active')throw Error('Aktiver Partnerzugang erforderlich.');
 if(!['checkout','status'].includes(String(data.action)))throw Error('Ungültige Zahlungsaktion.');
 let orderId=data.orderId;
 if(data.action==='checkout'&&!orderId){
  if(!uuid(data.requestKey)||typeof data.productId!=='string'||!Number.isInteger(data.quantity))throw Error('Druckpaket fehlt.');
  const order=await db.rpc('vp_merch_checkout_order',{p_product:data.productId,p_quantity:data.quantity,p_request_key:data.requestKey,p_sizes:data.sizes??{}});if(order.error)throw Error(order.error.message);orderId=order.data;
 }
 if(!uuid(orderId))throw Error('Bestellung fehlt.');
 const session=await db.auth.getSession();const token=session.data.session?.access_token;if(!token)throw Error('Anmeldung erforderlich.');
 // The existing shop keeps payment credentials; the portal forwards only the verified user's token.
 const r=await fetch('https://sichere-nacht.de/api/partner-checkout',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({action:data.action,orderId}),cache:'no-store',signal:AbortSignal.timeout(45000)});
 const result=await r.json();if(!r.ok)throw Error(result.error||'Zahlung konnte nicht vorbereitet werden.');
 return json(result);
 }catch(e){return failure(e)}}
