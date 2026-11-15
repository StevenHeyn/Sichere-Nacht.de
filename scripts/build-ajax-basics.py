from pathlib import Path
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'partner-portal/assets/training/ajax-technisches-basiswissen.pdf'
FONT='/usr/share/fonts/truetype/dejavu/'
pdfmetrics.registerFont(TTFont('Guide',FONT+'DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('GuideBold',FONT+'DejaVuSans-Bold.ttf'))
pdfmetrics.registerFontFamily('Guide',normal='Guide',bold='GuideBold',italic='Guide',boldItalic='GuideBold')
navy=HexColor('#081324');mint=HexColor('#8ce6c9');gray=HexColor('#486070')
styles={
 'title':ParagraphStyle('title',fontName='GuideBold',fontSize=23,leading=27,textColor=navy,spaceAfter=10),
 'h':ParagraphStyle('h',fontName='GuideBold',fontSize=12,leading=16,textColor=navy,spaceBefore=9,spaceAfter=4),
 'p':ParagraphStyle('p',fontName='Guide',fontSize=9.5,leading=13,textColor=navy,spaceAfter=6),
 'small':ParagraphStyle('small',fontName='Guide',fontSize=8.3,leading=12,textColor=gray,spaceAfter=6),
 'q':ParagraphStyle('q',fontName='Guide',fontSize=10,leading=14,textColor=navy,spaceAfter=0),
}
story=[]
def p(t,kind='p'):story.append(Paragraph(t,styles[kind]))
def h(t):p(t,'h')
def quote(t):
 box=Table([[Paragraph(t,styles['q'])]],colWidths=[475]);box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),HexColor('#e9f7f3')),('BOX',(0,0),(-1,-1),.6,mint),('LEFTPADDING',(0,0),(-1,-1),14),('RIGHTPADDING',(0,0),(-1,-1),14),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12)]));story.extend([box,Spacer(1,10)])
def page(k,title):
 if story:story.append(PageBreak())
 p(k.upper(),'small');p(title,'title')
