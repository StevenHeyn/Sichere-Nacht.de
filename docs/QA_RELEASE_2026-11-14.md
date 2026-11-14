# Sichere Nacht – nachgewiesener Arbeitsstand am 14.11.2026

## Umgesetzte Etappe (PR #15)
- Aktuellen Produktionsstand in den bestehenden isolierten Testzweig übernommen; vorhandene Testschlüssel und Test-Webhook weiterverwendet. Keine Liveschlüssel kopiert, keine Verkaufsfreigaben aktiviert.
- Zwei echte Stripe-API-Fehler diagnostiziert: `custom_text` und `branding_settings` sind mit der verwendeten `ui_mode: form`-Integration unzulässig. Form-Anfragen senden diese Parameter nicht mehr. Kaufart-Metadaten, sichtbare B2B/B2C-Hinweise und Shop-Abgrenzung bleiben erhalten. Kontoweite Stripe-Einstellungen unverändert.
- Ruhige Startseite und Navigation, bestehendes Logo und Produktbilder erhalten; fiktive Bewertungsdarstellung entfernt.
- Drei Zielgruppen-Einstiege (Wohnung/Haus/Gewerbe), vier Ratgeber, eigene Montage-Anfrageseite, Quellenregister und Vergleich dreier Anbieter.
- Kategorien, Suche, Technik-/Einsatzfilter und Produktvergleich; 20 SKU-bezogene Auswahlhilfen. Weitere Artikel bleiben im Katalog, erhalten jedoch eine Beratungsaufforderung statt einer ungeprüften Sofortkaufzusage. Keine vollständige Hersteller-Kompatibilitätsdatenbank behauptet.
- Vorhandenen Raumplaner erhalten, keine prozentuale Reduktion ausgewählter Bewegungsräume; Mengen vor Warenkorb editierbar. Server prüft bekannte Systemkonflikte. Montagepreis wird nicht automatisch auf Hardware-Zahlbetrag aufgeschlagen.
- B2B/B2C und SECPLAN-Statusablauf erhalten. Provisionsvereinbarung nicht geändert: Agentur 20 % netto, daraus VP 15 %. In den geprüften main-Routen wurde keine separate Partnerportal-Oberfläche vorgefunden; bestehende Partnerkennung/Allowlist bleibt, kein erfundenes Portal oder automatischer Provisionslauf.
- Empfehlungskennung nur nach freiwilliger aktiver Zustimmung für max.30 Tage in demselben Browser; Widerruf im Footer. Keine IP-Personenkennung oder Fingerprinting. Alte unbestätigte Cart-Kennung wird nicht stillschweigend weitergenutzt.
- Stripe-SDK erst bei Zahlungsinteraktion. Kontaktformular verwendet den vorhandenen Transaktions-Maildienst. Zusätzliche Formvalidierung, keine öffentlich sichtbaren Geheimschlüssel.
- Canonicals, strukturierte Produkt-/Breadcrumb-/Organisationsdaten ohne erfundene Verfügbarkeit/Bewertungen, Kategorien-Sitemap und robots. Vorschauen und interne Seiten bleiben noindex; öffentliche Indexfreigabe ist weiterhin gesperrt.

## Tatsächlich geprüfte Ergebnisse
### CI-Stand 873311ad373b4ae206e1ba7962d6e91c324b14d2
Alle sechs GitHub-Prüfläufe erfolgreich:
- Stripe shop isolation checks: 43533304838
- Checkout probe safety tests: 43533304688
- Go-live-Prüfung: 43533304738
- SECPLAN dropshipping safeguards: 43533304698
- B2C B2B purchase purpose safeguards: 43533304733
- Shop quality and responsive QA: 43533304886

