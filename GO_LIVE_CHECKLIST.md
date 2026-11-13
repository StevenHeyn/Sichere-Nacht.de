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
