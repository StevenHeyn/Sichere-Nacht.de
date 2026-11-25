/** SKU-specific guidance. Price/variant identity stays in the supplied catalog.
 * No stock, delivery promise, GPSR entity or installation certification is inferred.
 */
export type AdviceProduct={sku:string;name:string;line?:string;category?:string};
export type ProductAdvice={technology:string;environment:'Innen'|'Außen geeignet'|'Prüfen';role:string;purpose:string;system:string;limits:string[];installation:string;included:string;extra:string;source:string;standaloneVideo?:boolean;reviewed:boolean};
const root='https://support.ajax.systems/de/';
const known:Record<string,ProductAdvice>={};
function pair(skus:string[],detail:Omit<ProductAdvice,'reviewed'>){for(const sku of skus)known[sku]={...detail,reviewed:true}}
const common='Vor endgültiger Befestigung Funkqualität, Erfassungsbereich und Sabotageschutz am Montageort testen. Die Anleitung der konkreten Ausführung ist maßgeblich.';
pair(['38245.40.WH1','38244.40.BL1'],{technology:'Jeweller / Wings',environment:'Innen',role:'Zentrale',purpose:'Funkzentrale für ein neues System mit passenden Meldern und optionaler Fotoverifizierung.',system:'Hub 2 Plus: kompatible Jeweller-Geräte; MotionCam-Fotos über Wings. Kein direkter Fibra-Busanschluss.',limits:['Bis zu 200 Ajax-Geräte insgesamt; die individuellen Grenzen etwa für Sirenen und Gruppen zusätzlich beachten.','Frequenzregion und Firmware der Geräte müssen zusammenpassen. Keine pauschale Freigabe für Superior G3 oder EN54.'],installation:'Trockener Innenbereich, Netzversorgung und geeignete Internetanbindung. Mobilfunk-Backup setzt eine geeignete aktivierte SIM und Empfang voraus.',included:'Die konkrete Verpackungsliste bitte im Herstellerhandbuch und in der Artikelbestätigung abgleichen.',extra:'Melder, Sirenen und Bedienteile nach Bedarf. SIM/Tarif und gegebenenfalls Router-Notstromversorgung separat.',source:root+'central-units/hub-2-plus/'});
pair(['38239.40.WH1','38238.40.BL1'],{technology:'Jeweller / Wings',environment:'Innen',role:'Zentrale',purpose:'Hub 2 für ein kompatibles Ajax-Funksystem. Mobilfunkausführung vor Auswahl beachten.',system:'Jeweller/Wings; keine direkten Fibra-Leitungen.',limits:['Die Artikelbezeichnung dieser Katalogposition weist kein 4G aus. Mobilfunkvariante vor Kauf bestätigen.','Nicht mit Hub oder Hub Plus ohne „2“ gleichsetzen.'],installation:'Netzversorgung, geeigneter Internetzugang und lokale Funkprüfung erforderlich.',included:'Packungsinhalt der konkreten Artikelnummer vor Bestellung bestätigen.',extra:'Melder, Sirene, gegebenenfalls geeignete SIM und Tarif.',source:root+'central-units/hub-2/'});
pair(['38099.03.WH1','38098.03.BL1'],{technology:'Jeweller',environment:'Innen',role:'Öffnungsmelder',purpose:'Erkennt das Öffnen einer Tür oder eines Fensters. Besonders für Außenhaut- und Nachtabsicherung geeignet.',system:'Kompatible Ajax-Hub-Zentrale mit Jeweller. Im Konfigurator mit Hub 2 Plus vorgesehen.',limits:['Erkennt keine beliebige Beschädigung der Verglasung.','Kontakt und Magnet müssen zur Geometrie des Fensters bzw. der Tür passen.'],installation:common+' Abstand und Einbauposition des Magneten gemäß Handbuch einhalten.',included:'Herstellerhandbuch: Melder, Batterie, zwei Magnete und Montagematerial. Artikel-/Packungsvariante vor Lieferung abgleichen.',extra:'Hub separat; je unabhängig zu überwachender Öffnung eine passende Kontaktplanung.',source:root+'manuals/doorprotect/'});
pair(['119282.310.WH1','119281.310.BL1'],{technology:'Jeweller / Wings',environment:'Innen',role:'Fotobewegungsmelder',purpose:'Bewegungserkennung mit Fotoverifizierung. PhOD erlaubt Fotos auf Anfrage für berechtigte Nutzer.',system:'Foto-fähiger kompatibler Hub; im Konfigurator Hub 2 Plus. Jeweller für Ereignisse und Wings für Fotos.',limits:['Nicht an Hub oder Hub Plus ohne Fotoverifizierung einplanen. Für Foto-Funkverlängerung ReX 2 statt ReX prüfen.','HDR und Zusatzfunktionen hängen von konkreter Geräte-/Firmwareversion ab.','Haustiere sind nur innerhalb der Herstellerbedingungen berücksichtigt; kein pauschaler Fehlalarmausschluss.'],installation:common+' Sichtfeld nicht durch Möbel verdecken. Datenschutz und Fotoberechtigungen bewusst einrichten.',included:'Die konkrete HDR-/PhOD-Ausführung und Packungsliste vor Kauf anhand der Artikelnummer bestätigen.',extra:'Kompatibler Hub separat. Keine kontinuierliche Videoüberwachung; keine Videokamera oder NVR-Funktion.',source:root+'manuals/motioncam-phod/'});
pair(['38193.09.WH1','38194.09.BL1','38198.02.WH1','38199.02.BL1'],{technology:'Jeweller',environment:'Innen',role:'Bewegungsmelder',purpose:'Erkennt Bewegung in ausgewählten Räumen oder Laufwegen. Die Plus-Ausführung ergänzt PIR um einen Mikrowellensensor.',system:'Kompatibler Ajax-Hub mit Jeweller; keine Kamera und keine Fotoverifizierung.',limits:['Haustiere, Heizquellen, Fensterflächen und Möbel erfordern eine geeignete Platzierung.','Ein Melder ersetzt nicht die Prüfung mehrerer getrennt sichtbarer Raumzonen.'],installation:common,included:'Batterie-/Montagesatz der genauen MotionProtect- bzw. Plus-Ausführung im Handbuch prüfen.',extra:'Hub separat; Öffnungskontakte und Sirenen je Schutzkonzept.',source:root+'indoor-security/'});
pair(['38178.07.WH1','38179.07.BL1'],{technology:'Jeweller',environment:'Außen geeignet',role:'Sirene',purpose:'Akustische und optische Alarmierung am Objekt. Eine sichtbare Sirene kann das Schutzkonzept ergänzen.',system:'Kompatibler Ajax-Hub mit Jeweller. Die Sirene ist kein eigenständiger Einbruchmelder.',limits:['Alarmdauer, Lautstärke, Nachbarschaft und Montageort abstimmen.','Keine Garantie, dass ein Einbruch verhindert wird.'],installation:common+' Für Außenmontage geeignete Befestigung und Zugänglichkeit zur Wartung planen.',included:'Sirene und Zubehör gemäß konkreter Hersteller-Packungsliste.',extra:'Hub und alarmgebende Melder separat; optionale externe Versorgung nur passend zur Anleitung.',source:root+'manuals/streetsiren/'});
pair(['38111.11.WH1','38110.11.BL1'],{technology:'Jeweller',environment:'Innen',role:'Sirene',purpose:'Akustische Alarmierung im Innenraum.',system:'Kompatibler Ajax-Hub mit Jeweller.',limits:['Nicht als Außensirene verwenden.','Eine Sirene ist kein Ersatz für Melder.'],installation:common,included:'Packungsinhalt der konkreten HomeSiren-Ausführung prüfen.',extra:'Hub und Melder separat.',source:root+'sirens/homesiren/'});
pair(['38249.12.WH1','38248.12.BL1'],{technology:'Jeweller',environment:'Innen',role:'Bedienteil',purpose:'Scharf-/Unscharfschaltung per Code, abhängig von den vergebenen Berechtigungen.',system:'Kompatibler Ajax-Hub mit Jeweller.',limits:['Dieses KeyPad nicht mit KeyPad Plus oder TouchScreen gleichsetzen.','Tags und Karten benötigen ein dafür geeignetes Bedienteil.'],installation:common+' Bedienort und Eingangsverzögerung aufeinander abstimmen.',included:'KeyPad-Packungsinhalt und Batterieausführung im Handbuch prüfen.',extra:'Hub separat. Nutzerrechte und Codes im System konfigurieren.',source:root+'controls/keypad/'});
pair(['38255.08.WH1','38254.08.BL1'],{technology:'Jeweller',environment:'Innen',role:'Wassermelder',purpose:'Meldet Wasser an den Kontaktstellen, etwa unter Waschmaschine oder Spüle.',system:'Kompatibler Ajax-Hub mit Jeweller für Systemmeldungen.',limits:['Schließt nicht selbst die Wasserleitung.','Für automatische Absperrung sind geeignete zusätzliche Geräte und eine fachgerechte Installation erforderlich.'],installation:'An einer geeigneten bodennahen Stelle mit erwartbarem Wasserzutritt platzieren; Funktion und Funkverbindung testen.',included:'Melder und Batterieversorgung gemäß konkreter Packungsliste.',extra:'Hub separat. WaterStop bzw. passende Absperrlösung ist nicht Bestandteil dieses Melders.',source:root+'manuals/leaksprotect/'});
// Each family uses its own manual. Only the catalog variants listed here are reviewed.
const cameraManuals = 'https://ajax.systems/de/support/manuals/';
const wiredCameraVariants: Record<string, string[]> = {
  'bulletcam': [
    '79024.217.BL1', '79025.217.BL1', '79026.217.BL1', '79027.217.BL1',
    '79028.217.WH1', '79029.217.WH1', '79030.217.WH1', '79031.217.WH1',
  ],
  'turretcam': [
    '64923.197.WH1', '64924.197.BL1', '64925.197.WH1', '64926.197.BL1',
    '64927.197.WH1', '64928.197.BL1', '64929.197.WH1', '64930.197.BL1',
  ],
  'domecam-mini': [
    '76018.214.WH1', '76019.214.BL1', '76020.214.WH1', '76021.214.BL1',
    '76022.214.WH1', '76023.214.BL1', '76024.214.WH1', '76025.214.BL1',
  ],
  'bulletcam-hl': [
    '126252.217.BL1', '126253.217.WH1', '126254.217.BL1', '126255.217.WH1',
    '126256.217.BL1', '126257.217.WH1', '126258.217.BL1', '126259.217.WH1',
  ],
  'turretcam-hl': [
    '126260.197.BL1', '126261.197.WH1', '126262.197.BL1', '126263.197.WH1',
    '126264.197.BL1', '126265.197.WH1', '126266.197.BL1', '126267.197.WH1',
  ],
  'domecam-mini-hl': [
    '126268.214.BL1', '126269.214.WH1', '126270.214.BL1', '126271.214.WH1',
    '126272.214.BL1', '126273.214.WH1', '126274.214.BL1', '126275.214.WH1',
  ],
  'bulletcam-hlvf': [
    '126276.217.BL1', '126277.217.WH1', '126278.217.BL1', '126279.217.WH1',
  ],
  'turretcam-hlvf': [
    '126280.197.BL1', '126281.197.WH1', '126282.197.BL1', '126283.197.WH1',
  ],
  'domecam-hlvf': [
    '126284.214.BL1', '126285.214.WH1', '126286.214.BL1', '126287.214.WH1',
  ],
};
for (const [manual, skus] of Object.entries(wiredCameraVariants)) {
  pair(skus, {
    technology: 'Video / Ethernet',
    standaloneVideo: true,
    environment: 'Außen geeignet',
    role: 'Netzwerkkamera',
    purpose: 'Zeigt Livebilder in der Ajax App. Aufzeichnungen lassen sich auf einer geeigneten microSD-Karte oder einem kompatiblen Videorekorder speichern.',
    system: 'Die Kamera wird per Ethernet mit dem Netzwerk verbunden und einem Space in der Ajax App hinzugefügt.',
    limits: ['Für ein Videoarchiv wird ein eingerichteter Speicher benötigt.'],
    installation: 'Bildausschnitt am Montageort testen und Kabelverbindungen im Außenbereich gegen Feuchtigkeit schützen.',
    included: 'Kamera in der gewählten Ausführung. Auflösung und Objektiv stehen in der Artikelbezeichnung.',
    extra: 'Ethernetkabel und passende PoE-Versorgung oder ein geeignetes Netzteil. Speicher separat einplanen.',
    source: cameraManuals + manual + '/',
  });
}

