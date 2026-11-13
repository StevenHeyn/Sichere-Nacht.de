# Sichere Nacht – Freigabeplan (13.11.2026)

**Status: NICHT live für echte Verkäufe.** Freigabezweig `release/sichere-nacht-go-live` basiert auf `feature/brand-visual-trust-2026`, nicht auf `main`. Produktionsschlüssel und Live-Checkout nicht ohne ausdrückliche Freigabe aktivieren.

## Bereits nachgewiesen
- Stripe Checkout mit Testkarte funktionierte bis zur serverseitigen Zahlungsstatusbestätigung.
- In Supabase sind fünf als bezahlt gespeicherte **Testbestellungen** vorhanden (Stand 13.11.2026).
- Datenbanktabellen `orders`, `order_mail_jobs` und `shop_withdrawal_requests` existieren mit RLS.
- E-Mail-/Rechnungsversand ist im Feature-Code vorhanden; vor Livebetrieb Ende-zu-Ende mit den Produktionskonfigurationen testen.
- Neues Design in `feature/brand-visual-trust-2026` verfügbar; Freigabezweig daraus angelegt.

## BLOCKER vor Livegang
1. **Branch-Synchronisation:** Aktuelles `main` und Designzweig sind diverged. Vier neuere Main-Commits gezielt vergleichen/übernehmen, Konflikte lösen; kein Blind-Merge. Build + Frontend-Regressionsprüfung.
2. **Domain:** `sichere-nacht.de` und `www.sichere-nacht.de` noch nicht im Vercel-Projekt `sichere-nacht-de` nachgewiesen. Bei DNS-Umstellung sicherstellen, dass keine fremde Website unbeabsichtigt abgeschaltet wird. HTTPS, Canonical, Redirects und E-Mail-DNS getrennt prüfen.
3. **Recht:** Widerrufsbelehrung und Musterformular als Entwurf hinterlegt. Zweistufige Online-Widerrufsfunktion implementiert, aber E-Mail-Receipt/Ratelimit/Fehlerfälle und Rechtsprüfung vor Livegang verpflichtend. Datenschutzerklärung im Repository ist derzeit ein Entwurf, AGB/Verbraucherinformationen und Lieferfristen fehlen in freigegebener Form. Prüfen: § 356a BGB, Art. 246a EGBGB, DSGVO, Vertragsschluss, Bestellbutton, OS-/VSBG-Hinweise.
4. **Steuern:** In Testbestellungen wurde `amount_tax=0` beobachtet. Stripe-Tax-Registrierung, Steuersätze, Bruttopreis-/Versandsteuer, Rechnungs-PDF und 19%-Ausweis fachlich gegenprüfen. AT-Lieferungen erst nach OSS-/Steuerprüfung erlauben, soweit erforderlich.
5. **Bestellprozess:** Produktdaten, SKUs, Warenkorb, Adressen, Versandkosten, Zahlstatus, signierte Webhooks, doppelte Events, Wiederholversuche, Erstattungen und Ausfälle kontrollieren. Ein Weiterleitungsbildschirm ist allein kein Zahlungsnachweis.
6. **E-Mail/Rechnung:** SPF/DKIM/DMARC und Postfach `bestellungen@sichere-nacht.de` prüfen; Absender, Reply-To und Mailjobs testen; Rechnungsnummern, PDF, steuerliche Pflichtangaben und revisionssichere Ablage prüfen.
7. **Montage:** 199 € nur nach separater Bestätigung Hamburg/Umgebung; keine automatische Montagebestellung bis Kapazitäten/Leistungsumfang/Terminbestätigung geklärt.
8. **Datenschutz & Sicherheit:** Supabase, Resend, Stripe, Vercel, Referral-Zuordnung/IP-Betrachtung, internationale Transfers, AV-Verträge, Löschfristen, Cookie-/Consent-Fragen, Zugriffsschutz Admin und Rate-Limits prüfen. Secrets nur serverseitig, Preview-/Produktionsumgebungen trennen.
9. **SEO/Marketing:** Nach Freigabe `SITE_LIVE_APPROVED`, Sitemap/robots, Search Console und Produkt-/Unternehmensdaten prüfen; vorher keinen unfertigen Checkout indexieren lassen.
10. **Liveumschaltung:** Erst nach sämtlichen Freigaben Domain, produktive Umgebungsvariablen, Live-Stripe-Webhooks und Freigabeschalter in kontrollierter Reihenfolge umstellen. Danach echter, kontrollierter Testkauf sowie Monitoring.

