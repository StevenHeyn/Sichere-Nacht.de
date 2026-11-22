# Sichere Nacht Partnerportal

Separat bereitgestellte Next.js-Anwendung für `vp.sichere-nacht.de`. Kein Link in der öffentlichen Shopnavigation. Die Quellablage liegt als isoliertes Unterprojekt im bestehenden Repository; die Sichtbarkeit des Repository ist davon unabhängig.

## Verbindliche Betreibervorgaben
- Registrierung: Name, Adresse, E-Mail, Telefon, Portraitfoto, Konfektionsgröße und Gewerbenachweis; ausdrückliche Akzeptanz der freigegebenen VP-Vertragsfassung. Keine Akzeptanz im Namen eines eingeladenen Partners.
- VP: 15 % Nettoumsatzprovision. Agentur: 20 % einschließlich des 15-Prozentpunkte-Anteils ihrer VP, nicht 20 % plus zusätzlich 15 %. Agenturfreigabe nur durch Admin. Agentur lädt eigene VP ein, Selbstregistrierung und Prüfung bleiben nötig.
- Schulungsunterlagen und buchbare Termine. Monteur-Zusatzrolle erst nach dokumentiert bestandener Monteur-Masterclass und Adminfreigabe. Keine Herstellerzertifizierung wird behauptet.
- Interner Werbemittelshop: personalisierte QR-Flyer, Visitenkarten und Kleidung. Ohne freigegebene Preise zunächst Angebotsanfragen, kein erfundener Festpreis und kein automatischer Druckauftrag.
- D2D: gemeinsam sichtbare Adress-/Bearbeitungs-/Sperrinformationen; Namen, Telefonnummer, E-Mail und Freitext strikt nur für erfassenden VP und Admin, nicht dessen Agentur.
- Ganze Kalendermonate in Europe/Berlin. Abrechnung spätestens Ende Folgemonat; späte Stornos bleiben mögliche Korrekturposten.
- Gewünschte Reserve: 5 % der Provision bis 2.500 EUR; Freigabeprüfung 12 Kalendermonate nach letztem provisionsrelevantem Auftrag. Keine automatische Bankzahlung. Einbehalt und Stornoausschluss bleiben vor bindender Anwendung vertragsrechtlich zu prüfen (§§ 87a,87c HGB).

## Technische Grenzen / Freigaben
Registrierung, personenbezogene D2D-Verarbeitung und finale Provisionsbuchung haben getrennte Freigaben in der Datenbank. Ohne veröffentlichte VP-Vertragsfassung ist keine vollständige Partnerregistrierung möglich. Die Vorschau zeigt alle Module, vergibt aber keine Rolle und speichert keine erfundenen Kunden oder Umsätze.

Unterprojekt baut unabhängig mit `npm install && npm run build`. Server authentifiziert Supabase-Nutzer; Zugriffe auf Tabellen und Dateien zusätzlich durch RLS geschützt. Keine Service-Role im Portalbrowser oder Partnerprojekt erforderlich. Admin-Ersteinrichtung über einen geschützten Service-Role-Prozess im bestehenden Shop, nicht per frei wählbarer Registrierungsrolle.

## Auslegungen, die vor Echtabrechnung freizugeben sind
Provisionsbasis zunächst wie bisher Warenumsatz netto ohne Versand/Montage. Reserve wird technisch pro provisionsverdienendem VP geführt. Bei Agentur-VP wird 5 % seines 15-%-Anteils reserviert; die Agentur erhält den restlichen 20-%-Gesamtanspruch zur weiteren Abrechnung. Agentureigene Umsätze: 5 % von deren 20-%-Provision. Keine zweite Reserve auf denselben VP-Anteil. Diese Abrechnungsregel muss in den tatsächlich freigegebenen Agentur-/VP-Vertrag übernommen oder vor Freigabe angepasst werden.

## Datenschutz / Rechtsquellen
- HGB §§87a,87c: https://www.gesetze-im-internet.de/hgb/__87a.html und https://www.gesetze-im-internet.de/hgb/__87c.html
- Kontaktwünsche/Telefon-/E-Mail-Werbung: https://www.gesetze-im-internet.de/uwg_2004/__7.html und https://www.gesetze-im-internet.de/uwg_2004/__7a.html
- DSGVO Art.5,6,13,25,32: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Supabase RLS/Storage: https://supabase.com/docs/guides/database/postgres/row-level-security und https://supabase.com/docs/guides/storage/security/access-control
- Amtliche Hauskoordinaten Hessen: https://hvbg.hessen.de/liegenschaftskataster/hauskoordinaten und https://www.geoportal.hessen.de/spatial-objects/706 (DL-DE-Zero-2.0). Gebäudeadresse ist weder ein Bewohnerverzeichnis noch ein verlässlicher Haushaltszähler.

Keine Behauptung vollständiger bundesweiter Adressabdeckung. Gebietsdaten benötigen eine erlaubte Datenquelle, korrekte Attribution und sichtbaren Importstand. Keine personenbezogenen Fremddaten werden aus Adressdiensten angereichert.
