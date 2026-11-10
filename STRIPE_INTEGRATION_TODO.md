# Stripe-Integration: offener Einrichtungs- und Freigabeplan

Stand: 10. November 2026. **Noch NICHT für echte Zahlungen freigegeben.**

## Values to Replace

**Keine Artikelpreis-Platzhalter im Checkout-Code:** Die Warenkorbpositionen werden serverseitig anhand der realen Artikelnummern und Bruttopreise aus [products.json](products.json) erzeugt. Die `mode`-Einstellung bleibt korrekt auf `payment` für Einmalkäufe.

**Zu hinterlegende Konfiguration:** siehe [.env.example](.env.example). Werte gehören als Vercel-Umgebungsvariablen in das richtige Projekt (`sichere-nacht-de`), nicht ins Repository.

| Feld | Aktueller Status | Was einzurichten ist |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | **In Preview vorhanden (Wert nicht ausgelesen)** | **Zuerst** geheimer Testmodus-API-Schlüssel `sk_test_...`, später der Live-Schlüssel `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **In Preview vorhanden (Wert nicht ausgelesen)** | Passender `pk_test_...` beziehungsweise später `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Fehlt in Vercel | Signaturgeheimnis des noch zu implementierenden und zu registrierenden Webhook-Endpunkts |
| `NEXT_PUBLIC_SITE_URL` | Fehlt in Vercel | Endgültige HTTPS-Shop-Domain, sobald Domain und DNS freigegeben sind |
| `CHECKOUT_ENABLED` | Nicht gesetzt | **true nur für die isolierte Preview-Testumgebung**, sonst false |
| `NEXT_PUBLIC_CHECKOUT_ENABLED` | Nicht gesetzt | **true nur für die isolierte Preview-Testumgebung**, sonst false |
| `CHECKOUT_TEST_ENABLED` | Nicht gesetzt | Nur Preview + Testschlüssel: auf **true** setzen, wenn Test bereit ist |
| `PAYMENTS_LIVE_APPROVED` | Nicht gesetzt | Bis zur abschließenden Live-Freigabe **false** |
| `VALID_PARTNER_IDS` | Nicht gesetzt | Übergangsliste zugelassener VP-IDs; spätere Agentur-/VP-Datenbank noch offen |

**Wichtig:** Niemals API-Geheimschlüssel in GitHub, den Chat oder die Browservariablen kopieren. `NEXT_PUBLIC_` darf ausschließlich beim veröffentlichbaren Stripe-Schlüssel stehen.

## Configured Parameters

Der serverseitige API-Aufruf ist in [app/api/checkout/route.ts](app/api/checkout/route.ts) implementiert; das Frontend in [app/warenkorb/page.tsx](app/warenkorb/page.tsx) und der offizielle Stripe.js-Loader in [app/layout.tsx](app/layout.tsx).

| Parameter | Wert |
| --- | --- |
| `ui_mode` | `form` (eingebettete Zahlungsmaske) |
| `mode` | `payment` (einmalige Warenbestellung) |
| `billing_address_collection` | `required` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `true` |
| `submit_type` | `auto` |
| `shipping_address_collection.allowed_countries` | `DE` oder `AT`, anhand der vom Kunden gewählten Lieferregion sicher eingeschränkt |
| `integration_identifier` | `custom_embedded_web_0001` |
| `payment_method_collection` | Im `payment`-Modus absichtlich weggelassen (laut Stripe-Studio-Auftrag nur bei `subscription`) |
| `line_items` | Reale SKU, Artikelbezeichnung, Menge und serverseitig kontrollierter Bruttopreis |
| `line_items.price_data.tax_behavior` | `inclusive` (keine zusätzlich auf den Bruttopreis aufzuschlagende Umsatzsteuer) |
| `shipping_options.shipping_rate_data.tax_behavior` | `inclusive` |
| `shipping_options.shipping_rate_data.fixed_amount.amount` | `990` Cent für DE, `1990` Cent für AT, brutto |
| `Stripe-Version` | `2026-03-25.dahlia` |

## Setup and next steps (Pflicht vor echter Zahlungsfreigabe)

