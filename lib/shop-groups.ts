export const SHOP_GROUPS=[
 {id:'alle',label:'Alle Produkte',icon:'◈',description:'Gesamtes Ajax-Sortiment'},
 {id:'zentralen',label:'Alarmzentralen',icon:'⌂',description:'Hubs und Funkzentralen'},
 {id:'bewegung',label:'Bewegungsmelder',icon:'◎',description:'Innen, außen und mit Foto'},
 {id:'oeffnung',label:'Tür- & Fenstermelder',icon:'▣',description:'Öffnungs-, Glasbruch- und Erschütterungsschutz'},
 {id:'sirenen',label:'Sirenen',icon:'◉',description:'Sichtbare und hörbare Alarmierung'},
 {id:'bedienung',label:'Bedienung & Zugang',icon:'⌘',description:'Bedienteile, Handsender und Zutritt'},
 {id:'video',label:'Videoüberwachung',icon:'▤',description:'Kameras, Videotürklingeln und Rekorder'},
 {id:'brand',label:'Brand- & CO-Melder',icon:'♨',description:'Rauch, Hitze und Kohlenmonoxid'},
 {id:'wasser',label:'Wasserschutz',icon:'≋',description:'Wassermelder und Ventile'},
 {id:'smart',label:'Smart Home',icon:'✧',description:'Licht, Steckdosen und Luftqualität'},
 {id:'fibra',label:'Fibra & Profi-Systeme',icon:'⌁',description:'Kabelgebundene und EN54-Komponenten'},
 {id:'zubehoer',label:'Zubehör & Ersatzteile',icon:'⚙',description:'Halterungen, Rahmen, Batterien und Ersatzteile'}
] as const;
export type ShopGroup=(typeof SHOP_GROUPS)[number]['id'];
export type Classifiable={name:string;category:string;line:string};
export function getShopGroup(p:Classifiable):ShopGroup{
 const n=p.name.toLowerCase(),c=p.category.toLowerCase(),line=p.line.toLowerCase();
 // Zubehör und Dummies müssen VOR produktbezogenen Schlüsselwörtern zugeordnet werden.
 if(/^(ad-|as-)|dummy|smartbracket|mounting|mount |bracket|halterung|montageplatte|ersatz|replacement|battery|batterie|cover|abdeckung|sidecover|frame|rahmen|adapter|kabel|cable|power supply|netzteil|hub-holder|holder|case\b|gehäuse|housing|accessory|zubehör|abdeckkappe/.test(n)||/zubehör/.test(c))return 'zubehoer';
 if(line==='fibra'||line==='en54 line'||/fibra|en54|brandwarnanlage/.test(c)||/fibra|en54/.test(n))return 'fibra';
 if(/fireprotect|firesprotect|fire protect|smoke|rauchmelder|brandmelder|heatprotect|co detector|kohlenmonoxid/.test(n)||/brandmelder/.test(c))return 'brand';
 if(/leaksprotect|waterstop|water stop|wassermelder|wasserstopp|ventil|valve/.test(n)||/wassermelder/.test(c))return 'wasser';
 if(/hub |hub\b|repeater|rex 2|rex\b|zentrale/.test(n)&&!/motion|door|keypad|holder|battery/.test(n))return 'zentralen';
 if(/street.?siren|home.?siren|siren|sirene/.test(n))return 'sirenen';
 if(/motioncam|motionprotect|combi.?protect|curtain|outdoorprotect|bewegungsmelder|pir\b|dualcurtain/.test(n))return 'bewegung';
 if(/doorprotect|glassprotect|glassbreak|öffnungs|erschütterung|shockprotect/.test(n))return 'oeffnung';
 if(/keypad|spacecontrol|button\b|panic|doublebutton|tag\b|pass\b|access|tastatur|bedienteil|handsender|key.?fob/.test(n))return 'bedienung';
 if(/nvr|camera|cam\b|kamera|doorbell|videorecorder|videoüberwachung/.test(n))return 'video';
 if(/light.?switch|outlet|socket|wall.?switch|air.?quality|lifequality|temperature|relay\b|wallswitch|smart home|steckdose|schalter|strom|licht/.test(n)||/lightswitch|luftqualität/.test(c))return 'smart';
 return 'zubehoer';
}

export const SHOP_GUIDES:Partial<Record<ShopGroup,string>>={
 zentralen:'Die Alarmzentrale verbindet die passenden Melder und Bedienteile zu einem System. Vergleiche zuerst Funktechnik, Fotoverifizierung und Kommunikationswege. Für eine Erweiterung ist das genaue Hub-Modell entscheidend; eine Jeweller-Funkzentrale bietet nicht automatisch einen Fibra-Anschluss.',
 bewegung:'Bewegungsmelder überwachen Räume und Laufwege. Wähle passend zu Innen- oder Außenbereich, Raumaufteilung und Haustieren. Wenn du Fotos zu einem Alarm benötigst, prüfe eine passende MotionCam-Ausführung und eine Zentrale mit Fotoverifizierung. Ein normaler Bewegungsmelder liefert keine Kamerabilder.',
 oeffnung:'Tür- und Fenstermelder ergänzen die Absicherung der Außenhaut. Ein Öffnungskontakt erkennt das Öffnen; Glasbruch- und Erschütterungserkennung sind zusätzliche, geräteabhängige Funktionen. Plane jede unabhängig zu überwachende Öffnung und prüfe Magnetabstand sowie Montagegeometrie.',
 sirenen:'Innensirenen und Außensirenen machen einen Alarm hörbar; geeignete Ausführungen ergänzen ihn optisch. Wähle das Gerät nach Einsatzort und kompatiblem Hub. Eine Sirene erkennt selbst keinen Einbruch und ersetzt deshalb keine Melder.',
 bedienung:'Bedienteile, Handsender und Taster erleichtern die Bedienung der Alarmanlage. Prüfe, ob du Codes, Karten oder Tags benötigst und welche Funktionen die konkrete Ausführung unterstützt. Nicht jedes KeyPad unterstützt berührungslose Zutrittsmedien.',
 wasser:'Wassermelder erkennen austretendes Wasser an ihren Kontaktstellen, etwa unter Waschmaschine oder Spüle. Ein Melder sperrt die Wasserleitung nicht selbst ab. Für eine automatische Absperrung sind eine passende Ventillösung, Systemplanung und fachgerechte Installation nötig.',
 video:'Kameras, Videotürklingeln und Rekorder benötigen eine passende Netzwerk- und Stromversorgung. Prüfe Aufnahmeart, Speicher und Zugriffsrechte für deinen Einsatz. Die Fotoverifizierung eines Alarmmelders ist keine kontinuierliche Videoüberwachung.',
 fibra:'Kabelgebundene Fibra-Geräte benötigen eine passende Zentrale und eine geplante Verkabelung. Unterschiedliche Fachlinien sind nicht pauschal miteinander kompatibel. Lass Zentrale, Versorgung und die konkrete Geräteausführung vor der Bestellung abgleichen.',
 zubehoer:'Halterungen, Abdeckungen und Ersatzteile müssen zur genauen Geräteausführung passen. Artikelnummer, Gehäusevariante und Lieferumfang sind entscheidend. Ein Zubehörbild zeigt nicht automatisch ein vollständiges Gerät; frage bei unklarer Zuordnung vor der Bestellung nach.'
};