def bullet(t):p('• '+t)
page('01 · System verstehen','Ajax - Technisches<br/>Basiswissen')
p('Für Vertriebspartner von sichere-nacht.de · Version 1.0 · 15.11.2026','small')
p('Dieses Grundlagenheft erklärt die wichtigsten Bausteine und typische Kundenfragen. Es ist keine Montageanleitung. Die Beispiele beziehen sich überwiegend auf Ajax-Funkgeräte mit Jeweller; Ausstattung und Kompatibilität hängen vom genauen Modell ab.')
quote('Merksatz: Der Melder erkennt. Die Zentrale verarbeitet. Sirene und Benachrichtigung informieren. Menschen oder ein vereinbarter Dienst reagieren.')
h('Die Zentrale: der Hub [1]')
p('Der Hub verbindet die Geräte zu einem System, verarbeitet Ereignisse und steuert die konfigurierte Alarmreaktion. Über seine verfügbaren Internetwege kommuniziert er mit Ajax Cloud. Welche Wege vorhanden sind, etwa Ethernet oder Mobilfunk, hängt vom Hub-Modell ab.')
h('Funk im Haus ist nicht dasselbe wie Internet [1, 2]')
p('Jeweller überträgt Ereignisse und Alarme zwischen kompatiblen Geräten und Hub per geschützter Funkverbindung. Die Melder benötigen dafür nicht das WLAN des Kunden. Wings überträgt bei unterstützten Geräten Fotos. Der Hub braucht einen funktionierenden Übertragungsweg für die Kommunikation nach außen.')
h('Beispiel: Eine geschützte Tür wird geöffnet')
for t in ['1. Der Öffnungsmelder erkennt, dass sich Magnet und Melder trennen.', '2. Der Hub verarbeitet das Ereignis entsprechend Scharfschaltung, Bereich und Einstellungen.', '3. Eingebundene Sirenen und eingerichtete Benachrichtigungen werden entsprechend der Konfiguration ausgelöst.', '4. Die benachrichtigte Person handelt nach dem vereinbarten Ablauf. Eine Meldung ist noch kein automatisch organisierter Einsatz.']:bullet(t)
p('Verkäuferfrage: „Wer soll eine Meldung erhalten, und was soll diese Person dann tun?“ Keinen automatischen Polizei- oder Sicherheitsdiensteinsatz zusagen.')
page('02 · Erkennen','Welcher Melder<br/>erkennt was?')
h('DoorProtect: Türen und Fenster [3]')
p('Ein Öffnungsmelder arbeitet mit einem Magneten. Entfernen sich die beiden Teile beim Öffnen ausreichend voneinander, wird das erkannt. Beispiel: Terrassentür. Ein einfacher Öffnungskontakt erkennt nicht automatisch eingeschlagenes Glas oder jeden Einbruchsversuch. Zusätzliche Erschütterungs- oder Neigungsfunktionen nur beim passenden Modell zusagen.')
h('MotionProtect: Bewegung im Raum [4]')
p('Ein passiver Infrarotsensor (PIR) erkennt Veränderungen der Wärmestrahlung durch Bewegung im Erfassungsbereich. Er nimmt keine Bilder auf. Beispiel: Ein Durchgang im Erdgeschoss. Sichtfeld, Umgebung und Position entscheiden über die Eignung; ein Bewegungsmelder sieht nicht durch Wände.')
p('<b>Haustiere:</b> Geeignete Geräte und Einstellungen können Tierbewegungen berücksichtigen. Das ist von Tier, Montage und Umgebung abhängig. Niemals pauschal „Ihr Hund löst keinen Alarm aus“ versprechen.')
h('MotionCam: Bewegung plus Fotoverifizierung [5]')
p('Bei einer passenden Konfiguration können Fotos zu einem Bewegungsalarm helfen, dessen Ursache einzuordnen. Dafür müssen Melder und Hub die Funktion unterstützen. Das ist keine dauerhafte Videoüberwachung. Foto auf Anfrage erfordert eine dafür geeignete Variante, etwa PhOD, und entsprechende Berechtigungen.')
h('GlassProtect und kombinierte Melder [6]')
p('Ein Glasbruchmelder wertet typische Geräusche von Glasbruch aus. Er erfüllt eine andere Aufgabe als ein Öffnungskontakt. Kombigeräte können mehrere Erkennungsarten verbinden. Vor einer Zusage Glasart, Umgebung und genaue Gerätefunktionen technisch prüfen lassen.')
quote('Im Gespräch: „Dieser Melder ist für [Ereignis] vorgesehen. Ob er an dieser Stelle passt, prüfen wir anhand des Raums und des konkreten Modells.“')
page('03 · Bedienen und alarmieren','Alltagstauglich<br/>bedienen.')
h('App, KeyPad und SpaceControl [6]')
p('Mit der App können berechtigte Nutzer den Zustand sehen und unterstützte Funktionen bedienen. Ein KeyPad ist ein Bedienteil, etwa für die Bedienung per Code; Karten oder Tags unterstützen nur geeignete Varianten. SpaceControl ist eine Fernbedienung. Persönliche Berechtigungen statt gemeinsam verteilter Zugangsdaten vorsehen.')
h('Scharf, unscharf und Nachtmodus')
p('Scharf bedeutet: Die vorgesehenen Einbruchmelder reagieren nach den eingestellten Regeln. Unscharf bedeutet nicht, dass jeder Schutz ausgeschaltet ist: etwa Brand- oder Wassermeldungen können weiterhin aktiv sein. Im Nachtmodus werden ausgewählte Melder überwacht. Welche Bewegungen im Haus möglich bleiben, muss die Planung festlegen.')
h('HomeSiren und StreetSiren [6]')
p('Sirenen machen ein Ereignis vor Ort hörbar; geeignete Modelle signalisieren auch optisch. Eine Außensirene muss für den Außenbereich geeignet sein. Sie ersetzt weder passende Melder noch einen Reaktionsplan. Nicht jeder ausgelöste Sensor muss automatisch jede Sirene aktivieren: Entscheidend sind die Einstellungen.')
h('Button: bewusst ausgelöste Aktion [7]')
p('Button kann je nach gewähltem Modus einen manuell ausgelösten Alarm melden oder eine eingerichtete Automatisierung anstoßen. Er ist kein Melder, der selbst einen Einbruch erkennt. Empfänger und Reaktion müssen eingerichtet sein; ein Hilfeknopf allein ist noch kein gebuchter Notrufdienst.')
h('Ein- und Ausgangsverzögerung')
p('Eine passende Verzögerung gibt berechtigten Nutzern Zeit zum Verlassen oder Unscharfschalten. Dauer und betroffene Melder gehören in die technische Planung. Der Vertrieb erklärt den Zweck und nimmt die Alltagsabläufe auf, statt Einstellungen beim Kunden zu improvisieren.')
quote('Demo-Frage: „Wie möchten Sie beim Verlassen und Heimkommen bedienen: mit App, Code oder Fernbedienung?“')
page('04 · Ergänzende Komponenten','Mehr als<br/>Einbruchmeldung.')
h('FireProtect: Brandgefahren erkennen [8]')
p('Die FireProtect-Familie umfasst unterschiedliche Varianten. Je nach Modell werden Rauch, Hitze und/oder Kohlenmonoxid erkannt. Die genaue Bezeichnung ist entscheidend: Nicht jeder FireProtect erkennt alles. CO ist Kohlenmonoxid und nicht CO₂. Die passende Geräteauswahl und Platzierung gehören in die Fachplanung.')
h('LeaksProtect: austretendes Wasser [9]')
p('Kontakte am Gerät erkennen Wasser, das den Melder erreicht. Beispiel: am Boden bei einer Waschmaschine. Das Gerät erkennt kein Leck, dessen Wasser es nicht erreicht. Ein Wassermelder allein dreht den Wasserhahn nicht zu; eine automatische Absperrung benötigt zusätzliche passende Technik und ein eingerichtetes Szenario.')
h('ReX: Funkreichweite erweitern [6]')
p('Ein geeigneter Funk-Repeater kann die Verbindung zwischen Hub und Geräten erweitern. Er ist kein WLAN-Verstärker. Unterstützte Geräte und Fotoübertragung hängen von der Repeater- und Hub-Variante ab. Ob er nötig ist, zeigt die Prüfung am Objekt, nicht allein die Quadratmeterzahl.')
h('Strom, Batterien und Internet [1]')
p('Viele Funkmelder arbeiten mit Batterien; der Hub hat bei entsprechenden Modellen eine Pufferbatterie. Diese hält nicht unbegrenzt. Laufzeiten hängen unter anderem von Modell, Nutzung und Einstellungen ab. Batteriewarnungen und Wartungsbedarf müssen beachtet werden.')
p('Bei einem Internetausfall kann die lokale Alarmfunktion bei versorgtem, funktionsfähigem System weiterarbeiten. Meldungen nach außen brauchen einen verfügbaren, eingerichteten Übertragungsweg. Ein Mobilfunk-Backup setzt unter anderem passenden Hub, Empfang und eine nutzbare SIM voraus. Keine feste Ausfalldauer pauschal garantieren.')
quote('Nicht gleichsetzen: Funkreichweite ≠ WLAN-Reichweite. Alarmfoto ≠ Livevideo. Wassermeldung ≠ Wasserabsperrung. Benachrichtigung ≠ Intervention.')
page('05 · Sicher beraten','Was ein VP<br/>wissen und fragen sollte.')
h('Vor der Empfehlung klären')
for t in ['Welche Zugänge und Bereiche sollen betrachtet werden?', 'Wer bedient das System, und wie wird es nachts genutzt?', 'Gibt es Haustiere, besondere Glasflächen oder Außenbereiche?', 'Welche Internet- und Mobilfunkmöglichkeiten sind vorhanden?', 'Sind Fotos erwünscht, und wer darf sie sehen?', 'Wer reagiert auf Alarme, Störungen und Batteriewarnungen?']:bullet(t)
h('An die technische Planung weitergeben')
p('Unklare Funkversorgung, besondere Montageorte, Außenüberwachung, Anforderungen von Versicherern, spezielle Glasarten, Fremdgeräte, Brand-/CO-Konzept und automatische Absperrung. Konkrete Kompatibilität, Anzahl der Geräte und Softwarestand vor verbindlicher Zusage prüfen. Ein Ausbau ist nicht mit jeder Zentrale unbegrenzt möglich.')
h('Fünf Fragen zur Selbstkontrolle')
for q,a in [('Braucht jeder Jeweller-Melder WLAN?','Nein. Die Verbindung zum Hub erfolgt über Jeweller.'),('Macht jeder Bewegungsmelder Bilder?','Nein. Dafür ist ein geeignetes Gerät wie MotionCam erforderlich.'),('Schließt LeaksProtect selbst ein Ventil?','Nein. Dafür sind zusätzliche Technik und Einrichtung nötig.'),('Ruft jede Anlage automatisch die Polizei?','Nein. Empfänger, Dienste und Reaktion müssen vereinbart sein.'),('Ist die Anlage nach dem Verkauf wartungsfrei?','Nein. Funktion, Warnmeldungen, Batterien und Nutzung müssen regelmäßig berücksichtigt werden.')]:p('<b>'+q+'</b><br/>'+a)
p('Praxisübung: Erkläre einem Kollegen in 60 Sekunden den Weg vom geöffneten Fenster bis zur Benachrichtigung. Begründe anschließend für drei Komponenten jeweils ihren Zweck und eine Grenze.','small')
page('06 · Nachschlagen','Quellen und<br/>Geltungsbereich.')
p('Eigenständig formulierte Grundlagenschulung. Quellen sind Herstellerunterlagen von Ajax; einige sind als Kopie bei Fachhändlern zugänglich. Ältere Unterlagen dienen nur zur Erklärung der Grundprinzipien, nicht als aktuelle Kompatibilitäts- oder Leistungszusage. Recherche: 15.11.2026. Das aktuelle konkrete Gerätehandbuch hat Vorrang.','small')

