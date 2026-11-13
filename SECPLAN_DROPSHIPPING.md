# SECPLAN-Direktversand: verbindlicher Arbeitsstand

## Vom Betreiber bestätigt
- Verkäufer und Rechnungsaussteller: H & K Projekt UG (haftungsbeschränkt), Sichere Nacht.
- Reines Dropshipping: SECPLAN versendet die Ware, Sichere Nacht unterhält für diesen Ablauf keinen eigenen Warenversand.
- Deutschland, 9,90 EUR brutto Versand pro Kundenbestellung, 2–4 Werktage nach Zahlungseingang für bei SECPLAN vorrätige Artikel. Keine Übernahme der abweichenden B2B-Versandtarife von SECPLAN in den Kundenshop.
- Montage im Raum Hamburg weiterhin gesondert, nicht automatisch mit der Warenlieferung.

## Technischer Ablauf
Bezahlte Bestellung → Lieferantenstatus `pending` → Verfügbarkeit tatsächlich prüfen → Auftragsentwurf mit Liefername, Lieferadresse, SKU/Mengen → manuelle Übermittlung über den vereinbarten Lieferantenkanal → `submitted` mit Übermittlungs-/Bestandsbeleg → `confirmed` mit SECPLAN-Bestätigung → `shipped` ausschließlich mit Beleg und tatsächlichem Versanddatum aller Positionen → bestehende steuerlich gesicherte Rechnungserstellung.

Der Entwurf ist keine E-Mail und kein automatisch abgeschickter Auftrag. Es wird bewusst keine Auftrags-E-Mail-Adresse oder API erfunden. Die allgemeinen SECPLAN-Kontakte sind kein Nachweis eines vereinbarten Bestellkanals. Testbestellungen dürfen nicht als echte Lieferantenaufträge exportiert werden. Liefername wird getrennt vom Rechnungsempfänger aus Stripe erfasst. Für alte Datensätze ohne Liefername wird kein Ersatzname geraten.

Neue Lieferantenstatusdaten liegen getrennt von den über Stripe aktualisierten Zahlungsdaten. Doppelte Zahlungs-Webhooks können sie nicht auf `pending` zurücksetzen. Statuswechsel sind gesperrt, bis Vorgänger und erforderliche Nachweise vorhanden sind; wiederholte identische Bestätigungen erzeugen keinen zweiten Protokolleintrag. Bereits früher als versendet markierte Datensätze heißen `legacy`: kein rückwirkender SECPLAN-Nachweis wird erfunden.

## Datenschutz
Nur notwendige Lieferdaten, Artikel und Mengen werden für den Direktversand bereitgestellt. Keine Kartendaten, PaymentIntent-/Stripe-Kennungen, VP-Zuordnung, Kundeneinkaufspreise oder Rechnungsanschrift im Lieferantenentwurf. Kunden-E-Mail/Telefon werden nicht standardmäßig exportiert. Für zusätzliche Transporteur-Services zuerst Erforderlichkeit und Information prüfen. Die tatsächliche Rollen-/Vertragsregelung mit SECPLAN ist zu dokumentieren; kein unbelegter AV-Vertrag wird behauptet.

## Retouren
Kundenservice, Widerruf und Mängelrechte bleiben bei H & K Projekt UG. Die bisher veröffentlichte Rücksendeadresse Lehmkoppel 7 bleibt unverändert. Keine automatische Umleitung nach SECPLAN und keine RMA-Pflicht als Voraussetzung des Verbraucherwiderrufs. Eine abweichend vereinbarte Rücksendeadresse und der Umgang mit Mängel-RMA sind vor Umsetzung nachzuweisen.

## Offene Lieferantennachweise (nicht als erledigt markieren)
1. Vereinbarter Kanal für Bestellungen, Kundennummer, ggf. neutraler Lieferschein und Abrechnungsweg.
2. Verfügbarkeit pro SKU und Menge, Lieferzeitdefinition und Versand-/Tracking-Rückmeldung. Keine Live-Bestandsschnittstelle derzeit.
3. Aktuelle LUCID-Registrierung und gesonderter Systembeteiligungsnachweis für die tatsächlich betroffenen Verpackungen. Keine pauschale eigene Versandverpackungsregistrierung als Startblocker allein wegen des bestätigten Direktversands; konkrete Rollen/Markenverpackung/Import-Konstellation und aktuelle Rechtslage gesondert prüfen.
4. Vereinbarung für Verbraucherwiderrufe, Rücksendeadresse, Gutschriften und Gewährleistungs-RMA. Keine ungeprüfte Übernahme von B2B-Retourenbedingungen.
5. Hersteller-/EU-Verantwortlichen-/Warnhinweise für angebotene Artikel.

## Anfrageentwurf an SECPLAN (nicht versendet)
Betreff: Direktversand für Sichere Nacht – Abwicklung und Nachweise

Guten Tag,
für unseren Shop Sichere Nacht verkaufen wir Ajax-Produkte als H & K Projekt UG (haftungsbeschränkt) und lassen sie direkt durch Sie an unsere Kunden in Deutschland versenden. Bitte bestätigen Sie uns den vereinbarten Bestellkanal, Bestandsabfrage, Auftragsannahme, Versand-/Tracking-Rückmeldung und den Ablauf bei Verbraucherwiderrufen bzw. Gewährleistungsfällen. Bitte senden Sie außerdem Ihre aktuelle LUCID-Registrierungsnummer und einen Nachweis der einschlägigen Systembeteiligung sowie die benötigten Produktsicherheitsinformationen. Bitte teilen Sie uns mit, wie Endkunden-Lieferdaten verarbeitet werden und welche Verpackungs-/Lieferscheinkennzeichnung eingesetzt wird. Unser Endkundenpreis für Versand und die zugesagte Lieferzeit ersetzen keine gesonderte Lieferantenvereinbarung.
Vielen Dank.
H & K Projekt UG (haftungsbeschränkt)

## Quellen und Abgrenzung (geprüft 13.11.2026)
- SECPLAN-Firmierung/Anschrift: https://www.secplan.de/impressum und https://www.secplan.de/service/kontakt/
- SECPLAN veröffentlicht RMA für defekte Produkte, nicht unsere konkrete Verbraucherwiderrufsvereinbarung: https://www.secplan.de/versand-und-zahlungsbedingungen
- ZSVR Dropshipping: https://www.verpackungsregister.org/themen/dropshipping
- Registrierung ersetzt nicht den Systembeteiligungsnachweis: https://www.verpackungsregister.org/themen/pruefung-registrierungsstatus
- Aktuelle Verpackungsrollen einschließlich PPWR nicht pauschal aus älteren Merkblättern ableiten: https://www.verpackungsregister.org/themen/versand-und-onlinehandel

Die übrigen Go-live-Sperren bleiben bestehen. Dieser Implementierungsstand ist weder Lieferantenbeauftragung noch Abschlussbestätigung rechtlicher Prüfungen.