## Technische Einordnung
- Vercel-Projekt `prj_9zzzk8nm8vyOsLPfMmOJCnY5ZIIV`.
- Supabase-Projekt `uotcoobumftugaprnhso`.
- Die aktuelle Produktion auf `main` enthält noch alten Checkout-Code und unvollständige rechtliche Seiten.
- Der neue Freigabezweig enthält die noch nicht komplett getestete Widerrufsfunktion. Vor produktiver Nutzung prüfen, dass `RESEND_API_KEY`, `ORDER_EMAIL_FROM`, `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` im richtigen Deployment vorhanden sind.

## Entscheidungen vom Betreiber erforderlich
- Definitive Versand-/Lieferzeiten und Retourenadresse bestätigen.
- Deutsche Steuer- und Rechnungsbehandlung sowie Startumfang DE / AT bestätigen.
- Impressumsdaten H & K Projekt UG (haftungsbeschränkt), HRB, USt-ID und E-Mail auf Handelsregister/Finanzamt und tatsächliche Erreichbarkeit abgleichen.
- Datenschutz und Verbraucherrechtstexte fachlich freigeben.

## Rechtsprüfung vom 13.11.2026 – verifizierte Quellen und konkrete Restarbeiten

### Gesetzliche Pflichtinformationen und Gestaltung
- **§ 312j BGB:** Lieferbeschränkungen und Zahlungsmittel rechtzeitig; unmittelbar vor dem endgültigen Klick wesentliche Warenmerkmale, Gesamtpreis, Versandkosten, Vertragsdaten; der abschließende Button muss die Zahlungspflicht eindeutig ausdrücken. Der eingebettete Stripe-Button muss optisch/inhaltlich in einer echten Preview-Abnahme kontrolliert werden. https://www.gesetze-im-internet.de/bgb/__312j.html
- **§ 356a BGB:** Hervorgehobene elektronische Widerrufsfunktion, eindeutiger zweiter Button „Widerruf bestätigen“, unverzügliche Eingangsbestätigung auf dauerhaftem Datenträger mit übermittelten Angaben plus Zeitpunkt. Der Code hat zwei Schritte, aber Zustellbestätigung, Ausfallszenario und Schutz vor Missbrauch brauchen Ende-zu-Ende-Tests. https://www.gesetze-im-internet.de/bgb/__356a.html
- **AGB nicht gesetzlich zwingend:** Der vorhandene Entwurf ist freiwillig. Pflicht sind aber zutreffende Verbraucherinformationen. Die Vertragsannahme gemäß AGB muss zur tatsächlich verwendeten E-Mail „Bestellbestätigung“ passen. https://www.cec-zev.eu/de/themen/einkaufen/e-commerce/internetauftritt/informationspflichten/

### Produktsicherheit und Warenversand
- **Art. 19 EU-Produktsicherheitsverordnung (EU) 2023/988 (GPSR):** Bei Onlineangeboten Herstellername und postalische/elektronische Kontaktadresse, nötigenfalls verantwortliche EU-Person mit Adresse, Produktidentifikation und verpflichtende Warnhinweise in verständlicher Sprache angeben. Im `products.json` stehen zwar SKU, EAN, Beschreibung und teils Bild, aber keine verifizierten Hersteller-/Verantwortlichen-Kontakte pro Artikel. **BLOCKER für einen uneingeschränkten Katalogverkauf:** Daten mit SEC Plan/Ajax verifizieren; ggf. pro Produktlinie auf Produktebene hinterlegen. Keine Kontaktdaten erfinden. https://eur-lex.europa.eu/eli/reg/2023/988
- **Verpackungsrecht:** Bestätigen, dass H & K Projekt UG als Versandverpackungs-Erstinverkehrbringer, soweit einschlägig, in LUCID registriert ist, ein Systembeteiligungsvertrag besteht und Mengenmeldungen erfolgen. https://www.verpackungsregister.org/themen/versand-und-onlinehandel
- **ElektroG und Batteriepflichten:** WEEE-Registrierung der Hersteller/Importeure bzw. relevante Händler- und Rücknahmepflichten prüfen; ebenso Batterie-Informationen bei Geräten mit Batterien. https://www.stiftung-ear.de/anleitungen/weee-registrierung-beantragen/
- **Verfügbarkeit:** Die Zusage „2–4 Werktage“ darf nur für tatsächlich vorrätige Artikel gelten; ohne Warenbestandsschnittstelle einzelne nicht sofort lieferbare Produkte kennzeichnen oder aus dem Verkauf nehmen.

