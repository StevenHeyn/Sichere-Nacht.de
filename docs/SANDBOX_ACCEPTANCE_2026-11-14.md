# Tatsächliche B2C-/B2B-Bestellabnahme am 14.11.2026

## Ergebnis
Die beiden vom Betreiber im Browser abgeschlossenen Stripe-Testzahlungen sind auf dem Shopstand aus PR #15 erfolgreich bis zu Bestellspeicherung und Bestätigungsmail verarbeitet worden. Danach wurden nur diese beiden als Tests markierten Bestellungen durch den simulierten Lieferanten-/Rechnungsablauf geführt. Kein echter SECPLAN-Auftrag, keine Warenbewegung und keine echte Zahlung wurden ausgelöst.

| Prüfung | Privatkauf | Geschäftskauf |
|---|---|---|
| Interne Bestellreferenz | SN-B-13 | SN-B-14 |
| Gesamtsumme inkl. Versand | 1.568,90 EUR | 1.879,00 EUR |
| Enthaltene Umsatzsteuer | 250,50 EUR | 300,01 EUR |
| Deutschlandversand brutto | 9,90 EUR | 9,90 EUR |
| Stripe-Modus / Status | test / complete / paid | test / complete / paid |
| Kaufart gespeichert | b2c | b2b, Firmenname und aktive Geschäftskauferklärung gespeichert |
| Bestellung je Sitzung | genau 1 | genau 1 |
| Ursprünglicher Webhook | tatsächlich eingegangen und verarbeitet | tatsächlich eingegangen und verarbeitet |
| Bestätigungsmail / Anbieterstatus | sent / delivered | sent / delivered |
| Unterlagen beim Mailanbieter | Auftragsbestätigung PDF + Widerrufsbelehrung TXT | Auftragsbestätigung PDF + Unternehmenskauf TXT |
| Testrechnung | SN-TEST-2026-000013 | SN-TEST-2026-000014 |
| Rechnungsversand / Anbieterstatus | sent / delivered | sent / delivered |

Die Positionensummen plus Versand entsprechen den Gesamtbeträgen. Die gespeicherte Umsatzsteuer entspricht in beiden Fällen dem gerundeten Betrag Gesamtbrutto × 19 / 119. Rechnungs- und Lieferdaten sind vorhanden, werden hier aber nicht veröffentlicht.

