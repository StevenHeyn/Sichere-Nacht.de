import Link from 'next/link';
export const metadata={title:'Versand und Bezahlung | Sichere Nacht'};
export default function Versand(){return <main className="wrap" style={{maxWidth:850,paddingBottom:80}}>
 <Link href="/" className="accent">← Startseite</Link>
 <h1>Versand &amp; Bezahlung</h1>
 <h2>Liefergebiet</h2>
 <p>Wir liefern aktuell ausschließlich innerhalb Deutschlands. Lieferungen nach Österreich und in andere Länder werden derzeit nicht angeboten.</p>
 <h2>Lieferzeit</h2>
 <p><strong>Vorrätige Artikel: 2–4 Werktage</strong> innerhalb Deutschlands. Die Frist beginnt bei Onlinezahlung nach Zahlungseingang. Sonn- und gesetzliche Feiertage zählen nicht als Werktage.</p>
 <p>Ist ein Artikel nicht vorrätig oder hat er eine abweichende Lieferzeit, muss dies vor der Bestellung beim jeweiligen Artikel und im Bestellprozess gesondert angegeben werden.</p>
 <h2>Versandkosten</h2>
 <p>Pro Bestellung berechnen wir deutschlandweit eine Versandpauschale von <strong>9,90 € inklusive gesetzlicher Umsatzsteuer</strong>, unabhängig von der Zahl der bestellten Artikel. Der vollständige Gesamtbetrag wird im Warenkorb vor Abschluss der Bestellung angezeigt.</p>
 <h2>Bezahlung</h2>
 <p>Die Bezahlung erfolgt über den Zahlungsdienstleister Stripe. Die konkret verfügbaren Zahlungsarten werden im Bestellprozess angezeigt. Der Shop nimmt in dieser Vorschau ausschließlich Testzahlungen an; echte Zahlungen werden erst nach der technischen und rechtlichen Freigabe aktiviert.</p>
 <h2>Montageservice</h2>
 <p>Ein Montageservice im Raum Hamburg und Umgebung ist gesondert anfragbar. Die geplante Pauschale beträgt 199 € brutto, vorbehaltlich Prüfung des Einsatzortes und Leistungsumfangs. Eine verbindliche Montagebuchung kommt erst nach separater Bestätigung zustande.</p>
 <p className="note">Diese Seite befindet sich in der rechtlichen und kaufmännischen Endabnahme.</p>
 </main>}