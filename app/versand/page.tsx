import Link from 'next/link';
import {deliveryPolicy} from '../../lib/delivery-policy';
export const metadata={title:'Versand und Bezahlung | Sichere Nacht'};
export default function Versand(){return <main className="wrap" style={{maxWidth:850,paddingBottom:80}}>
 <Link href="/" className="accent">← Startseite</Link><h1>Versand &amp; Bezahlung</h1>
 <h2>Direktversand durch SECPLAN</h2>
 <p>Du kaufst bei {deliveryPolicy.seller}, dem Betreiber von Sichere Nacht. Die bestellten Produkte werden durch unseren Lieferanten {deliveryPolicy.supplier} direkt an deine Lieferadresse versendet. Wir betreiben für diesen Ablauf keinen eigenen Warenversand.</p>
 <p>Dein Vertragspartner und Rechnungsaussteller bleibt die H &amp; K Projekt UG. Bei Fragen zur Bestellung, Lieferung, Gewährleistung oder zum Widerruf wendest du dich an uns. Die Versandabwicklung durch SECPLAN schränkt deine gesetzlichen Rechte nicht ein.</p>
 <h2>Liefergebiet und Versandkosten</h2>
 <p>Wir liefern ausschließlich innerhalb Deutschlands. Pro Bestellung berechnen wir pauschal <strong>9,90 € inklusive gesetzlicher Umsatzsteuer</strong>. Die Versandkosten werden vor Abschluss der Bestellung ausgewiesen. Lieferungen nach Österreich und in andere Länder werden nicht angeboten.</p>
 <h2>Lieferzeit und Verfügbarkeit</h2>
 <p><strong>2–4 Werktage</strong> nach Zahlungseingang für bei SECPLAN vorrätige Artikel. Sonn- und gesetzliche Feiertage zählen nicht als Werktage. Abweichende Lieferzeiten werden vor der Bestellung beim betroffenen Artikel angegeben.</p>
 <p>Die Verfügbarkeit richtet sich nach dem tatsächlichen Bestand bei SECPLAN, nicht nach einem eigenen Lager von Sichere Nacht. Die Aufnahme eines Artikels in unseren Katalog bedeutet allein noch keine bestätigte Lieferbarkeit. Der Lieferantenbestand wird derzeit manuell geprüft; eine automatische Live-Bestandsanzeige ist noch nicht angeschlossen.</p>
 <h2>Auftrags- und Versandbestätigung</h2>
 <p>Nach der Zahlungsprüfung bearbeiten wir deine Bestellung und übermitteln die erforderlichen Lieferdaten an SECPLAN. Eine Zahlungs- oder Bestellbestätigung ist noch keine Versandbestätigung. Den Versandstatus übernehmen wir erst nach der tatsächlichen Versandbestätigung des Lieferanten. Soweit eine Sendungsnummer vorliegt, stellen wir die Informationen auf Anfrage zur Verfügung.</p>
 <h2>Bezahlung und Rechnung</h2>
 <p>Die Bezahlung wird über Stripe abgewickelt. Verfügbare Zahlungsarten und der vollständige Gesamtbetrag werden im Bestellprozess angezeigt. Deine Rechnung erhältst du von H &amp; K Projekt UG, nicht von SECPLAN. Es entsteht keine zusätzliche Zahlungsverpflichtung gegenüber SECPLAN.</p>
 <h2>Widerruf, Rücksendungen und Mängel</h2>
 <p>Für Widerrufe und Rücksendungen gilt unsere <Link href="/widerruf">Widerrufsbelehrung</Link>. Rücksendeadresse ist unverändert: {deliveryPolicy.returnsAddress}. Bitte sende nicht ohne entsprechende Vereinbarung an SECPLAN. Eine vorherige Kontaktaufnahme kann die Zuordnung erleichtern, ist aber keine Voraussetzung für deinen Widerruf oder die fristgerechte Rücksendung an die genannte Adresse.</p>
 <p>Eine SECPLAN-RMA-Nummer ist keine Voraussetzung für die Ausübung deines Verbraucherwiderrufs. Mängel meldest du bei Sichere Nacht; wir koordinieren die weitere Abwicklung. Es gelten die gesetzlichen Mängelhaftungsrechte.</p>
 <h2>Montage</h2><p>Die optionale Montage im Raum Hamburg und Umgebung wird gesondert vereinbart. Die geplante Pauschale von 199 € brutto setzt eine individuelle Prüfung des Einsatzorts und Leistungsumfangs sowie eine separate Auftrags- und Terminbestätigung voraus.</p>
 {process.env.SITE_LIVE_APPROVED!=='true'&&<p className="note">Der Shop befindet sich in der Endabnahme. Der öffentliche Verkauf bleibt gesperrt, bis die Lieferanten-, Bestands- und übrigen Freigabeprüfungen abgeschlossen sind.</p>}
 </main>}