const wifiVideo = {
  technology: 'Video / WLAN',
  standaloneVideo: true,
  system: 'Für Livevideo das Gerät mit dem WLAN verbinden und in der Ajax App einem Space hinzufügen. Ein kompatibler Hub ermöglicht einen zusätzlichen Funkkanal.',
  limits: ['Am Montageort muss das 2,4-GHz-WLAN für die Videoübertragung ausreichen.'],
  extra: 'Für ein Videoarchiv einen kompatiblen Ajax Videorekorder oder Ajax Cloud Storage einplanen.',
};
pair(['111566.303.WH1', '111567.303.BL1'], {
  ...wifiVideo,
  environment: 'Innen',
  role: 'Innenkamera',
  purpose: 'Überträgt Livebilder aus Innenräumen in die Ajax App und ermöglicht Gegensprechen.',
  installation: 'Die Kamera im Innenraum mit Blick auf den gewünschten Bereich ausrichten. Stromanschluss in der Nähe einplanen.',
  included: 'IndoorCam in der gewählten Gehäusefarbe.',
  source: cameraManuals + 'indoorcam/',
});
pair(['66390.125.WH1', '66391.125.BL1', '66392.125.GP1', '66393.125.GR1'], {
  ...wifiVideo,
  environment: 'Außen geeignet',
  role: 'Videotürklingel',
  purpose: 'Zeigt in der Ajax App, wer klingelt. Über Mikrofon und Lautsprecher kannst du mit Besuchern sprechen.',
  installation: 'Vor dem Einbau Stromversorgung, vorhandenen Türgong und WLAN-Empfang am Eingang prüfen.',
  included: 'DoorBell in der gewählten Gehäusefarbe mit BellKit für einen kompatiblen verdrahteten Gong.',
  source: cameraManuals + 'doorbell/',
});

