import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import ReferralCapture from './referral-capture';
export const metadata: Metadata = {
 title: 'Sichere Nacht | Ajax Alarmanlagen',
 description: 'Ajax Alarmanlagen individuell konfigurieren. Optionaler Montageservice in Hamburg und Umgebung.',
 robots:{index:process.env.SITE_LIVE_APPROVED==='true',follow:process.env.SITE_LIVE_APPROVED==='true'}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="de"><head><Script src="https://js.stripe.com/dahlia/stripe.js" strategy="beforeInteractive"/></head><body><ReferralCapture/>{children}<footer className="footer"><div className="wrap"><div className="footerGrid"><div><strong>SICHERE <span className="accent">NACHT</span></strong><p>H&amp;K Projekt UG (haftungsbeschränkt)<br/>Lehmkoppel 7 · 25499 Tangstedt<br/>Deutschland</p></div><div><Link href="/shop">Ajax-Shop</Link><Link href="/konfigurator">Konfigurator</Link><Link href="/warenkorb">Warenkorb</Link><Link href="/kontakt">Kontakt</Link></div><div><Link href="/impressum">Impressum</Link><Link href="/datenschutz">Datenschutz</Link><Link href="/versand">Versand & Bezahlung</Link><Link href="/widerruf">Widerruf</Link></div></div><p className="note">Shop-Testbetrieb: Es werden keine echten Zahlungen angenommen. Die rechtlichen und technischen Angaben werden vor dem Livegang abschließend geprüft.</p></div></footer></body></html>}
