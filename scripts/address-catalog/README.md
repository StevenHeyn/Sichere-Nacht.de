# Deutschland-Adresskatalog

Unveränderliche Snapshots aus dem Deutschland-Extrakt von Geofabrik / OpenStreetMap (ODbL). Keine Vollständigkeitszusage und keine Bewohnerdaten. Die Quelldatei mit ihrem veröffentlichten MD5-Wert prüfen. `extract.py` verarbeitet Nodes, Ways und adressierte Multipolygone; Ausschlüsse stehen im Manifest. Quelle und Attribution müssen in der Karte und beim Datenexport sichtbar bleiben.

Die komprimierten Basispunkte liegen im öffentlichen Bucket `vp-address-catalog`. Bearbeitungen, Sperren und private Kontakte bleiben in den bestehenden RLS-geschützten Tabellen. Ein Punkt wird erst bei Auswahl aus dem vertrauenswürdigen Snapshot in `vp_addresses` übernommen. Quellenaktualisierungen überschreiben niemals Qualifizierungen.

Snapshots werden nur nach vollständiger Prüfung aller Dateien aktiviert. Jeder Upload ist an einen zeitlich begrenzten, gehashten Importtoken und genau einen Snapshot gebunden. Ein erfolgreicher Abruf jedes Objekts wird vor Aktivierung geprüft. Frühere Snapshots werden nicht automatisch gelöscht; sie erlauben einen Rückwechsel. Ausfälle von Geofabrik/Overpass beeinflussen das Lesen bereits gespeicherter Punkte nicht. Die optionale OSM-Hintergrundkarte ist ein separater Dienst; Punkte und Liste funktionieren auch ohne Hintergrundkacheln.

## Ausführung und Wiederherstellung

1. Offiziellen Deutschland-PBF-Extrakt und passenden datierten MD5-Prüfwert von Geofabrik herunterladen; Hash prüfen.
2. `python extract.py germany.osm.pbf ./snapshot de-osm-YYYYMMDD` (Paket `osmium==4.3.2`). Auf einem Worker mit ausreichend RAM und temporärem Plattenspeicher ausführen, nicht in einem HTTP-Request. Disk-basierter Koordinatenindex; kein Download öffentlicher Kartenkacheln.
3. Neuen `building`-Datensatz in `vp_address_snapshots` und einen zufälligen Importtoken (nur SHA-256 in `vp_address_import_tokens`, Ablaufzeit begrenzen) anlegen. Der öffentliche Bucket enthält ausschließlich OSM-Basisdaten.
4. `python upload.py ./snapshot /private/token-file PROJECT_REF` (Paket `requests`). Uploads sind wiederaufnehmbar, auf genau diesen Snapshot beschränkt und werden vollständig zurückgelesen und per SHA-256 verifiziert. `verified.jsonl` ist der lokale Prüfbeleg.
5. `python activate.py ./snapshot` erzeugt die atomare SQL-Aktivierung. Diese prüft Anzahl, Bytes und einen gemeinsamen Fingerabdruck der serverseitigen Uploadbelege. Danach wird der Importtoken gelöscht. Niemals einen teilweisen Snapshot als aktiv markieren.
6. Bei Problemen den vorherigen bereits verifizierten Snapshot in einer Transaktion wieder aktiv setzen. Keine Qualifizierungs-/Kontakttabelle zurücksetzen. Im normalen Kartenbetrieb finden keine Geofabrik-, Overpass- oder Nominatim-Abfragen statt.

Die externe Hintergrundkarte ist optional für die Orientierung, wird nur für den sichtbaren Ausschnitt geladen und nach den HTTP-Cachevorgaben des Kartenanbieters zwischengespeichert. Die Adresspunkte selbst liegen dauerhaft in unserem Storage. Die bestehende manuelle Adresserfassung bleibt verfügbar.
