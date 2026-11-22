import type {Metadata} from 'next';
import Link from 'next/link';
import './portal.css';
export const metadata:Metadata={title:'Sichere Nacht · Partnerportal',description:'Geschützter Arbeitsbereich für Vertriebspartner, Agenturen und Montagepartner.',robots:{index:false,follow:false,noarchive:true}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="de"><body><a className="skip" href="#content">Zum Inhalt</a><header className="topbar"><Link href="/" className="brand"><span className="brandMark">S</span><span>SICHERE <b>NACHT</b><small>PARTNERPORTAL</small></span></Link><span className="privateBadge">Geschützter Partnerbereich</span></header><div id="content">{children}</div><footer><span>H&amp;K Projekt UG (haftungsbeschränkt) · Lehmkoppel 7 · 25499 Tangstedt</span><nav><Link href="/datenschutz">Datenschutz</Link><Link href="/vertrag">VP-Vertrag</Link><a href="mailto:bestellungen@sichere-nacht.de">Support</a></nav></footer></body></html>}
