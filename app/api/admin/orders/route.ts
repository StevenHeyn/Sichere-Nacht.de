import {NextResponse} from 'next/server';
import {createHash,timingSafeEqual} from 'node:crypto';
import {listOrders,ordersConfigured} from '../../../../lib/orders';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const expected=process.env.ORDERS_ADMIN_TOKEN;
 const auth=req.headers.get('authorization');
 const given=auth?.startsWith('Bearer ')?auth.slice(7):'';
 if(!expected||!given)return NextResponse.json({error:'Nicht autorisiert'},{status:401,headers:{'cache-control':'no-store'}});
 const a=createHash('sha256').update(expected).digest();
 const b=createHash('sha256').update(given).digest();
 if(!timingSafeEqual(a,b))return NextResponse.json({error:'Nicht autorisiert'},{status:401,headers:{'cache-control':'no-store'}});
 if(!ordersConfigured())return NextResponse.json({error:'Bestelldatenbank noch nicht eingerichtet'},{status:503});
 try{
  return NextResponse.json({orders:await listOrders()},{headers:{'cache-control':'no-store'}});
 }catch{return NextResponse.json({error:'Bestellungen konnten nicht geladen werden'},{status:503})}
}
