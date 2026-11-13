# Sichere Nacht – aktueller Go-live-Stand

## Verkaufsmodell und bestätigte Vorgaben
Verkäufer und Rechnungsaussteller ist H & K Projekt UG (haftungsbeschränkt). **SECPLAN versendet direkt an den Kunden im reinen Dropshipping.** Kein eigener Warenversand in diesem Ablauf. Deutschland, 9,90 EUR brutto Versand je Bestellung, 2–4 Werktage nach Zahlungseingang für tatsächlich bei SECPLAN vorrätige Artikel; Montage weiterhin nur gesondert.

Die bisherigen Hinweise auf einen eigenen Verpackungs-/Versandbetrieb werden durch [SECPLAN_DROPSHIPPING.md](SECPLAN_DROPSHIPPING.md) ersetzt. Das ist keine Annahme, dass Lieferanten-Nachweise bereits vorliegen.

## Bereits nachgewiesene technische Basis
- Shop/Design und Bestellverwaltung nach main zusammengeführt; eigene Domain mit Vercel verbunden.
- Stripe-, Supabase- und Resend-Produktionsanbindung im Read-only-Systemcheck erfolgreich; Resend-Absenderdomain verifiziert.
- Nutzer hat den Online-Widerruf einschließlich tatsächlichem E-Mail-Eingang und Inhalt getestet.
- Nutzer hat den kontrollierten Schreibtest mit dem tatsächlich hinterlegten rk_live_-Schlüssel bestanden: Checkout angelegt, geschlossen, Positionen/SKU gelesen, Status expired/unpaid. Kein echter Zahlungsabschluss.
- Frühere Testbestellungen samt Bestätigungsmails und zwei Rechnungen vorhanden; die neuesten zwei steuerpflichtigen Testbestellungen hatten positive Steuerbeträge.
- Checkout pro Sitzung mit Marke Sichere Nacht, Verarbeitung nur für passende Shopkennung; keine Übernahme fremder Shop-Zahlungen.

## Dropshipping-Anpassung
- Lieferant und Verkäufer in Versandseite, AGB, Datenschutzhinweisen, Widerruf, Produkt-/Warenkorbhinweisen und Kundenmails getrennt beschrieben.
- Tatsächlicher Liefername getrennt vom Rechnungsempfänger; keine stillschweigende Ersatzadresse.
- Lieferantenaufträge derzeit ausschließlich manuell. Neuer Adminbereich: datensparsamer Auftragsentwurf, Übermittlung/Bestandsbeleg, SECPLAN-Auftragsbestätigung, tatsächlicher vollständiger Versand mit Beleg und Datum, optional Transporteur/Tracking.
- Zahlungsbestätigung setzt keinen Lieferantenstatus auf beauftragt oder versendet. Wiederholte Webhooks überschreiben den separat gespeicherten Lieferantenfortschritt nicht.
- Neue Migration database/secplan_dropship.sql ist vor Produktivbereitstellung anzuwenden und mit Rollback-Testfällen zu prüfen. Testergebnisse und Deployment müssen im PR nachgewiesen werden.

## Noch offene Freigaben
1. **SECPLAN-Nachweise:** vereinbarter Bestellkanal, Bestandsprüfung, Versand-/Tracking-Rückmeldung, LUCID-/Systembeteiligungsnachweis und konkrete Verpackungsrollen. Kein pauschaler eigener Versandverpackungs-Vertrag allein wegen dieses Dropshippingmodells, aber auch keine ungeprüfte Befreiung für beliebige künftige Eigenversand-/Import-/Markenverpackungsszenarien.
2. **Retourenvereinbarung:** H & K bleibt zuständig. Die veröffentlichte Rücksendeadresse Lehmkoppel 7 bleibt, solange keine andere Verbraucherretouren-Vereinbarung nachgewiesen ist. Keine verpflichtende SECPLAN-RMA für Verbraucherwiderrufe.
3. **Produktsicherheit und Verfügbarkeit:** Hersteller-/EU-Verantwortlichen-/Warnhinweise pro Produkt ergänzen; konkrete Lieferbarkeit und Lieferfristen prüfen. 890 regulär bepreiste Artikel sind nicht automatisch 890 verfügbare Artikel. Nullpreis-Materialien sind nicht kaufbar.
4. **Konsistente Verbraucherinformationen:** finale Vertragsannahme, Pflichtinformationen/Bestellbutton, Widerrufsprozess und dauerhafte Vertragsbestätigung. Die Anpassungen ersetzen keine abschließende Fachprüfung.
5. **Datenschutz:** tatsächliche SECPLAN-Rollen/Verträge, notwendige Datenweitergabe, Speicher-/Löschfristen und übrige Dienstleister-Verträge/Drittlandgrundlagen dokumentieren. Keine unbelegte Einwilligung oder AV-Vereinbarung behaupten.
6. **Vollständiger Sandbox-Test auf aktuellem Stand:** Testzahlung → signierter Webhook → eine Bestellung → interne Bestätigung → simulierte SECPLAN-Schritte → Rechnung. Doppelte Events und Ausfälle prüfen. Keine simulierten Echtgeld-Zahlungen.
7. **Gesonderte Verkaufsfreigabe:** CHECKOUT_ENABLED, NEXT_PUBLIC_CHECKOUT_ENABLED, PAYMENTS_LIVE_APPROVED und SITE_LIVE_APPROVED bleiben unverändert aus. Aktivierung erst nach Abnahme. Websiteveröffentlichung ist nicht gleich Freigabe des Verkaufs.

Detaillierte Quellen und unversendeter Lieferanten-Anfrageentwurf: [SECPLAN_DROPSHIPPING.md](SECPLAN_DROPSHIPPING.md).
