# Partnerportal – geprüfter Stand vom 14. November 2026

Projekt: `sichere-nacht-partner`, Root `partner-portal`, Branch `feature/partner-portal-v1` / PR #19. Separater Zugang; keine Verlinkung in der öffentlichen Shopnavigation.

## Änderungen dieser Prüfung

- D2D-Adressauswahl behält auch ab Seite 2 den Seitenoffset; stabile Sortierung mit eindeutiger ID. Beim Gebietswechsel erscheinen keine Punkte aus dem vorherigen Gebiet.
- Ein neuer Kontakt übernimmt keine Einwilligung, Nachweise oder Erhebungszwecke eines zuvor gespeicherten Kontakts.
- Abgelaufene Adressreservierungen geben kein bearbeitbares Kontaktformular mehr frei. Ein abgeschlossener oder fremder Gebietsimport ist im UI gesperrt; Datenbankrechte bleiben maßgeblich.
- Administration kann eine tatsächlich erfolgte Reserveauszahlung mit Belegreferenz verbuchen; keine Überweisung wird ausgelöst.
- Datenbank-/Kontofehler werden von fehlender Anmeldung unterschieden. Verbindungsfehler erhalten HTTP 503, ohne Geheimnisse auszugeben.
- Abhängigkeiten exakt fixiert, Lockfile eingecheckt, CI verwendet `npm ci`.
- Drei operative Einstiegsunterlagen zu Konto/Vertrieb, D2D und Provisionen/Werbemitteln in der Datenbank veröffentlicht. Keine erfundenen Schulungstermine oder Monteur-Prüfungen.

## Nachweise

- 21 Node-Tests bestanden (Provision, Kalendergrenzen, D2D-Seitenwechsel, zurückgesetzte Einwilligungen, Zugriffsregeln).
- Next.js-Produktionsbuild inklusive TypeScript bestanden.
- `partner-portal/tests/database/acceptance.sql`: echter Datenbanktest unter `authenticated`, mit `ROLLBACK`. Geprüft: keine Selbsterhöhung zur Agentur/Admin, Owner/Admin-only D2D-Kontakte auch gegenüber eigener Agentur, Gebiets-/Adresssperren, Buchungskapazität/Idempotenz, Masterclass-Pflicht, 15-/20-%-Abrechnung ohne Doppelprovision, 5-%-Reserve, Folgemonatsfrist, idempotenter Monatsabschluss, Stornokorrektur und Reserveauszahlung nach zwölf Monaten.
- Nach Test: 0 QA-Konten und 0 QA-Bestellungen verbleiben. Keine Testmail oder Zahlung ausgelöst.

## Tatsächliche offene Voraussetzungen

| Bereich | Stand / verbleibende Voraussetzung |
| --- | --- |
| Separate URL | Vercel-Projekt vorhanden. `vp.sichere-nacht.de` ist zugeordnet, aber DNS bei IONOS fehlt. CNAME `vp` auf `9b7e19953bf23561.vercel-dns-017.com`. Vercel-Domain als Zwischenzugang. |
| Anmeldung | Kein echtes Partner-/Admin-Konto vorhanden. E-Mail-Bestätigung, Rücksetzlink und Dokumentupload mit einem bestätigten Konto noch end-to-end zu prüfen; Auth-Mail-/Redirectkonfiguration nicht als erfolgreich behauptet. |
| Partnervertrag | Keine veröffentlichte VP-Vertragsfassung vorhanden. Finale Antragseinreichung bleibt deshalb geschlossen. Den tatsächlichen Vertrag hinterlegen und dann Registrierung öffnen. |
| Agentur | Freischaltung, Einladung und Abrechnung implementiert. Selbstregistrierung und eigene Vertragsannahme der eingeladenen VP bleiben nötig. |
| Schulungen | Drei operative Einstiegsunterlagen vorhanden. Echte Trainer, Termine, Plätze und Monteur-Masterclass-Inhalte fehlen. |
| Werbemittel | QR-Code, personalisierte Anfrage, konkretes Adminangebot und kostenpflichtige Annahme implementiert. Artikelpreise, verbindliche Ausführungen und Liefer-/Druckprozess noch festzulegen. |
| D2D | Amtlicher Hessen-Adapter für vorbereitete begrenzte Gebiete; keine freie bundesweite Ortssuche und keine garantierte Vollständigkeit aller Hausadressen. Ein Gedern-Ausschnitt ist vorbereitet. D2D-Echtbetrieb bleibt geschlossen. |
| Provisionen | Kalendermonat, Ende Folgemonat, 15/20 %, 5 % Reserve bis 2.500 € und zwölf Monate technisch geprüft. Verbindliche Vertragsfassung und administrative Abrechnungsfreigabe fehlen. Bankauszahlungen werden nicht automatisch veranlasst. |

Registrierung, D2D und verbindliche Abrechnung: Freigabeschalter weiterhin false. Shop-Live-/Zahlungsschalter unverändert. Keine behauptete vollständige Betriebsbereitschaft.
