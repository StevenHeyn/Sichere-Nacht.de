# Bestellbestätigung & Rechnungsversand – sichere-nacht.de

## Status (Staging, keine Live-Freigabe)
- Nach signiertem, von Stripe bestätigtem Zahlungseingang wird ein Bestätigungs-Mailjob angelegt.
- Bei eingerichtetem Resend-Konto wird die Bestätigung im Webhook versendet; sonst bleibt der Job wartend.
- Admin /admin/bestellungen: 'Als versendet markieren' wird erst bei tatsächlicher Warenübergabe geklickt.
- Rechnungsnummern werden nur einmal serverseitig vergeben; eine PDF-Rechnung wird erst nach Versand erstellt.
- Ohne bestätigte Steuerbeträge, Rechnungsdaten oder verifizierte E-Mail-Domain wird KEINE Rechnung verschickt.
- Testkäufe dürfen ausschließlich an die in ORDER_EMAIL_TEST_TO konfigurierte Testadresse gesendet werden.

## Einrichtung in Vercel (zuerst nur Preview / Branch feature/order-emails-invoices)
1. Resend-Konto eröffnen und die Domain sichere-nacht.de für ausgehende Nachrichten per DNS SPF/DKIM verifizieren.
2. Environment Variablen serverseitig hinterlegen:
   - RESEND_API_KEY (secret, nur Preview)
   - ORDER_EMAIL_FROM (z.B. Sichere Nacht <bestellung@sichere-nacht.de>)
   - ORDER_REPLY_TO (beantwortbare Kundenservice-Adresse)
   - ORDER_EMAIL_TEST_TO (eigene interne Testadresse)
   - INVOICE_COMPANY_NAME (Rechnungssteller, vollständiger Firmierung)
   - INVOICE_COMPANY_STREET (Straße und Hausnummer)
   - INVOICE_COMPANY_CITY (Postleitzahl und Ort)
   - INVOICE_VAT_ID (geprüfte USt-IdNr.)
   - INVOICE_REGISTRY (z.B. Amtsgericht und HRB)
   - INVOICE_CONTACT_EMAIL (gültige E-Mail)
3. Testbranch deployen; Webhook auf den neuen Preview-Zweig ausrichten und Vercel-Bypass setzen.
4. Stripe Testzahlung durchführen, Supabase order_mail_jobs prüfen; Bestätigung muss an ORDER_EMAIL_TEST_TO ankommen.
5. Für Rechnungsprüfung müssen Stripe Tax/Steuerraten geprüft werden. Die bestehende Testbestellung hatte amount_tax=0 trotz Shop-Hinweis 'inklusive 19 % MwSt.' und wird daher bewusst blockiert. Erst mit bestätigter korrekter Steuerberechnung weitere Versand- und Rechnungstests durchführen.
6. In der Adminoberfläche 'Als versendet markieren'; Rechnung darf nur nach korrekten Steuerdaten und ausgefüllten Rechnungs-Pflichtangaben gesendet werden.
7. Gleiches Ereignis erneut zustellen: einmalige Bestellbestätigung und Rechnungsnummer überprüfen.

## Rechtlich/organisatorisch offen vor Live
- Rechnungssteller, Registereintrag, Steuernummer/USt-IdNr. und Rücksende-/Kontaktadresse prüfen.
- Nachweis korrekter Steuerraten pro Lieferland (Österreich derzeit gesperrt).
- Dieses Staging-PDF-Verfahren ist zunächst nur für inländische 19%-Rechnungen ausgelegt.
- Aufbewahrung, Unveränderbarkeit der Rechnungen, E-Rechnungspflichten für B2B, Zustellprotokolle und Datenschutz prüfen.
- Automatische Wiederholversuche bei E-Mail-Dienst-Ausfall sowie Administrationszugriff mit rollenbasiertem Login für den Livebetrieb erweitern.
- Kein automatischer Rechnungsversand bei einfacher Bezahlung; 'versendet' muss vom Operator bestätigt sein.
