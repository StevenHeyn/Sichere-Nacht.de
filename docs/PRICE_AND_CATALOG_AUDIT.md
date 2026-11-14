# Artikel- und Preisabgleich – 14.11.2026

## Verwendete Quellen
- Vom Nutzer bereitgestellt: `2026-11-09_Artikeldaten_Ajax.csv` (902 Datensätze).
- Aktueller Shopkatalog `products.json`, öffentliche Preis-/EAN-Daten aus der CI-Prüfung zu Commit 873311ad373b4ae206e1ba7962d6e91c324b14d2.
- Früher bestätigte Betreiberentscheidung vom 09.11.2026: Verkaufspreise ausdrücklich runden, etwa UVP 151,92 EUR auf Verkaufspreis 149,90 EUR. Daher nicht ungefragt auf exakte UVP zurücksetzen.

## Ergebnis
- 902 eindeutige Artikelnummern; alle 902 im gelieferten CSV gefunden.
- 0 Abweichungen bei Artikelnummernzuordnung, EAN, Artikelbezeichnung und gespeichertem `uvpCents` gegenüber der CSV.
- 890 positive Verkaufspreise; alle enden auf ,90 EUR. Diese freigegebene Preislogik wurde erhalten.
- 12 Nullpreis-Positionen bleiben aus dem verkäuflichen Shop ausgeblendet.
- 888 Verkaufspreise unterscheiden sich rechnerisch von der ungerundeten Lieferanten-UVP. Das ist angesichts der bestätigten Rundungsentscheidung **nicht automatisch ein Fehler**. Kein Preis wurde im Rahmen dieses Abgleichs geändert.

## Grenzen
Dieser Abgleich bestätigt weder aktuelle Einkaufskonditionen nach dem Dateidatum noch Lagerbestand, Lieferzeit, vollständige Produktsicherheitspflichtangaben oder die Passung sämtlicher Zubehörvarianten. Lieferanten-Kurzbeschreibungen wurden nicht pauschal als artikelgenaue Montage-/Lieferumfangsfreigabe übernommen. Insbesondere Zubehörtexte können allgemeine Beschreibungen des Hauptgeräts enthalten.

Keine Einkaufspreise oder Margen werden im öffentlichen Katalogvergleich publiziert.
