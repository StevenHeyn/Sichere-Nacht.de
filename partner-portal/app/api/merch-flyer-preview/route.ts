import QRCode from 'qrcode';
import {member,failure} from '../../../lib/server';

export const dynamic='force-dynamic';

const escapeXml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]||char));
const display=(value:unknown,max:number)=>String(value??'').trim().replace(/[\x00-\x1f\x7f]/g,' ').slice(0,max);

export async function GET(){
  try{
    const {account}=await member();
    if(account.status!=='active')throw Error('Partnerfreigabe erforderlich.');
    const name=display(account.full_name,80),phone=display(account.phone,40);
    if(!name||!phone)throw Error('Bitte Namen und Telefonnummer im Partnerkonto vervollständigen.');
    const referralUrl='https://sichere-nacht.de/?vp='+encodeURIComponent(String(account.referral_code));
    const qr=await QRCode.toDataURL(referralUrl,{width:480,errorCorrectionLevel:'H',margin:2});
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="744" height="1052" viewBox="0 0 744 1052" role="img" aria-label="Personalisierte DIN-A5-Flyervorschau">
      <rect width="744" height="1052" fill="#071324"/>
      <rect x="0" y="0" width="744" height="16" fill="#f59e0b"/>
      <text x="54" y="93" fill="#fff" font-family="Arial,sans-serif" font-weight="800" font-size="43">SICHERE NACHT</text>
      <text x="55" y="129" fill="#fbbf24" font-family="Arial,sans-serif" font-size="21" letter-spacing="3">SICHERHEIT ZUHAUSE</text>
      <text x="54" y="240" fill="#fff" font-family="Arial,sans-serif" font-weight="800" font-size="62">Dein Zuhause.</text>
      <text x="54" y="310" fill="#fff" font-family="Arial,sans-serif" font-weight="800" font-size="62">Deine Sicherheit.</text>
      <text x="54" y="380" fill="#d1d5db" font-family="Arial,sans-serif" font-size="28">Moderne Alarmtechnik von AJAX.</text>
      <text x="54" y="419" fill="#d1d5db" font-family="Arial,sans-serif" font-size="25">Jetzt informieren und beraten lassen.</text>
      <rect x="48" y="485" width="648" height="472" rx="24" fill="#fff"/>
      <text x="80" y="541" fill="#071324" font-family="Arial,sans-serif" font-weight="700" font-size="25">DEIN PERSÖNLICHER ANSPRECHPARTNER</text>
      <text x="80" y="596" fill="#071324" font-family="Arial,sans-serif" font-size="30" font-weight="700" textLength="${Math.min(564,Math.max(180,name.length*19))}" lengthAdjust="spacingAndGlyphs">${escapeXml(name)}</text>
      <text x="80" y="647" fill="#071324" font-family="Arial,sans-serif" font-size="27">${escapeXml(phone)}</text>
      <rect x="80" y="679" width="240" height="240" rx="10" fill="#fff"/>
      <image x="85" y="684" width="230" height="230" href="${qr}"/>
      <text x="343" y="759" fill="#071324" font-family="Arial,sans-serif" font-size="27" font-weight="700">QR-CODE SCANNEN</text>
      <text x="343" y="802" fill="#334155" font-family="Arial,sans-serif" font-size="21">Mehr erfahren</text>
      <text x="343" y="834" fill="#334155" font-family="Arial,sans-serif" font-size="21">und Kontakt aufnehmen.</text>
      <text x="54" y="1016" fill="#cbd5e1" font-family="Arial,sans-serif" font-size="17">Personalisierte Vorschau · Druckdaten erst nach Freigabe</text>
    </svg>`;
    return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','content-disposition':'inline; filename="Sichere-Nacht-Flyer-Vorschau.svg"','cache-control':'private, no-store, max-age=0','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox"}});
  }catch(e){return failure(e)}
}
