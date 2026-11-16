import {NextResponse} from 'next/server';
import {readLimitedText,assertBrowserJson,securityStatus} from '../../../lib/request-security';
import {merchMember,startMerchCheckout,syncMerchOrder} from '../../../lib/merch-payments';
import {uuid} from '../../../lib/merch-payment-model';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function POST(request:Request){try{
 assertBrowserJson(request);const user=await merchMember(request.headers.get('authorization'));
 const data=JSON.parse(await readLimitedText(request,4096));if(!uuid(data?.orderId)||!['checkout','status'].includes(data.action))return NextResponse.json({error:'Ungültige Bestellung.'},{status:400});
 const result=data.action==='status'?await syncMerchOrder(data.orderId,user.id):await startMerchCheckout(data.orderId,user);
 return NextResponse.json(result,{headers:{'cache-control':'private, no-store'}});
 }catch(e){const message=e instanceof Error?e.message:'Zahlung konnte nicht vorbereitet werden.';return NextResponse.json({error:message},{status:/Anmeldung|Partnerzugang/.test(message)?401:securityStatus(e),headers:{'cache-control':'private, no-store'}})}}
