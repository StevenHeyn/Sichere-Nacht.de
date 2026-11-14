import {NextResponse} from 'next/server';
import {hasOrdersAdminAccess} from '../../../../lib/admin-auth';
import {secplanPortal} from '../../../../lib/secplan-portal';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'cache-control':'private, no-store, max-age=0',vary:'Authorization','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'};
export async function GET(request:Request){
 if(!hasOrdersAdminAccess(request))return NextResponse.json({error:'Nicht autorisiert'},{status:401,headers});
 return NextResponse.json({label:'SECPLAN-Händlerportal',loginUrl:secplanPortal.loginUrl,channel:secplanPortal.channel,automaticTransmission:false},{headers});
}
