export type Product={sku:string;name:string;uvp:number;category:string;line:'Baseline'|'Superior'|'Fibra'|'Zubehör';description:string};
export const products:Product[]=[
{sku:'38245.40.WH1',name:'Ajax Hub 2 Plus White',uvp:699.92,category:'Zentralen',line:'Baseline',description:'Alarmzentrale zur Steuerung eines kompatiblen Ajax-Funksystems.'},
{sku:'38241.108.WH1',name:'Ajax Hub 2 4G White',uvp:591.60,category:'Zentralen',line:'Baseline',description:'Ajax-Funkzentrale mit Mobilfunkanbindung.'},
{sku:'38198.02.WH1',name:'Ajax MotionProtect Plus White',uvp:151.92,category:'Bewegungsmelder',line:'Baseline',description:'Dual-Technologie-Bewegungsmelder mit PIR- und Mikrowellensensor.'},
{sku:'38199.02.BL1',name:'Ajax MotionProtect Plus Black',uvp:151.92,category:'Bewegungsmelder',line:'Baseline',description:'Dual-Technologie-Bewegungsmelder in Schwarz.'},
{sku:'38195.36.WH1',name:'Ajax MotionProtect Curtain White',uvp:127.91,category:'Bewegungsmelder',line:'Baseline',description:'Vorhang-Bewegungsmelder für gezielte Bereichssicherung.'},
{sku:'38196.36.BL1',name:'Ajax MotionProtect Curtain Black',uvp:127.91,category:'Bewegungsmelder',line:'Baseline',description:'Vorhang-Bewegungsmelder in Schwarz.'},
{sku:'38197.33.WH1',name:'Ajax MotionProtect Outdoor White',uvp:379.75,category:'Außensicherung',line:'Baseline',description:'Bewegungsmelder für geschützte Außenbereiche.'},
{sku:'38192.84.WH1',name:'Ajax MotionCam Outdoor White',uvp:439.72,category:'Außensicherung',line:'Baseline',description:'Außenbewegungsmelder mit integrierter Fotofunktion.'},
{sku:'39293.121.WH1',name:'Ajax MotionCam Outdoor PhOD White',uvp:483.88,category:'Außensicherung',line:'Baseline',description:'Außenbewegungsmelder mit unterstützter Fotoverifizierung.'},
{sku:'38101.13.WH1',name:'Ajax DoorProtect Plus White',uvp:95.94,category:'Öffnungsmelder',line:'Baseline',description:'Öffnungsmelder mit zusätzlichem Erschütterungs-/Neigungssensor.'},
{sku:'38111.11.WH1',name:'Ajax HomeSiren White',uvp:107.93,category:'Sirenen',line:'Baseline',description:'Kabellose Innensirene.'},
{sku:'38180.61.WH1',name:'Ajax StreetSiren DoubleDeck White',uvp:215.47,category:'Sirenen',line:'Baseline',description:'Außensirene mit wechselbarer Frontplatte.'},
{sku:'38178.07.WH1',name:'Ajax StreetSiren White',uvp:215.87,category:'Sirenen',line:'Baseline',description:'Außensirene für akustische und optische Alarmierung.'},
{sku:'38249.12.WH1',name:'Ajax KeyPad White',uvp:171.90,category:'Bedienteile',line:'Baseline',description:'Kabelloses Tastenfeld zur Bedienung der Alarmanlage.'},
{sku:'38253.83.WH1',name:'Ajax KeyPad Plus White',uvp:215.87,category:'Bedienteile',line:'Baseline',description:'Tastenfeld mit zusätzlicher kontaktloser Bedienmöglichkeit.'},
{sku:'38255.08.WH1',name:'Ajax LeaksProtect White',uvp:87.95,category:'Wasserschutz',line:'Baseline',description:'Kabelloser Wassermelder.'},
{sku:'52254.149.WH1',name:'Ajax FireProtect 2 SB (Heat/Smoke) White',uvp:169.75,category:'Brandschutz',line:'Baseline',description:'Brandmelder mit Hitze- und Rauchdetektion.'},
{sku:'38105.10.WH1',name:'Ajax FireProtect White',uvp:131.90,category:'Brandschutz',line:'Baseline',description:'Kabelloser Brandmelder.'},
{sku:'38109.05.WH1',name:'Ajax GlassProtect White',uvp:107.93,category:'Glasbruchmelder',line:'Baseline',description:'Kabelloser Glasbruchmelder.'},
{sku:'38097.06.WH1',name:'Ajax CombiProtect White',uvp:151.92,category:'Bewegungsmelder',line:'Baseline',description:'Kombinierter Bewegungs- und Glasbruchmelder.'},
{sku:'38103.79.WH1',name:'Ajax DoubleButton White',uvp:51.96,category:'Bedienteile',line:'Baseline',description:'Drahtloser Notfallknopf.'},
{sku:'70938.122.BL',name:'Ajax 8-Kanal NVR Black',uvp:426.66,category:'Videoüberwachung',line:'Baseline',description:'Netzwerk-Videorekorder für kompatible Kameras.'},
{sku:'44390.06.BL1',name:'Ajax Fibra CombiProtect Black',uvp:141.88,category:'Verdrahtete Systeme',line:'Fibra',description:'Kombinierter Melder für kompatible Fibra-Installationen.'},
{sku:'44393.03.WH1',name:'Ajax Fibra DoorProtect White',uvp:59.74,category:'Verdrahtete Systeme',line:'Fibra',description:'Verdrahteter Tür-/Fensterkontakt für kompatible Fibra-Systeme.'},
{sku:'44509.111.WH1',name:'Ajax Fibra Hub Hybrid 2G White Grad 3',uvp:688.61,category:'Verdrahtete Systeme',line:'Fibra',description:'Zentrale für ein kompatibles Fibra-System.'},
{sku:'116768.306.WH1',name:'Ajax Superior MotionCam AM (PhOD) White',uvp:320.40,category:'Bewegungsmelder',line:'Superior',description:'Superior-Bewegungsmelder mit Fotoverifizierung; Produktlinien-Kompatibilität prüfen.'}
];
export function shopPrice(uvp:number){return Math.max(.9,Math.round((uvp+.1)/10)*10-.1);}
export function euro(n:number){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);}
export const categories=['Alle',...Array.from(new Set(products.map(p=>p.category)))].sort((a,b)=>a==='Alle'?-1:b==='Alle'?1:a.localeCompare(b,'de'));
