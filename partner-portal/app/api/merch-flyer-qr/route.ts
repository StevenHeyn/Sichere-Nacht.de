import QRCode from 'qrcode';
import {member,failure} from '../../../lib/server';

export const dynamic='force-dynamic';
export async function GET(){
  try {
    const {account}=await member();
    if(account.status!=='active')throw Error('Partnerfreigabe erforderlich.');
    const url='https://sichere-nacht.de/?vp='+encodeURIComponent(String(account.referral_code));
    const png=await QRCode.toBuffer(url,{type:'png',width:560,errorCorrectionLevel:'H',margin:3});
    return new Response(new Uint8Array(png),{headers:{'content-type':'image/png','cache-control':'private, no-store, max-age=0','vary':'Cookie','x-content-type-options':'nosniff'}});
  } catch(e){return failure(e)}
}