for label,url in [('[1] Ajax: Hub 2, Herstellerhandbuch', 'https://device.report/m/a7ee7a55b5d6114827b74ad1331e38f60df4a93e5c8d4d11b295a02a182b1926'), ('[2] Ajax: Jeweller', 'https://ajax.systems/wp-content/themes/ajax/assets/jeweller/Jeweller_En.pdf'), ('[3] Ajax: DoorProtect, Herstellerhandbuch', 'https://www.aesag.ch/en/content/90-ajax-doorprotect-user-manual'), ('[4] Ajax: MotionProtect, Herstellerhandbuch', 'https://www.getic.de/files/catalogue/4670/motionprotect_usermanual-6597ff6100dc6.pdf'), ('[5] Ajax: MotionCam (PhOD), Herstellerhandbuch', 'https://media.secplan.de/public/media/ee/c0/8e/1718083404/benutzerhandbuch-motioncam-phod-jeweller-ajax-systems-support.pdf'), ('[6] Ajax-Handbücher: GlassProtect, KeyPad, Sirenen, ReX', 'https://www.secplan.de/anleitungen-software/ajax/'), ('[7] Ajax: Button', 'https://support.ajax.systems/de/controls/button/'), ('[8] Ajax: FireProtect 2 (Heat/Smoke/CO), Herstellerhandbuch', 'https://cdn.adiglobaldistribution.us/pim/Original/10819/XY-95166BL3_User-Manual.pdf'), ('[9] Ajax: LeaksProtect, Herstelleranleitung', 'https://ajax.systems/wp-content/uploads/2018/09/Guide_LeaksProtect_en_web.pdf')]:
 h(label);p(f'<link href="{url}" color="#16705d">Herstellerinformation öffnen</link>','small')