### Technische und datenschutzrechtliche Abnahme
- In Production noch keine Stripe-Keys, Supabase-URLs, Live-Webhook-Signatur und Mail-/Invoice-Konfiguration (Stand 13.11.). Produktionsschlüssel nicht aus Preview übernehmen, sondern separat auf Live- und Testmodus abgleichen.
- Vercel-Domain `sichere-nacht.de` / `www.sichere-nacht.de` wurde als DNS-konform verifiziert; das ist keine Abnahme des Live-Checkouts.
- Bisherige Testbestellungen: 5 gespeichert, davon die neuesten zwei mit positivem Steuerbetrag; 5 Bestätigungs- und 2 Rechnungs-Mailjobs als `sent` registriert (Supabase). End-to-End mit dem finalen Release und einer kontrollierten Testzahlung erneut nachweisen.
- Datenschutzdokument ergänzen: AV-Verträge, Drittlandtransfergrundlagen, genaue Aufbewahrungs- und Löschfristen, tatsächliche Konfiguration von Vercel/Stripe/Supabase/Resend, Empfehlungszuordnung und Cookies; erst danach Entwurfsmarkierungen entfernen.

## Prüfergebnisse 13.11.2026 (GitHub CI)
- **GitHub-Merge-Konflikt behoben:** `main` ist jetzt ein Vorfahr des Release-Zweigs; neuer Merge-Commit `595a88e3c6b9` mit beiden Eltern. Altes Logo-Asset erhalten, neues Markendesign bleibt maßgeblich.
- **Go-live-CI:** Workflow `Sichere Nacht – Go-live-Prüfung` läuft mit Next.js Build und statischen Sicherheitsprüfungen. Nach Korrektur der Nullpreisartikel wurde der Workflow auf Commit `a11946e49f04` erfolgreich abgeschlossen.
- **Produktkatalog:** 902 Katalogzeilen, davon **12 nicht verkaufsfähige Nullpreis-Einträge** (Marketingmaterial/Präsentationskoffer). Diese werden im öffentlichen Shop und Detailseiten nicht mehr als kaufbar angeboten, bleiben aber im internen JSON. Regulär bepreist sind 890 Artikel. Das ist **kein** Nachweis, dass alle 890 tatsächlich lagernd oder GPSR-vollständig sind.
- **Vercel-Staging:** Branch `release/sichere-nacht-go-live` erhält eigene Checkout-Testflags, Supabase-Projektadresse und stabile Branch-Preview-Adresse. **Keine Production-Livekeys gesetzt.**
- **Supabase-Mails:** 5 Bestätigungsjobs und 2 Rechnungsjobs mit Status `sent`. Es fehlen noch E2E-Zustellnachweise für den Release-Zweig sowie die korrekte Production-Absenderdomain.

### Freigabevermerk
Nicht freigegeben, solange Produkt-/Lagerprüfung und gesetzliche Informationen nicht vollständig, die Produktionsanbindung/Stripe-Liveschlüssel nicht eingerichtet, Mailversand inkl. Widerrufseingang nicht getestet und der finale Bestellbutton nicht visuell geprüft sind. Der CI-Build ist ein notwendiger, aber kein hinreichender Verkaufsstart-Nachweis.
