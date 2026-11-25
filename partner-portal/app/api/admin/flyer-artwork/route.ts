import QRCode from 'qrcode';
import {member,failure} from '../../../../lib/server';
export const dynamic='force-dynamic';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]||ch));
const clean=(v:unknown,max:number)=>String(v??'').trim().replace(/[\x00-\x1f\x7f]/g,' ').slice(0,max);
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// Internal artwork only. Never expose partner-specific print artwork to the partner account.
export async function GET(request:Request){
 try{
  const {db,account}=await member();
  if(account.status!=='active'||account.role!=='admin')throw Error('Administratorzugang erforderlich.');
  const id=new URL(request.url).searchParams.get('order')||'';
  if(!uuid(id))throw Error('Ungültige Bestellkennung.');
  const {data:order,error}=await db.from('vp_merch_orders')
    .select('id,product_id,quantity,payment_status,personalization')
    .eq('id',id).eq('product_id','qr-flyer').eq('payment_status','paid').single();
  if(error||!order)throw Error('Bezahlte Flyer-Bestellung nicht gefunden.');
  const snap=order.personalization as Record<string,unknown>|null;
  const name=clean(snap?.name,100),phone=clean(snap?.phone,40),url=String(snap?.referral_url||'');
  if(!name||!phone||!/^https:\/\/sichere-nacht\.de\/\?vp=[a-zA-Z0-9_-]+$/.test(url))
    throw Error('Die Personalisierungsdaten der Bestellung sind unvollständig.');
  const qr=await QRCode.toDataURL(url,{width:800,errorCorrectionLevel:'H',margin:3});
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="148mm" height="210mm" viewBox="0 0 744 1052">
    <rect width="744" height="1052" fill="#09172a"/>
    <rect width="744" height="15" fill="#fbbf24"/>
    <text x="52" y="98" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" font-size="43">SICHERE NACHT</text>
    <text x="54" y="137" fill="#fbbf24" font-family="Arial,sans-serif" font-size="20">SICHERHEIT ZUHAUSE</text>
    <text x="52" y="255" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" font-size="57">Dein Zuhause.</text>
    <text x="52" y="325" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" font-size="57">Deine Sicherheit.</text>
    <text x="52" y="390" fill="#cbd5e1" font-family="Arial,sans-serif" font-size="26">Moderne Alarmtechnik von AJAX.</text>
    <text x="52" y="431" fill="#cbd5e1" font-family="Arial,sans-serif" font-size="25">Jetzt informieren und beraten lassen.</text>
    <rect x="48" y="479" width="648" height="487" rx="16" fill="#fff"/>
    <text x="76" y="534" fill="#071324" font-family="Arial,sans-serif" font-weight="bold" font-size="24">DEIN PERSÖNLICHER ANSPRECHPARTNER</text>
    <text x="77" y="596" fill="#071324" font-family="Arial,sans-serif" font-weight="bold" font-size="30" textLength="${Math.min(562,Math.max(140,name.length*18))}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
    <text x="77" y="645" fill="#071324" font-family="Arial,sans-serif" font-size="28">${esc(phone)}</text>
    <image x="77" y="672" width="256" height="256" href="${qr}"/>
    <text x="353" y="772" fill="#071324" font-family="Arial,sans-serif" font-weight="bold" font-size="23">QR-CODE SCANNEN</text>
    <text x="353" y="816" fill="#334155" font-family="Arial,sans-serif" font-size="22">Jetzt mehr erfahren.</text>
  </svg>`;
  return new Response(svg,{headers:{
   'content-type':'image/svg+xml; charset=utf-8',
   'content-disposition':'attachment; filename="Sichere-Nacht-Flyer-'+id+'.svg"',
   'cache-control':'private, no-store, max-age=0',
   'vary':'Cookie',
   'x-content-type-options':'nosniff',
   'content-security-policy':"default-src 'none'; img-src data:; sandbox",
  }});
 }catch(e){return failure(e)}
}