p('Dieses Dokument beschreibt technische Möglichkeiten, keine vollständige Liste der bei sichere-nacht.de verfügbaren Produkte oder Leistungen. Verfügbarkeit, Montageumfang und Preise im aktuellen Angebot prüfen.','small')
def furniture(c,doc):
 c.setFillColor(navy);c.rect(0,808,595.28,34,fill=1,stroke=0);c.setFillColor(mint);c.setFont('GuideBold',9);logo=svg2rlg(str(ROOT/'public/sichere-nacht-logo.svg'));logo.scale(21/80,23/88);renderPDF.draw(logo,c,48,812);c.drawString(78,821,'SICHERE NACHT  /  PARTNER-AKADEMIE');c.setStrokeColor(mint);c.line(48,42,547,42);c.setFont('Guide',8);c.setFillColor(gray);c.drawString(48,28,'Ajax - Technisches Basiswissen · v1.0 · 15.11.2026');c.drawRightString(547,28,str(doc.page))
OUT.parent.mkdir(parents=True,exist_ok=True)
SimpleDocTemplate(str(OUT),pagesize=(595.28,841.89),rightMargin=60,leftMargin=60,topMargin=57,bottomMargin=54,title='Ajax - Technisches Basiswissen',author='sichere-nacht.de').build(story,onFirstPage=furniture,onLaterPages=furniture)
print(OUT)
