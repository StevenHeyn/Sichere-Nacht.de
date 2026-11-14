# SECPLAN-Direktversand: verbindlicher Arbeitsstand

## Vom Betreiber bestätigt
- Verkäufer und Rechnungsaussteller: H & K Projekt UG (haftungsbeschränkt), Sichere Nacht.
- Reines Dropshipping: SECPLAN versendet die Ware, Sichere Nacht unterhält für diesen Ablauf keinen eigenen Warenversand.
- Deutschland, 9,90 EUR brutto Versand pro Kundenbestellung, 2–4 Werktage nach Zahlungseingang für bei SECPLAN vorrätige Artikel. Keine Übernahme der abweichenden B2B-Versandtarife von SECPLAN in den Kundenshop.
- Montage im Raum Hamburg weiterhin gesondert, nicht automatisch mit der Warenlieferung.
- **Bestellkanal am 14.11.2026 vom Betreiber benannt: das SECPLAN-Händlerportal unter https://www.secplan.de/account/login.** Die Auswahl des manuellen Bestellwegs ist damit geklärt. Zugangsdaten werden nicht im Shop gespeichert oder angefragt.

## Öffentliche Seite geprüft, Kundenkonto nicht eingesehen
Die exakt angegebene Seite bietet die Anmeldung für bestehende Kunden und Shopzugang für Fachhändler. SECPLAN unterscheidet ausdrücklich zwischen Kundenkonto und freigeschaltetem Shopzugang. Ohne angemeldeten Zugang ist weder die Freischaltung dieses konkreten Kontos noch der kundenspezifische Dropshipping-Abschluss nachgewiesen. Die Seite erwähnt Bestellübersicht und Versandinformationen; daraus wird keine automatische Shop-Schnittstelle abgeleitet. Öffentlich sichtbare Lieferwerbung wurde nicht als zugesagte Lieferzeit für Sichere Nacht übernommen.

## Technischer Ablauf
Bezahlte Bestellung → Lieferantenstatus `pending` → SECPLAN-Händlerportal öffnen und anmelden → Verfügbarkeit tatsächlich prüfen → Auftragsentwurf mit Liefername, Lieferadresse, SKU/Mengen → Artikel und Mengen manuell ins Portal übernehmen, H & K als Auftraggeber und abweichende Kundenlieferadresse vor dem Abschluss prüfen → erst nach tatsächlicher Portalbestellung `submitted` mit Übermittlungs-/Bestandsbeleg → `confirmed` mit SECPLAN-Bestätigung → `shipped` ausschließlich mit Beleg und tatsächlichem Versanddatum aller Positionen → bestehende steuerlich gesicherte Rechnungserstellung.

Falls die abweichende Kundenlieferadresse bzw. der vereinbarte Direktversand im konkreten Konto nicht auswählbar ist, zuerst SECPLAN kontaktieren. Es werden keine nach Anmeldung ungesehenen Feldnamen, Warenkorbimporte oder Schnittstellenfunktionen behauptet. Die interne Bestellreferenz aus dem Auftragsentwurf dient zur manuellen Zuordnung, soweit sie im Lieferantenprozess angegeben werden kann.

Der Portal-Link ist ein gewöhnlicher externer Link mit `noopener noreferrer` und `no-referrer`. Er enthält weder Kundendaten noch Admin-Token, übermittelt keinen Warenkorb und ändert keinen Status. Der Entwurf bleibt ausdrücklich nicht versendet. Es gibt weiterhin keine angebundene SECPLAN-API oder automatische Auftragsübermittlung. Testbestellungen dürfen nicht als echte Lieferantenaufträge exportiert oder im Portal bestellt werden. Liefername wird getrennt vom Rechnungsempfänger aus Stripe erfasst. Für alte Datensätze ohne Liefername wird kein Ersatzname geraten.

Neue Lieferantenstatusdaten liegen getrennt von den über Stripe aktualisierten Zahlungsdaten. Doppelte Zahlungs-Webhooks können sie nicht auf `pending` zurücksetzen. Statuswechsel sind gesperrt, bis Vorgänger und erforderliche Nachweise vorhanden sind; wiederholte identische Bestätigungen erzeugen keinen zweiten Protokolleintrag. Bereits früher als versendet markierte Datensätze heißen `legacy`: kein rückwirkender SECPLAN-Nachweis wird erfunden.

