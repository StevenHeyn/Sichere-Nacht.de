'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {saveCart} from '../../lib/cart';
import rawProducts from '../../products.json';
import RoomPlanner,{initialRooms,PlannedRoom} from './room-planner';
type CatalogProduct={sku:string;name:string;priceCents:number;image:string|null};
const catalog=rawProducts as CatalogProduct[];
const bySku=new Map(catalog.map(p=>[p.sku,p]));
const amount=(n:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n/100);

type Kind='Wohnung'|'Haus'|'Gewerbe';
type Step=0|1|2|3;
const euro=(n:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n);
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,Number.isFinite(v)?v:min));
export default function Konfigurator(){
 const router=useRouter();
 const [step,setStep]=useState<Step>(0);
 const [protection,setProtection]=useState<'Basis'|'Komfort'|'Premium'>('Komfort');
 const [kind,setKind]=useState<Kind>('Wohnung');
 const [rooms,setRooms]=useState(3);
 const [planningMode,setPlanningMode]=useState<'visual'|'simple'>('visual');
 const [plannedRooms,setPlannedRooms]=useState<PlannedRoom[]>(initialRooms);
 const [entrances,setEntrances]=useState(1);
 const [terrace,setTerrace]=useState(0);
 const [windows,setWindows]=useState(2);
 const [levels,setLevels]=useState(1);
 const [pets,setPets]=useState(false);
 const [photo,setPhoto]=useState(true);
 const [fire,setFire]=useState(false);
 const [water,setWater]=useState(false);
 const [outside,setOutside]=useState(false);
 const [keypad,setKeypad]=useState(true);
 const [sirenType,setSirenType]=useState<'innen'|'aussen'>('aussen');
 const [mount,setMount]=useState(false);
 const [zip,setZip]=useState('');
 const [color,setColor]=useState<'Weiß'|'Schwarz'>('Weiß');
 const [email,setEmail]=useState('');
 const [sent,setSent]=useState(false);
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const obj=params.get('objekt');
  if(obj==='wohnung')setKind('Wohnung');
  else if(obj==='haus')setKind('Haus');
  else if(obj==='gewerbe')setKind('Gewerbe');
  const preset=params.get('paket');
  if(preset==='safe'){setKind('Wohnung');setRooms(2);setLevels(1);setEntrances(1);setTerrace(0);setWindows(0);setProtection('Basis');setKeypad(false);setPhoto(true);}
  if(preset==='safer'){setKind('Haus');setRooms(3);setLevels(1);setEntrances(1);setTerrace(1);setWindows(1);setProtection('Komfort');setKeypad(true);setPhoto(true);}
  if(preset==='safer-plus'){setKind('Haus');setRooms(4);setLevels(1);setEntrances(1);setTerrace(2);setWindows(3);setProtection('Premium');setKeypad(true);setPhoto(true);}
 },[]);
 const roomCount=planningMode==='visual'?plannedRooms.length:rooms;
 const entryDoors=planningMode==='visual'?plannedRooms.reduce((sum,r)=>sum+r.entrances,0):entrances;
 const terraceDoors=planningMode==='visual'?plannedRooms.reduce((sum,r)=>sum+r.terraces,0):terrace;
 const windowCount=planningMode==='visual'?plannedRooms.reduce((sum,r)=>sum+r.windows,0):windows;
 const entryCount=entryDoors+terraceDoors+windowCount;
 const motionRooms=plannedRooms.filter(r=>r.motion).length;
 const bundle=useMemo(()=>{
   // Conservative baseline wireless recommendation. Final planning must verify radio range,
   // installation conditions, compatibility and quantities with the customer.
   const black=color==='Schwarz';
   const detectors=planningMode==='visual'?clamp(protection==='Basis'?Math.ceil(motionRooms*0.65):protection==='Premium'?motionRooms:Math.ceil(motionRooms*0.85),0,30):clamp(protection==='Basis'?Math.ceil(rooms*0.4):protection==='Premium'?rooms+Math.max(0,levels-1):Math.ceil(rooms*0.65)+Math.max(0,levels-1),1,30);
   const lines:{sku:string;quantity:number;reason:string}[]=[
    {sku:photo?(black?'38244.40.BL1':'38245.40.WH1'):(black?'38238.40.BL1':'38239.40.WH1'),quantity:1,reason:photo?'Zentrale für Fotoverifizierung':'Ajax-Funkzentrale'},
    {sku:photo?(black?'119281.310.BL1':'119282.310.WH1'):(black?'38194.09.BL1':'38193.09.WH1'),quantity:detectors,reason:'Bewegungserkennung in wichtigen Laufwegen'},
    {sku:black?'38098.03.BL1':'38099.03.WH1',quantity:entryCount,reason:'Öffnungskontakte für ausgewählte Zugänge'},
    {sku:sirenType==='aussen'?(black?'38179.07.BL1':'38178.07.WH1'):(black?'38110.11.BL1':'38111.11.WH1'),quantity:1,reason:sirenType==='aussen'?'StreetSiren für den Außenbereich; Montageort prüfen':'HomeSiren für den Innenbereich'},
    ...((keypad||protection==='Premium')?[{sku:black?'38248.12.BL1':'38249.12.WH1',quantity:1,reason:'Bedienung per Tastatur'}]:[]),

    ...(fire?[{sku:black?'52251.136.BL1':'52250.136.WH1',quantity:levels,reason:'Zusätzliche Brandwarnung; Rauchwarnmelderpflicht separat prüfen'}]:[]),
    ...(water?[{sku:black?'38254.08.BL1':'38255.08.WH1',quantity:1,reason:'Zusätzlicher Wasserschutz'}]:[]),
    ...(outside?[{sku:'38197.33.WH1',quantity:1,reason:'Außenmelder; Eignung am Objekt prüfen'}]:[])
   ];
   return lines.filter(l=>l.quantity>0).map(l=>({...l,product:bySku.get(l.sku)}));
 },[rooms,levels,photo,entryCount,keypad,sirenType,fire,water,outside,color,protection,planningMode,motionRooms]);
 const hardwareCents=bundle.reduce((sum,l)=>sum+(l.product?.priceCents??0)*l.quantity,0);
 const allPriced=bundle.every(l=>!!l.product);
 const installationCents=mount?19900:0;
 const totalCents=hardwareCents+installationCents;
 const vatCents=Math.round(totalCents*19/119);
 const recommend=bundle.map(l=>({name:l.product?.name??'Artikelzuordnung ausstehend',quantity:l.quantity,detail:l.reason,sku:l.sku,image:l.product?.image,unitPrice:l.product?.priceCents??0}));
 const number=(name:string,value:number,set:(n:number)=>void,min=0,max=30)=><div className="countLine"><label htmlFor={name}>{name}</label><div className="counter"><button type="button" aria-label={name+' reduzieren'} onClick={()=>set(clamp(value-1,min,max))}>−</button><input id={name} aria-label={name} type="number" min={min} max={max} value={value} onChange={e=>set(clamp(Number(e.target.value),min,max))}/><button type="button" aria-label={name+' erhöhen'} onClick={()=>set(clamp(value+1,min,max))}>+</button></div></div>;
 const toggle=(name:string,explain:string,value:boolean,set:(v:boolean)=>void)=><label className="choice"><input type="checkbox" checked={value} onChange={e=>set(e.target.checked)}/><span><strong>{name}</strong><small>{explain}</small></span></label>;
 return <main className="wrap configPage">
 <div className="nav"><Link className="brand" href="/">◈ SICHERE <span className="accent">NACHT</span></Link><Link href="/warenkorb">Warenkorb ansehen</Link></div>
 <p className="accent">INDIVIDUELLE AJAX-SICHERHEIT</p><h1>In wenigen Schritten zur passenden Alarmanlage.</h1>
 <p>Du beschreibst dein Zuhause. Wir stellen eine sinnvolle erste Sicherheitsausstattung zusammen. Ohne Rätselraten bei Hubs und Meldern.</p>
 <div className="progress" aria-label={'Schritt '+(step+1)+' von 4'}>{['Objekt','Raumtour','Schutz & Service','Ergebnis'].map((s,i)=><div key={s} className={i<=step?'active':''}><b>{i+1}</b><span>{s}</span></div>)}</div>
 <div className="grid configGrid"><section className="card configForm">
 {step===0&&<><h2>Was möchtest du schützen?</h2><div className="kindGrid">{(['Wohnung','Haus','Gewerbe'] as Kind[]).map(k=><button key={k} className={'kind '+(kind===k?'selected':'')} onClick={()=>setKind(k)}>{k==='Wohnung'?'▦':k==='Haus'?'⌂':'▤'}<strong>{k}</strong></button>)}</div>{planningMode==='visual'?<p className="note">Deine Räume legst du im nächsten Schritt direkt im virtuellen Rundgang an. Du kannst jederzeit Räume hinzufügen oder entfernen.</p>:number('Zu sichernde Räume',rooms,setRooms,1)}{number('Etagen',levels,n=>{setLevels(n);setPlannedRooms(old=>old.map(r=>({...r,floor:Math.min(r.floor,n-1)})))},1,8)}<h3>Schutzstufe</h3><div className="kindGrid">{(['Basis','Komfort','Premium'] as const).map(level=><button type="button" key={level} className={'kind '+(protection===level?'selected':'')} onClick={()=>setProtection(level)} style={{fontSize:17,padding:'16px 8px'}}><strong>{level}</strong><small>{level==='Basis'?'Wichtige Laufwege':level==='Komfort'?'Mehr Bewegungsmelder':'Alle Räume + erweiterter Schutz'}</small></button>)}</div><p className="note">Ein Raum braucht nicht automatisch einen eigenen Bewegungsmelder. Wir berücksichtigen die wichtigen Laufwege.</p></>}
 {step===1&&<><h2>Dein Zuhause Raum für Raum</h2><p>Im visuellen Rundgang planst du jeden Raum einzeln. Alternativ kannst du die Anzahl der Zugänge wie bisher direkt eingeben.</p><div className="row" style={{marginBottom:18}}><button type="button" className={'button '+(planningMode==='visual'?'':'secondary')} onClick={()=>setPlanningMode('visual')} aria-pressed={planningMode==='visual'}>⌂ Virtueller Rundgang</button><button type="button" className={'button '+(planningMode==='simple'?'':'secondary')} onClick={()=>setPlanningMode('simple')} aria-pressed={planningMode==='simple'}>Schnelleingabe</button></div>{planningMode==='visual'?<RoomPlanner rooms={plannedRooms} onChange={setPlannedRooms} floors={levels}/>:<>{number('Eingangstüren',entrances,setEntrances)}{number('Terrassen- und Balkontüren',terrace,setTerrace)}{number('Erreichbare Fenster',windows,setWindows)}</>}<div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:20}}><span className="card" style={{padding:12}}>🚪 {entryDoors} Eingänge</span><span className="card" style={{padding:12}}>🌿 {terraceDoors} Terrassentüren</span><span className="card" style={{padding:12}}>🪟 {windowCount} Fenster</span></div><p className="note">Es werden nur die hier ausgewählten Zugänge mit Öffnungskontakten berücksichtigt. Die Planung ist unverbindlich.</p></>}
 {step===2&&<><h2>Was ist dir wichtig?</h2>
 {toggle('Fotoverifizierung','Bei Alarm Bilder durch geeignete MotionCam-Melder erhalten',photo,setPhoto)}
 {toggle('Haustiere im Haushalt','Wir berücksichtigen geeignete Bewegungsmelder',pets,setPets)}
 {toggle('Brandwarnung','Brandmelder als zusätzliche Empfehlung',fire,setFire)}
 {toggle('Wasserschutz','Wassermelder etwa für Küche oder Waschküche',water,setWater)}
 {toggle('Außenbereich sichern','Außenmelder nach Prüfung der Gegebenheiten',outside,setOutside)}
 {toggle('Bedienteil','Alarmanlage zusätzlich per Code bedienen',keypad,setKeypad)}
 <h3>Welche Sirene möchtest du?</h3><div className="kindGrid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>{([['innen','HomeSiren (innen)'],['aussen','StreetSiren (außen)']] as const).map(([value,label])=><button key={value} type="button" aria-pressed={sirenType===value} className={'kind '+(sirenType===value?'selected':'')} onClick={()=>setSirenType(value)} style={{fontSize:16,padding:'14px 8px'}}><strong>{label}</strong></button>)}</div><p className="note">Die StreetSiren ist standardmäßig ausgewählt: sichtbare Abschreckung im Außenbereich. Auf Wunsch kannst du stattdessen die HomeSiren für innen wählen. Es wird immer nur eine Sirene berechnet.</p>
 <h3>Gerätefarbe</h3><div className="row">{(['Weiß','Schwarz'] as const).map(c=><button key={c} className={'button '+(color===c?'':'secondary')} onClick={()=>setColor(c)}>{c}</button>)}</div>
 <h3>Installation</h3>{toggle('Professionelle Montage (+199 € brutto)','Optional, zunächst nur in Hamburg und Umgebung',mount,setMount)}
 {mount&&<><label htmlFor="zip">Postleitzahl des Montageorts</label><input id="zip" inputMode="numeric" placeholder="z. B. 20095" maxLength={5} value={zip} onChange={e=>setZip(e.target.value.replace(/\D/g,''))}/><p className="note">Die Verfügbarkeit für deine PLZ bestätigen wir vor einer verbindlichen Buchung. Eine automatische PLZ-Freigabe ist noch nicht aktiv.</p></>}
 </>}
 {step===3&&<><h2>Dein persönlicher Sicherheitsplan</h2><p>Konkrete Ajax-Artikel aus unserer Preisliste, inklusive Bruttopreisen. Die endgültige Eignung und Mengenplanung prüfen wir vor der Bestellung.</p><div className="recommendations">{recommend.map((x,i)=><div className="rec recProduct" key={x.sku}><div className="recImage">{x.image?<img src={x.image} alt={x.name} loading="lazy" width="72" height="72"/>:'AJAX'}</div><div><strong>{x.quantity} × {x.name}</strong><small>{x.detail} · Art. {x.sku}</small><small>{amount(x.unitPrice)} pro Stück</small></div><strong className="recAmount">{amount(x.unitPrice*x.quantity)}</strong></div>)}</div>
 <div className="card cost">
 <p>Gerätefarbe: {color}</p>
 <div className="costRow"><span>Komponenten inkl. 19 % MwSt.</span><strong>{amount(hardwareCents)}</strong></div>
 <div className="costRow"><span>{mount?'Optionale Montage Hamburg & Umgebung (PLZ-Prüfung ausstehend)':'Selbstmontage'}</span><strong>{amount(installationCents)}</strong></div>
 <div className="costRow costTotal"><span>Gesamt brutto</span><strong>{allPriced?amount(totalCents):'Preisprüfung erforderlich'}</strong></div>
 <p className="note">Darin enthaltene 19 % MwSt.: {amount(vatCents)}. Unverbindliche Beispielkalkulation vor Versandkosten. Montagepauschale vorbehaltlich Einsatzgebiet und Leistungsumfang.</p>
 {pets&&<p className="note alert">Haustiere: Bitte Größe und Gewicht sowie die gewählten Melder vor Bestellung individuell prüfen. Keine generelle Haustier-Freigabe.</p>}
 {kind==='Gewerbe'&&<p className="note alert">Gewerbliche Objekte benötigen ggf. eine gesonderte Risiko- und Versicherungsprüfung.</p>}
 </div>
 <label htmlFor="email">Optional: E-Mail für die spätere Beratung</label><input id="email" type="email" placeholder="deine@email.de" value={email} onChange={e=>setEmail(e.target.value)}/><p className="note">Noch kein E-Mail-Versand eingerichtet. Deine Eingaben werden nicht an einen Server übermittelt.</p>
 <button type="button" className="button secondary" onClick={()=>{const summary='SICHERE NACHT – Unverbindliche Planung\nObjekt: '+kind+'\nRäume: '+roomCount+'; Etagen: '+levels+'; Zugänge: '+entryCount+'\nFarbe: '+color+'\n'+recommend.map(x=>x.quantity+' x '+x.name+' ('+x.sku+'): '+amount(x.unitPrice*x.quantity)).join('\n')+'\nBruttopreis: '+amount(totalCents)+'\nMontage: '+(mount?'199 € brutto, PLZ '+zip+' (vorbehaltlich Prüfung)':'Selbstmontage');navigator.clipboard?.writeText(summary).then(()=>setSent(true)).catch(()=>setSent(false));}}>{sent?'Zusammenstellung kopiert':'Zusammenstellung kopieren'}</button>
 <button type="button" className="button" disabled={!allPriced} onClick={()=>{saveCart({items:bundle.map(l=>({sku:l.sku,quantity:l.quantity})),installation:mount,installationZip:zip,source:'konfigurator'});router.push('/warenkorb')}}>Paket in den Warenkorb →</button>
 {planningMode==='visual'&&<p className="note">Die Raumtour wurde in die Geräteauswahl übernommen: {roomCount} Räume, {entryCount} gesicherte Zugänge und {motionRooms} zur Bewegungserkennung ausgewählte Räume. Anzahl und Position der Melder sind eine erste Empfehlung und müssen am Objekt geprüft werden.</p>}
 <p className="note">Die berechneten Preise stammen aus dem importierten Produktkatalog. Checkout und verbindliche technische Freigabe werden separat eingerichtet.</p></>}
 <div className="row wizardNav">{step>0&&<button type="button" className="button secondary" onClick={()=>setStep(s=>(s-1) as Step)}>Zurück</button>}{step<3&&<button type="button" className="button" onClick={()=>setStep(s=>(s+1) as Step)}>Weiter →</button>}</div>
 </section><aside className="card overview"><div className="accent">DEIN SICHERHEITSPLAN</div><h2>{kind} · {roomCount} Räume</h2><p>Schutzstufe: {protection}</p><p>{levels} {levels===1?'Etage':'Etagen'} · {entryCount} Zugänge</p><hr/><h3>Aktuell empfohlen</h3>{recommend.filter(x=>x.quantity>0).map((x,i)=><p key={i}>{x.quantity} × {x.name}</p>)}<hr/><p>Geräte: <strong>{amount(hardwareCents)}</strong></p><p>Montage: {mount?euro(199)+' brutto (auf Anfrage)':'Selbstmontage'}</p><h3 className="accent">{amount(totalCents)} brutto</h3><p className="note">Inklusive 19 % MwSt.; zzgl. Versand. Unverbindliche Planungshilfe, keine sicherheitstechnische Abnahme.</p></aside></div>
 <style jsx>{`
 .configPage{padding-bottom:80px}.configPage h1{font-size:clamp(32px,5vw,58px);margin:20px 0}.progress{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:38px 0 22px}.progress>div{display:flex;align-items:center;gap:9px;color:#9eacbc;font-size:13px}.progress b{display:grid;place-items:center;width:30px;height:30px;border:1px solid #50657a;border-radius:50%}.progress .active{color:#86e8b5}.progress .active b{background:#155d53;border-color:#86e8b5}.configGrid{grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr)}.configForm h2{margin-top:0}.kindGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.kind{background:#182b43;border:1px solid #344962;color:white;border-radius:12px;padding:26px 10px;display:flex;flex-direction:column;gap:12px;align-items:center;font-size:28px;cursor:pointer}.kind strong{font-size:15px}.kind.selected{background:#13483e;border-color:#75e4b0}.countLine{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid #294158;padding:15px 0}.countLine label{margin:0}.counter{display:flex;align-items:center;gap:6px}.counter input{width:62px;text-align:center}.counter button{border:1px solid #3b5570;color:white;background:#172b43;border-radius:8px;padding:10px 13px;cursor:pointer}.choice{display:flex;gap:12px;align-items:start;border:1px solid #304964;border-radius:10px;padding:13px;cursor:pointer;font-weight:normal}.choice input{margin-top:4px;flex-shrink:0}.choice strong{display:block}.choice small,.rec small{display:block;color:#bdcddd;margin-top:4px;line-height:1.5}.wizardNav{margin-top:30px;justify-content:flex-end}.overview{align-self:start;position:sticky;top:20px}.overview p{margin:8px 0}.recommendations{margin:22px 0}.rec{padding:12px 0;border-bottom:1px solid #304964}.cost{background:#09182a}.recProduct{display:grid;grid-template-columns:76px 1fr auto;gap:12px;align-items:center}.recImage{width:72px;height:72px;background:#f4f6f9;border-radius:10px;color:#324b5b;display:grid;place-items:center;font-size:12px}.recImage img{width:100%;height:100%;object-fit:contain}.recAmount{white-space:nowrap;color:#88e4b8}.costRow{display:flex;gap:16px;align-items:center;justify-content:space-between;margin:14px 0}.costTotal{border-top:1px solid #486076;padding-top:15px;font-size:22px;color:#88e4b8}.note{font-size:13px}.alert{color:#ffc68c}@media(max-width:560px){.recProduct{grid-template-columns:55px 1fr}.recImage{width:52px;height:52px}.recAmount{grid-column:2}}.configForm .button{margin-top:4px}@media(max-width:760px){.configGrid{grid-template-columns:1fr}.overview{position:static}.progress span{display:none}.progress>div{justify-content:center}.kind{padding:18px 5px}}
 `}</style>
 </main>;
}