export function productAdvice(p:AdviceProduct):ProductAdvice{
 if(known[p.sku])return known[p.sku];
 const text=p.name+' '+(p.category||'')+' '+(p.line||'');
 const accessory=/smartbracket|bracket|halter|cover|frame|gehäuse|magnet|mountcam|junctionbox|case |batter|\bpsu\b|module holder/i.test(p.name);
 const fibra=!accessory&&/fibra/i.test(text),g3=!accessory&&/\bG3\b/i.test(p.name),en54=!accessory&&/EN54/i.test(p.name);
 const video=!accessory&&/bulletcam|turretcam|domecam|indoorcam|doorbell|\bnvr\b/i.test(p.name);
 return {technology:accessory?'Zubehör':fibra?'Fibra':g3?'Superior G3':en54?'EN54':video?'Video / Netzwerk':'Zuordnung prüfen',environment:'Prüfen',role:accessory?'Zubehör / Einzelteil':video?'Video':fibra||g3||en54?'Fachplanung':'Komponente',purpose:accessory?'Einzelteil oder Zubehör. Die Produktbezeichnung bezeichnet nicht automatisch ein vollständiges Gerät.':video?'Videokomponente. Netzwerk, Versorgung, Aufnahme und gegebenenfalls Speicher separat planen.':'Konkrete Gerätefunktion, Systemausführung und Anwendung vor Bestellung abgleichen.',system:fibra?'Benötigt eine passende Fibra-fähige Zentrale. Ein normaler Funk-Hub stellt keinen Fibra-Bus bereit.':g3||en54?'Eigene Systemlinie: kompatible Zentrale und konkrete Freigabe anhand des Ajax-Kompatibilitätstools prüfen.':'Die genaue Artikelnummer und offizielle Kompatibilitätsliste sind maßgeblich.',limits:['Für diese Artikelnummer ist hier noch keine vollständige technische Einzelfreigabe dokumentiert.','Marketinglinie, Funkprotokoll und Sicherheitsgrad sind nicht dasselbe.'],installation:fibra||g3||en54?'Fachplanung erforderlich. Leitungen, Stromversorgung, Topologie und Inbetriebnahme müssen zur konkreten Anlage passen. Keine ungeprüfte DIY-Zusage.':/LightCore|LightSwitch|WallSwitch|Outlet|WaterStop/i.test(p.name)?'Netzspannung bzw. Eingriff in die Wasserinstallation: geeigneten Fachbetrieb einbeziehen.':'Montage- und Betriebsvoraussetzungen vor Kauf anhand des konkreten Herstellerhandbuchs prüfen.',included:'Lieferumfang für diese Artikelnummer noch zu bestätigen; Produktbild ist keine vollständige Packungsliste.',extra:'Passende Zentrale, Stromversorgung, Kabel, Gehäuse oder Speicher können separat erforderlich sein.',source:'https://ajax.systems/de/tools/devices-compatibility/',reviewed:false};
}
export const verifiedCoreSkus=()=>Object.keys(known);
