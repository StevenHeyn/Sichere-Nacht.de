import Link from 'next/link';
import {CONSUMER_WITHDRAWAL_TEXT} from '../../lib/buyer-correspondence';
import {B2B_WITHDRAWAL_NOTE,BUYER_PURPOSE_NOTE} from '../../lib/buyer-policy';
export const metadata={title:'Widerrufsbelehrung für Verbraucher | Sichere Nacht'};
export default function Widerruf(){return <main className="wrap" style={{maxWidth:850,paddingBottom:80}}>
 <Link href="/" className="accent">← Startseite</Link><h1>Widerrufsbelehrung für Verbraucher</h1>
 <p>Die nachstehende Belehrung gilt für Warenkäufe als Verbraucher (§ 13 BGB), nicht für echte Unternehmenskäufe (§ 14 BGB).</p><section className="card"><h2>Geschäftliche Käufe (B2B)</h2><p>{B2B_WITHDRAWAL_NOTE}</p><p>{BUYER_PURPOSE_NOTE}</p></section>
 <p>Verkäufer und Ansprechpartner für deinen Widerruf ist H &amp; K Projekt UG. Die Rücksendeadresse für Verbraucher bleibt Lehmkoppel 7, 25499 Tangstedt. Eine vorherige Genehmigung oder RMA-Nummer eines Lieferanten ist für den Verbraucherwiderruf nicht erforderlich.</p>
 <div style={{whiteSpace:'pre-line',lineHeight:1.8,marginTop:28}}>{CONSUMER_WITHDRAWAL_TEXT}</div>
 <h2>Widerruf online erklären</h2><p>Für Verbraucher bleibt die Erklärung ohne Anmeldung erreichbar. Eine Eingangsbestätigung bestätigt die Übermittlung, sie begründet kein zusätzliches Widerrufsrecht für Unternehmenskäufe.</p><Link className="button" href="/widerruf-online">Vertrag widerrufen</Link><p><Link href="/kontakt">Kontakt aufnehmen</Link></p>
 {process.env.SITE_LIVE_APPROVED!=='true'&&<p className="note">Die übrige rechtliche und technische Shop-Endabnahme bleibt offen.</p>}
 </main>}
