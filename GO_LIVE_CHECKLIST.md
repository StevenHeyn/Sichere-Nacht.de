# Sichere Nacht – aktueller Go-live-Stand

## Verkaufsmodell und bestätigte Vorgaben
Verkäufer und Rechnungsaussteller ist H & K Projekt UG (haftungsbeschränkt). **SECPLAN versendet direkt an den Kunden im reinen Dropshipping.** Kein eigener Warenversand in diesem Ablauf. Deutschland, 9,90 EUR brutto Versand je Bestellung, 2–4 Werktage nach Zahlungseingang für tatsächlich bei SECPLAN vorrätige Artikel; Montage weiterhin nur gesondert.

**Bestellweg seit Betreiberangabe am 14.11.2026 geklärt: manuell über https://www.secplan.de/account/login.** Der Link wird im geschützten Bestellbereich angezeigt. Keine automatische Datenübergabe, keine gespeicherten SECPLAN-Zugangsdaten und keine API-Anbindung. Die Freischaltung des konkreten Kontos und der tatsächlich mögliche Direktversand sind durch die öffentliche Loginseite nicht nachgewiesen.

Die bisherigen Hinweise auf einen eigenen Verpackungs-/Versandbetrieb werden durch [SECPLAN_DROPSHIPPING.md](SECPLAN_DROPSHIPPING.md) ersetzt. Das ist keine Annahme, dass Lieferanten-Nachweise bereits vorliegen.

## Bereits nachgewiesene technische Basis
- Shop/Design und Bestellverwaltung nach main zusammengeführt; eigene Domain mit Vercel verbunden.
- Stripe-, Supabase- und Resend-Produktionsanbindung im Read-only-Systemcheck erfolgreich; Resend-Absenderdomain verifiziert.
- Nutzer hat den Online-Widerruf einschließlich tatsächlichem E-Mail-Eingang und Inhalt getestet.
- Kontrollierter Schreibtest mit dem tatsächlich hinterlegten rk_live_-Schlüssel bestanden: Checkout angelegt, geschlossen, Positionen/SKU gelesen, Status expired/unpaid. Kein echter Zahlungsabschluss.
- Die beiden aktuellen Browser-Testkäufe SN-B-13 (B2C) und SN-B-14 (B2B) wurden bis zur Bestellung und passenden Bestätigungsmail nachgewiesen. Originale Stripe-Testwebhooks sind eingegangen. Nur diese Testbestellungen wurden anschließend durch simulierte Lieferantenschritte und internen Testrechnungsversand geführt. Replay ohne doppelte Bestellungen/Mails erfolgreich. Detailbeleg: [docs/SANDBOX_ACCEPTANCE_2026-11-14.md](docs/SANDBOX_ACCEPTANCE_2026-11-14.md).
- Neue Testrechnungen verwenden SN-TEST-Nummern; die echte Rechnungsfolge wird dafür nicht weitergezählt. Bestehende Dokumente wurden nicht umnummeriert.
- Sichere Nacht wird in der eigenen Oberfläche angezeigt. Die verwendete Stripe-Formintegration sendet keine dort unzulässigen `branding_settings`/`custom_text`-Parameter. Fremde Shop-Zahlungen werden nicht als eigene Bestellung übernommen.

## Dropshipping-Anpassung
- Lieferant und Verkäufer in Versandseite, AGB, Datenschutz, Widerruf, Produkt-/Warenkorbhinweisen und Kundenmails getrennt beschrieben.
- Liefername getrennt vom Rechnungsempfänger; keine stillschweigende Ersatzadresse.
- Lieferantenaufträge ausschließlich manuell über das benannte Händlerportal. Adminbereich: datensparsamer Entwurf, Bestandsprüfung und Portal-Übermittlungsbeleg, SECPLAN-Auftragsbestätigung, tatsächlicher vollständiger Versand mit Beleg und Datum, optional Tracking.
- Portalöffnung bzw. Zahlungseingang setzt keinen Lieferantenstatus auf beauftragt oder versendet. Zahlungswebhooks überschreiben den separat gespeicherten Lieferantenfortschritt nicht.
- Migrationen für Lieferantenstatus und isolierte Testrechnungen sind angewendet und mit zurückgerollten Datenbanktests geprüft; Belege in PR #13 und PR #16. Kein echter SECPLAN-Auftrag wurde dadurch ausgelöst.

## Noch offene Freigaben
1. **SECPLAN:** Der Bestellkanal ist nicht mehr offen. Noch prüfen: eigener Shopzugang, die konkreten Direktversandbedingungen/Adressauswahl, Bestands-/Lieferzeitprüfung und Rückmeldungen, Verpackungsnachweise und betriebliche Rollen.
2. **Retouren:** H & K bleibt zuständig; veröffentlichte Rücksendeadresse Lehmkoppel 7 bleibt. Direkte Verbraucherretouren an SECPLAN erst bei belegter Vereinbarung, keine verpflichtende Lieferanten-RMA für Verbraucherwiderrufe.
3. **Produktsicherheit und Lieferbarkeit:** Artikelbezogene Hersteller-/EU-Verantwortlichen-/Warnhinweise vervollständigen. Katalogpreis ist kein Lagerbestand; Nullpreispositionen bleiben nicht kaufbar.
4. **Verbraucherinformationen und Datenschutz:** Finale Vertragsannahme, Pflichtinformationen/Bestellbutton und Vertragsunterlagen, tatsächlich geltende Dienstleisterverträge, Speicher-/Löschfristen und Übermittlungsgrundlagen prüfen. Keine rechtliche Gesamtfreigabe allein aus Code oder Tests ableiten.
5. **Verbleibende Zahlungsfehlerfälle:** Ablehnung und Abbruch im Browser, asynchrone Sonderfälle und weitere Wiederanlauffälle sind nicht durch die zwei erfolgreichen Käufe vollständig abgedeckt. Erfolgreiche aktuelle B2C-/B2B-Käufe nicht erneut pauschal als fehlend bezeichnen.
6. **Hosting:** Zuletzt Hobby für das verbundene Vercel-Team bestätigt, kein kostenpflichtiges Upgrade ausgelöst. Geeigneten kommerziellen Tarif gesondert freigeben; Datum und Quellen siehe PR #15/#16 und Freigabeprotokolle.
7. **Gesonderte Verkaufsfreigabe:** CHECKOUT_ENABLED, NEXT_PUBLIC_CHECKOUT_ENABLED, PAYMENTS_LIVE_APPROVED und SITE_LIVE_APPROVED bleiben unverändert aus. Veröffentlichung einer Website-/Adminverbesserung ist keine Freigabe des Verkaufs.

Lieferantenablauf und unversendeter Anfrageentwurf: [SECPLAN_DROPSHIPPING.md](SECPLAN_DROPSHIPPING.md). Historische Abnahmeberichte bleiben unverändert; dieser Stand aktualisiert die zuvor offene Auswahl des Bestellkanals.