## Konkrete Belege und Grenzen
1. Die ursprünglichen produktionsgleichen Preview-Webhooks liefen am 14.11.2026 um 00:52:42Z und 00:53:49Z auf Deployment dpl_QV8hskCM3pAXTXEpeh2jJh86ditU. Die Datenbankbestellungen entstanden durch diese tatsächlichen Stripe-Testereignisse, nicht durch ein nachträgliches Test-INSERT.
2. Bei der Abnahme wurden beide Sitzungen nochmals mit dem vorhandenen Stripe-Testschlüssel abgefragt: livemode=false, status=complete, payment_status=paid, passende Shop- und Kaufart-Metadaten sowie Beträge bestätigt.
3. Resend bestätigte für beide Bestätigungsmails last_event=delivered. Nachrichteninhalt und die tatsächlich registrierten Anhangsnamen wurden auf B2C/B2B-Zuordnung geprüft. Die heruntergeladenen vollständigen TXT-Anhangsbytes wurden in dieser Abnahme nicht erneut geprüft; die entsprechenden Erzeugungstests waren bereits vorhanden. Delivered belegt die Annahme durch den Empfänger-Mailserver, nicht das Lesen durch den Empfänger oder die Ablage außerhalb des Spamordners.
4. Ein jeweils erneut lokal signiertes Original-Stripe-Testereignis wurde an denselben Test-Webhook geschickt. Beide Antworten HTTP200/stored=true. Danach weiterhin genau eine Bestellung, ein Bestätigungsauftrag und ein Versandversuch je Bestellung. Das war ein gezielter Replay-Test, keine Behauptung einer vom Stripe-Dashboard ausgelösten zweiten Zustellung.
5. Nur die Testaufträge SN-B-13/14 wurden über die vorhandenen Lieferantenstatus-RPCs geführt. Alle Belege heißen ausdrücklich SANDBOX-TEST, keine echte Beauftragung und kein echter Versand. Der sichtbare Status 'shipped' auf diesen TEST-Datensätzen bezeichnet die Simulation, nicht ein SECPLAN-Ereignis. Eine tatsächliche Lieferantenanbindung ist dadurch nicht bewiesen.
6. Die bestehende Rechnungs-Mailroutine wurde mit diesen Testdatensätzen ausgeführt. PDF-Testmarkierung, Kaufart und Firmenadressierung für B2B wurden vor Versand geprüft. Die Prüfung erlaubte ausschließlich den fest eingerichteten internen Testempfänger. Die ausgehenden zwei Nachrichten bekamen zusätzlich [TEST] im Betreff und einen deutlichen Hinweis auf simulierten Versand. Resend meldete beide als delivered.
7. Ein erneuter Rechnungsversand-Aufruf lieferte in beiden Fällen already_sent_or_locked. Je Rechnung blieb genau ein Mailjob mit attempts=1. Das ist kein Nachweis beliebiger paralleler Last-/Ausfallsituationen.
8. Datenbankmigration isolate_test_invoice_numbers trennt neue Sandbox-Rechnungen von der echten Rechnungsnummernfolge. Neue Tests verwenden SN-TEST-Jahr-Bestell-ID. Bereits vorhandene Rechnungen/Snapshots bleiben unverändert. Der reale Sequenzstand blieb während dieser Abnahme bei 2; die alten zwei Testrechnungen wurden nicht gelöscht oder rückwirkend umnummeriert.
9. Vor dem Versand liefen die isolierten SQL-Rechnungs-/Kaufart-/Idempotenzprüfungen in einer zurückgerollten Transaktion erfolgreich. Die temporäre Abnahme war auf Preview, konkreten Testtag, Testsessions, zwei feste Testaufträge und das interne Postfach begrenzt. Ihr separater Freigabeschalter wurde nach Ausführung deaktiviert; der Build-Hook wird nicht nach main übernommen.

## Nicht mehr offen
Die pauschale Aussage „beide aktuellen B2C/B2B-Testzahlungen noch nicht durchgeführt“ ist überholt. Erfolgreiche Testzahlung, ursprüngliche signierte Webhooks, persistierte Bestellungen, passende Bestätigungsmails, der simulierte Lieferantenstatus und Testrechnungsversand wurden für diese zwei Abläufe nachgewiesen.

## Weiterhin offen
- Tatsächliche Zahlungsablehnung und Abbruch im Browser auf dem finalen Stand, Sonderfälle asynchroner Zahlung und umfassende Wiederanlauf-/Paralleltests sind durch diese zwei erfolgreichen Käufe nicht abgedeckt.
- Tatsächlicher SECPLAN-Bestellkanal, Bestands-/Lieferzeit- und Verpackungsnachweise sowie Retouren-/Datenschutzvereinbarung.
- Artikelbezogene Hersteller-/Produktsicherheitsangaben, tatsächliche Datenschutzverträge und Fristen sowie abschließender Abgleich der Vertragsinformationen.
- Kommerziell geeigneter Hostingtarif; zuletzt Vercel Hobby bestätigt. Kein kostenpflichtiges Upgrade vorgenommen.
- Alle vier öffentlichen Zahlungs-/Indexfreigaben bleiben unverändert deaktiviert. Keine pauschale Rechtskonformitäts- oder uneingeschränkte Produktionsreifezusage.

## Aufbewahrung der Belege
Vercel-Testbuild dpl_BM32PatUmDcJcVf4ueuTvueAxYbG enthält nur bereinigte Abnahme-Zusammenfassungen unter SANDBOX_ACCEPTANCE. Keine geheimen Schlüssel, vollständigen Kundenanschriften oder signierten Anhangs-URLs wurden protokolliert. Datenbank-Migrationsdatei: database/isolate_test_invoice_numbers.sql. Wiederholbarer SQL-Rollback-Test: database/test_invoice_isolation_test.sql.
