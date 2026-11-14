# Sichere Nacht: verifizierbarer Qualitäts- und Freigabeplan

Stand 14.11.2026. Ausgangspunkt: main 2b6c769e6708daa1463d922caadf18f559c4cc32, Testzweig feature/combined-shop-preview mit bisherigen Checkout-Korrekturen. Betreiberauftrag: Funktionen erhalten, tatsächlich umsetzen, keine erfundenen Leistungs- oder Rechtsfreigaben.

## P0: Zahlung und Bestellabwicklung
- [ ] Aktuelle Sandbox: B2C und B2B legen gültige Stripe-Testsitzungen an; richtige Bruttopreise, DE-Versand 9,90 EUR und 19 % Steuer bei gültiger DE-Adresse.
- [ ] Je eine abgeschlossene Testzahlung führt über signierten Webhook zu genau einer Bestellung und passender interner Bestätigung; Ablehnung/Abbruch führen zu keiner bezahlten Bestellung. Wiederholung ohne doppelte Bestellung/Mail.
- [ ] Lieferantenfortschritt und Rechnung anhand einer Testbestellung ohne echte SECPLAN-Beauftragung abgenommen. Bestehende SQL-Schutztests beibehalten.
- [ ] Öffentliches Checkout bleibt bis zur Abnahme gesperrt; Erfolgsseiten bleiben Stripe-read-only und markieren nicht selbst als bezahlt.
- [ ] Kompatibilitätsregeln gelten auch serverseitig. Zubehör-/Profi-Produkte ohne geprüfte Zuordnung werden nicht zu einem vermeintlich vollständigen DIY-System gerechnet.

## P1: Beratung, Produktauswahl, Vertrauen
- [ ] Zwei klare Zielgruppeneinstiege, Wohnung/Haus/Büro/Laden/Lager mit verlinkten offiziellen Ajax-Quellen und Grenzen.
- [ ] Jeweller/Fibra/Video/Profi-Linien getrennt; kein Gleichsetzen von Marketinglinie und Funkprotokoll. Verifizierte Kernartikel mit Zweck, Systembedarf, Montagehinweisen, Lieferumfang-Quelle.
- [ ] Raumplanung erhalten; gewählte Bewegungsräume nicht stillschweigend reduzieren. Mengen vor Warenkorb änderbar, Hardware/Versand/Montageanfrage getrennt.
- [ ] Haustiere, Etagen, Größe und bestehendes System führen zu sichtbaren Planungsgrenzen, nicht zu erfundener Objektfreigabe.
- [ ] Fiktive Bewertungselemente aus öffentlicher Darstellung entfernen. Keine fremden Zertifizierungen oder Leitstellenleistungen übernehmen.
- [ ] Montage: 199 EUR ist Betreiberpreis, zunächst Hamburg/Umgebung. Konkrete PLZ, Umfang/Anfahrt nicht bestätigt. Nur separate Anfrage, kein verbindlicher Termin oder automatischer Montagekauf.

## P1: Datenschutz, B2C/B2B, SEO und Leistung
- [ ] B2C/B2B-Erklärungen, Datenbankbeweise und unterschiedliche Dokumente bleiben erhalten; tatsächlicher Kaufzweck bleibt maßgeblich.
- [ ] Referral nur nachvollziehbar und mit freiwilliger, widerrufbarer Zustimmung dauerhaft speichern. Keine IP-/Fingerprint-Personenkennung; alte unbestätigte Kennung bereinigen. Serverseitige Partnerprüfung beibehalten. Vereinbart: Agentur 20 % netto, davon VP 15 %; keine neue Auszahlungsmethodik erfinden.
- [ ] Titel, Beschreibungen, Canonicals, Sitemap und robots kontrollieren; Vorschau immer noindex. Interne Bereiche/Warenkorb/Erfolg/Filter nicht indexieren.
- [ ] Strukturierte Daten ohne erfundene Ratings oder Verfügbarkeiten. Kein automatisches Live-Schalten von SEO-/Zahlungsflags.
- [ ] Mobile 390px, Tablet 768px, Desktop 1440px: kein horizontaler Überlauf, Tastaturbedienung, beschriftete Felder, lesbare Preise/Fehler. Keine externen Schriftarten; Stripe erst für Zahlungsinteraktion laden.

## Externe Abhängigkeiten
SECPLAN-Bestellkanal, verbindlicher Bestand/Lieferfristen, Verpackungsnachweise, konkrete Retouren-/Datenschutzrollen; genaue Montage-Leistungsbeschreibung; artikelbezogene GPSR-/Hersteller-/EU-Verantwortlichen-/Warnhinweise; Elektro-/Batteriepflichten und Betriebsvereinbarungen. Diese Punkte nicht mit bloßem Code oder allgemeinen Lieferantenaussagen als erledigt markieren.

## Abnahmebelege
Pro Etappe: Commit/PR, Testausgabe, Preview-URL, Datum/Umgebung und ausdrücklich nicht geprüfte Punkte dokumentieren. Ein grüner Build ersetzt weder abgeschlossene Zahlung noch Lieferantennachweis oder vollständige Rechtsprüfung.