1. **Domain & Vercel:** Die Domain `sichere-nacht.de` muss auf das richtige Vercel-Projekt zeigen, HTTPS funktionieren und `NEXT_PUBLIC_SITE_URL` gesetzt sein. Im Vercel-Team sind derzeit zwei ähnlich benannte Projekte vorhanden; kein doppeltes Liveprojekt aktivieren.
2. **Zahlungsdaten:** H&K Projekt UG ist als Stripe-Konto verbunden. Kontoaktivierung, Auszahlungsbankkonto und Identitäts-/Unternehmensverifizierung bestätigen. Erst Test-Schlüssel, danach Live-Schlüssel in den jeweils passenden Vercel-Umgebungen hinterlegen. **Keine echten Zahlungen jetzt.**
3. **Webhook-Code vorhanden, Konfiguration & Order-Persistenz fehlen:** Der signaturprüfende Endpoint [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) nimmt `checkout.session.completed` und `checkout.session.async_payment_succeeded` entgegen. Noch erforderlich: registrierter Stripe-Test-Webhook-Endpunkt, `STRIPE_WEBHOOK_SECRET` in Preview und **idempotente Bestellablage** (Datenbank). Erkennung einer Zahlung allein löst bewusst noch keine Auslieferung oder E-Mail aus. Ein abgeschlossener Bildschirm ersetzt keine bestätigte und gespeicherte Bestellung. Ohne dies die Checkout-Freigabe **nicht** aktivieren.
4. **Bestellkommunikation:** Automatische Bestellbestätigung, Versand-/Fulfillment-Ablauf, Erstattung und Belegprozess vervollständigen. Die Seite [app/bestellung/page.tsx](app/bestellung/page.tsx) prüft die Zahlung bisher nicht serverseitig.
5. **Steuern:** In Stripe Tax Standort, deutsche Steuerregistrierung und korrekte Steuercodes prüfen. Preise sind im Katalog bereits inklusive 19 % deutscher Umsatzsteuer; durch `inclusive` darf die angezeigte Bruttosumme nicht doppelt besteuert werden. Bei österreichischen Lieferadressen muss die korrekte Steuerbehandlung separat fachlich geprüft werden. **Automatische Steuerberechnung allein ist noch keine steuerliche Freigabe.**
6. **Versand:** Bisher ausdrücklich festgelegt sind **9,90 € brutto innerhalb Deutschlands**. Österreich wurde am 10.11.2026 mit **19,90 € brutto je Bestellung** festgelegt (Deutschland: **9,90 € brutto**). Der Warenkorb verlangt eine Länderauswahl; der Server lässt in der Checkout-Session ausschließlich das gewählte Lieferland zu und berechnet den jeweiligen Preis. Steuerliche Behandlung/Lieferzeiten müssen dennoch vor Livegang geprüft werden. Die aktuelle Checkout-Vorlage nicht ungeprüft freischalten.
7. **Montage:** Optionale 199-€-Montage kann derzeit nicht direkt bezahlt werden; die API lehnt sie mit Hinweis auf individuelle Standortprüfung ab. Diese Sperre beibehalten, bis die Leistung technisch und vertraglich geklärt ist.
8. **Rechtstexte:** Impressum und Kontaktdaten gegen aktuelle Firmendaten verifizieren, Datenschutz, Widerruf, Lieferzeiten, Verbraucherinformationen und Bestellschaltfläche prüfen.
9. **Vertriebspartner:** Weiterhin keine automatische Agenturprovision. Später: Agentur erhält **20 % des Nettowarenumsatzes**, zahlt daraus **15 % an VP**; Sichere Nacht zahlt nur an Agentur. Dafür belastbare Zuordnung, Rückbelastungen bei Retouren und Abrechnungsdatenbank bauen.
10. **Testen:** In Stripe-Testmodus (`pk_test_` / `sk_test_`) End-to-End testen: Kauf mit Visa-Testkartennummer `4242 4242 4242 4242`, beliebigem gültigem Zukunftsdatum und CVC; außerdem abgelehnte Karten, ungültige Adressen, Steuern, Lieferkosten, Duplikat-Webhooks und Retouren prüfen. Tests dürfen **keine Livezahlung** auslösen.
11. **Live-Freigabe:** Erst nach allen Tests alle drei Freigaben bewusst setzen (`NEXT_PUBLIC_CHECKOUT_ENABLED=true`, `CHECKOUT_ENABLED=true`, `PAYMENTS_LIVE_APPROVED=true`) und abgestimmte Live-Stripe-Schlüssel verwenden. Danach erneuter vollständiger Test und Monitoring.

## Ablauf

1. Kunde wählt im Shop oder Konfigurator Artikel und öffnet [app/warenkorb/page.tsx](app/warenkorb/page.tsx).
2. Der Server validiert alle Artikel und Preise und erzeugt eine Stripe-Checkout-Session mit `ui_mode=form`.
3. Die API liefert `client_secret` zurück; das Frontend lädt Stripe.js direkt von `https://js.stripe.com/dahlia/stripe.js` und zeigt die Zahlungsmaske innerhalb des Warenkorbs.
4. Stripe verarbeitet Zahlung, Adresse und Steuern. Der signaturprüfende Webhook wurde implementiert, aber mangels Bestelldatenbank werden bezahlte Bestellungen noch **nicht** automatisch als Auftrag gespeichert, versendet oder per Mail bestätigt. Vor Livegang diese Erweiterung fertigstellen.

## Ressourcen

- [Stripe-Dokumentation](https://docs.stripe.com/)
- [Stripe-Testkarten](https://docs.stripe.com/testing)
- [Stripe-Support](https://support.stripe.com)
- [Stripe-MCP-Dokumentation](https://docs.stripe.com/mcp)

## Aktueller Zwischenstand am 10.11.2026

- Beide Testschlüssel sind im richtigen Vercel-Projekt `sichere-nacht-de` ausschließlich für **Preview** vorhanden (Schlüsselwerte nicht eingesehen).
- Signaturgeprüfter Webhook: `POST /api/stripe/webhook`, noch ohne registriertes Stripe-Ziel und ohne produktive Bestellpersistenz.
- Der Checkout-Code unterstützt **isolierte Preview-Tests** nur bei `CHECKOUT_ENABLED=true`, `CHECKOUT_TEST_ENABLED=true`, Stripe-Secret `sk_test_...` und `VERCEL_ENV=preview`. `PAYMENTS_LIVE_APPROVED` bleibt dabei `false`.
- Für Main-Branch-Deployments (Production) sind Checkout und echte Zahlungen weiterhin gesperrt.
