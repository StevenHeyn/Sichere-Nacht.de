import QRCode from 'qrcode';
import {member,failure} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{const {account}=await member();if(account.status!=='active')throw new Error('Partnerfreigabe erforderlich.');const url='https://sichere-nacht.de/?vp='+account.referral_code;const png=await QRCode.toBuffer(url,{type:'png',width:900,errorCorrectionLevel:'M',margin:4});return new Response(new Uint8Array(png),{headers:{'content-type':'image/png','content-disposition':'attachment; filename="Sichere-Nacht-QR.png"','cache-control':'private, no-store'}})}catch(e){return failure(e)}}