Die Browserprüfung testet einen lokalen Produktionsbuild ohne Zahlungsschlüssel. Sie ist kein realer Zahlungsnachweis.
- 7 Seiten × 3 Breiten (390,768,1440px): HTTP200, kein horizontaler Überlauf, keine protokollierten pageerror-Ausnahmen.
- Suche nach Artikelnummer und Vergleichsauswahl erfolgreich.
- B2B-Auswahl/Firmenfeld und entsprechender Hinweis sichtbar.
- Empfehlungs-Einwilligung, Wiederbesuch und Widerruf erfolgreich; keine Speicherung vor Zustimmung.
- Direkte Erfassung von sechs Bewegungsräumen ergibt sechs Melder, manuelle Änderung auf vier funktioniert.
- Mobilmenü und Tastatur-Sprunglink funktionieren.
- Kein Stripe-SDK-Abruf vor Zahlungsinteraktion in diesen Tests.
- Automatischer Axe-Scan auf der getesteten Desktop-Ratgeberseite: keine gefundenen Verstöße. **Keine vollständige Barrierefreiheitszertifizierung** und keine Aussage zu allen Seitentypen.
- Bildschirmaufnahmen von Startseite, Tablet-Shop, mobilem Warenkorb/Konfigurator und Desktop-Produktseite visuell geprüft. Danach zusätzliche Typografieanpassung für lange Konfiguratorüberschriften auf Smartphones.

### Tatsächliche Stripe-Sandbox
- Nach Entfernung der beiden unzulässigen Parameter antwortete die Checkout-Erstellung mit HTTP200 und einer `cs_test_`-Sitzung.
- Test-Webhook zeigt auf die richtige aktuelle Branch-URL, ist enabled und hat die beiden Checkout-Zahlungsereignisse. Automatische Steuereinstellungen sind für DE aktiv.
- Kein realer Bezahlvorgang ausgelöst.
- Die automatisierte Stripe-Browseransicht zeigt ein Agent-Steering-Feld `link_pay_token`. Laut offiziellen Link-Unterlagen unterstützen diese Tokens keinen Testmodus. Deshalb keine Erzeugung eines Live-Spend-Requests und kein Wechsel auf Echtgeld. Vollständiger B2C/B2B-Zahlungsabschluss im normalen Browser ist noch auszuführen.
- Nicht nachgewiesen: erfolgreicher aktueller Testzahlungsabschluss, tatsächliches Webhook-Eintreffen/DB-Speichern auf diesem Stand, neue Mailzustellung und neuer Rechnungsablauf für beide Varianten. Alte erfolgreiche Testbelege wurden nicht als Beweis für den neuen Stand ausgegeben.

### Katalogprüfung
Alle 902 SKUs/EANs/Namen/gespeicherten UVPs entsprechen der gelieferten CSV. 890 positive ,90-Verkaufspreise und 12 ausgeblendete Nullpreispositionen. Die bewusst gerundeten Preise wurden nicht geändert; siehe PRICE_AND_CATALOG_AUDIT.md.

## Vergleich nach Umsetzung
Gegenüber dem bisherigen Shop sind nun wie bei spezialisierten Fachhändlern explizite Produkt-/Systementscheidungen, Beratungseinstiege und dauerhafte Kategorie-/Ratgeberseiten vorhanden. Anders als Verisure wird kein integriertes Abonnement-/Leitstellenmodell behauptet. Eine Überlegenheit bei Lieferqualität, Conversion oder Google-Rankings wurde weder gemessen noch zugesagt. Wettbewerber-Checkout und deren interne Technik wurden nicht getestet.

## Noch offen / extern abhängig
- Zwei abgeschlossene Sandbox-Bestellungen (B2C/B2B) mit echtem Test-Webhook, interner Bestätigung und Rechnungsablauf; Ablehnung/Abbruch/Wiederholung auf dem finalen Stand prüfen.
- SECPLAN-Bestellkanal, tatsächliche Verfügbarkeit, Lieferanten-/Verpackungsnachweise, Retouren-/Datenschutzrollen und artikelbezogene GPSR-/Herstellerinformationen.
- Vollständige Datenschutz-Vertrags-/Speicherfristen; betriebliche Elektro-/Batteriepflichten und geeigneter kommerzieller Vercel-Tarif.
- Vollständige objektbezogene Kompatibilitätsprüfung, Leistungs-/Barrierefreiheitsmessung aller Seiten und tatsächliche Auftrags-/Support-Prozesse. Kein 100%-Kompatibilitätsversprechen.
- Öffentliche Zahlungs- und Indexfreigabe erst nach Abnahme. Websiteveröffentlichung ist nicht gleich Verkaufsfreigabe.

## Quellen
https://docs.link.com/guides/link-pay-token
https://docs.stripe.com/automated-testing
Hersteller-/Rechtsquellen und Wettbewerber: COMPETITOR_REVIEW.md und EXTERNAL_RELEASE_REQUIREMENTS.md.
