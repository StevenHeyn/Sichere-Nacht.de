# Sichere Nacht: Bestellverwaltung (isolierter Stripe-Testzweig)

## Status
- Testcheckout funktioniert und die Rücksprungseite verifiziert bezahlte Testsitzungen direkt bei Stripe.
- Neu: Webhook prüft Stripe-Signatur, liest Stripe-Session und Positionen serverseitig, speichert nur bezahlte Bestellungen und verwendet die Session-ID als eindeutigen Schlüssel.
- Admin-Bestellliste: `/admin/bestellungen`. Die Datenbank ist noch NICHT angeschlossen, bis die folgenden Konfigurationsschritte durchgeführt wurden.
- Kein automatischer Versand und keine Kunden-E-Mail. Keine Livefreigabe.

## Datenbank einrichten
1. Supabase-Projekt mit EU-Region (geeignetes EU-Rechenzentrum) anlegen; Datenverarbeitungsvereinbarung und Datenschutz prüfen.
2. Datei [database/orders.sql](database/orders.sql) im Supabase SQL Editor ausführen.
3. In Vercel im Projekt `sichere-nacht-de` folgende **nur serverseitigen** Variablen für **Preview / Branch stripe-preview-test** eintragen:
   - `SUPABASE_URL`: Projekt-URL `https://....supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: geheimer Service-Role-Schlüssel (nicht `anon` / `publishable`)
   - `ORDERS_ADMIN_TOKEN`: langes zufälliges Passwort (mindestens 32 zufällige Zeichen). Niemals ins GitHub-Repository oder den Chat schreiben.
4. Neuer Preview-Deploy.
5. Stripe-Testwebhook: Aktuelle Endpoint-Adresse auf `https://<aktuelle-branch-alias-domain>/api/stripe/webhook?x-vercel-protection-bypass=<secret>` stellen. Die Vercel-Bypass-URL muss gültig sein. Stripe-Webhook-Signaturgeheimnis muss zum Ziel passen.
6. Testzahlung auslösen und im Stripe-Dashboard bei Ereignisübermittlungen **HTTP 200** bestätigen. In `/admin/bestellungen` mit Admin-Schlüssel kontrollieren, ob der Auftrag mit allen Positionen gespeichert wurde.
7. Doppelte Zustellung in Stripe erneut senden: Es darf nur ein Datensatz pro Stripe-Session vorhanden sein.

## Sicherheit und Betriebsgrenzen
- Stripe-Ereignisse werden ausschließlich mit gültiger Signatur angenommen. Bei Datenbank-Ausfall antwortet der Webhook mit HTTP 503, damit Stripe erneut zustellt.
- Ohne konfigurierte Datenbank antwortet der Webhook auf bezahlte Ereignisse ebenfalls HTTP 503 und bestätigt keine Speicherung.
- Nur der Server darf den Supabase-Service-Role-Schlüssel erhalten; Row-Level-Security ist aktiviert, es existieren keine öffentlichen Policies.
- Die Bestellübersicht erfordert einen separaten Admin-Schlüssel. Nicht für mehrere Mitarbeiter oder uneingeschränkten Livebetrieb als endgültige Benutzerverwaltung gedacht.
- Webhook und Bestellliste speichern personenbezogene Daten. Löschkonzept, Zugriffsrechte, Backups, Dokumentation und Mailversand vor Livegang prüfen.
- Stripe-Test-/Live-Webhook-Signaturgeheimnisse getrennt verwalten.