## Datenschutz
Nur notwendige Lieferdaten, Artikel und Mengen werden für den Direktversand bereitgestellt. Keine Kartendaten, PaymentIntent-/Stripe-Kennungen, VP-Zuordnung, Kundeneinkaufspreise oder Rechnungsanschrift im Lieferantenentwurf. Kunden-E-Mail/Telefon werden nicht standardmäßig exportiert. Für zusätzliche Transporteur-Services zuerst Erforderlichkeit und Information prüfen. Die tatsächliche Rollen-/Vertragsregelung mit SECPLAN ist zu dokumentieren; kein unbelegter AV-Vertrag wird behauptet.

## Retouren
Kundenservice, Widerruf und Mängelrechte bleiben bei H & K Projekt UG. Die bisher veröffentlichte Rücksendeadresse Lehmkoppel 7 bleibt unverändert. Keine automatische Umleitung nach SECPLAN und keine RMA-Pflicht als Voraussetzung des Verbraucherwiderrufs. Eine abweichend vereinbarte Rücksendeadresse und der Umgang mit Mängel-RMA sind vor Umsetzung nachzuweisen.

## Offene Lieferantennachweise (nicht als erledigt markieren)
1. Der manuelle Portal-Bestellweg ist festgelegt. Noch nicht nachgewiesen: eigener freigeschalteter Shopzugang, konkrete Dropshipping-Adressauswahl, Kundennummer, ggf. neutraler Lieferschein und Abrechnungsweg. Keine Passwörter in Chat oder Shop hinterlegen.
2. Verfügbarkeit pro SKU und Menge, Lieferzeitdefinition und Versand-/Tracking-Rückmeldung. Keine Live-Bestandsschnittstelle derzeit.
3. Aktuelle LUCID-Registrierung und gesonderter Systembeteiligungsnachweis für die tatsächlich betroffenen Verpackungen. Keine pauschale eigene Versandverpackungsregistrierung als Startblocker allein wegen des bestätigten Direktversands; konkrete Rollen/Markenverpackung/Import-Konstellation und aktuelle Rechtslage gesondert prüfen.
4. Vereinbarung für Verbraucherwiderrufe, Rücksendeadresse, Gutschriften und Gewährleistungs-RMA. Keine ungeprüfte Übernahme von B2B-Retourenbedingungen.
5. Hersteller-/EU-Verantwortlichen-/Warnhinweise für angebotene Artikel.

## Anfrageentwurf an SECPLAN (nicht versendet)
Betreff: Direktversand für Sichere Nacht – Abwicklung und Nachweise

Guten Tag,
für unseren Shop Sichere Nacht verkaufen wir Ajax-Produkte als H & K Projekt UG (haftungsbeschränkt) und lassen sie direkt durch Sie an unsere Kunden in Deutschland versenden. Als manuellen Bestellweg nutzen wir Ihren Händlershop. Bitte bestätigen Sie für unser Konto die Abwicklung mit abweichenden Kundenlieferadressen, Bestandsabfrage, Auftragsannahme, Versand-/Tracking-Rückmeldung und den Ablauf bei Verbraucherwiderrufen bzw. Gewährleistungsfällen. Bitte senden Sie außerdem Ihre aktuelle LUCID-Registrierungsnummer und einen Nachweis der einschlägigen Systembeteiligung sowie die benötigten Produktsicherheitsinformationen. Bitte teilen Sie uns mit, wie Endkunden-Lieferdaten verarbeitet werden und welche Verpackungs-/Lieferscheinkennzeichnung eingesetzt wird. Unser Endkundenpreis für Versand und die zugesagte Lieferzeit ersetzen keine gesonderte Lieferantenvereinbarung.
Vielen Dank.
H & K Projekt UG (haftungsbeschränkt)

## Quellen und Abgrenzung
- Vom Betreiber bereitgestellte und öffentlich geprüfte Loginseite am 14.11.2026: https://www.secplan.de/account/login. Kein Login, keine Registrierung, keine tatsächliche Lieferantenbestellung durchgeführt.
- Frühere Quellenbasis für Firma, Retouren und Verpackungsrollen (13.11.2026): https://www.secplan.de/impressum ; https://www.secplan.de/service/kontakt/ ; https://www.secplan.de/versand-und-zahlungsbedingungen ; https://www.verpackungsregister.org/themen/dropshipping ; https://www.verpackungsregister.org/themen/pruefung-registrierungsstatus ; https://www.verpackungsregister.org/themen/versand-und-onlinehandel . Die Portalergänzung ist keine erneute rechtliche Gesamtprüfung.

Die übrigen Go-live-Sperren bleiben bestehen. Dieser Implementierungsstand ist weder Lieferantenbeauftragung noch Abschlussbestätigung rechtlicher Prüfungen.
