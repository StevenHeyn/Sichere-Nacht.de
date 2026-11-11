'use client';
import {useState} from 'react';
import Link from 'next/link';
export default function Sicherheitscheck(){
 const [kind,setKind]=useState('wohnung');
 const [area,setArea]=useState('mittel');
 const [access,setAccess]=useState('2');
 const [pets,setPets]=useState('nein');
 const [priority,setPriority]=useState('komfort');
 const [done,setDone]=useState(false);
 const params=new URLSearchParams({objekt:kind,paket:priority==='basis'?'safe':priority==='premium'?'safer-plus':'safer'});
 return <main className="wrap section"><p className="eyebrow">KOSTENLOSER SICHERHEITSCHECK</p><h1>Welche Alarmanlage passt zu dir?</h1><p>Fünf kurze Fragen, danach geht es direkt zum individuell anpassbaren Ajax-Konfigurator.</p><section className="card" style={{maxWidth:680,display:'grid',gap:20}}>
 <label>1. Was möchtest du absichern?<select value={kind} onChange={e=>setKind(e.target.value)}><option value="wohnung">Wohnung</option><option value="haus">Haus</option><option value="gewerbe">Gewerbe</option></select></label>
 <label>2. Wie groß ist das Objekt ungefähr?<select value={area} onChange={e=>setArea(e.target.value)}><option value="klein">Bis 60 m²</option><option value="mittel">61 bis 140 m²</option><option value="gross">Über 140 m²</option></select></label>
 <label>3. Wie viele Außentüren und leicht zugängliche Fenster gibt es ungefähr?<select value={access} onChange={e=>setAccess(e.target.value)}><option value="1">1</option><option value="2">2 bis 4</option><option value="5">5 oder mehr</option></select></label>
 <label>4. Leben Haustiere im Objekt?<select value={pets} onChange={e=>setPets(e.target.value)}><option value="nein">Nein</option><option value="ja">Ja</option></select></label>
 <label>5. Welcher Schutz ist dir wichtig?<select value={priority} onChange={e=>setPriority(e.target.value)}><option value="basis">Solider Basisschutz</option><option value="komfort">Komfort und Fotoverifizierung</option><option value="premium">Umfassender Schutz</option></select></label>
 {!done?<button className="button" type="button" onClick={()=>setDone(true)}>Empfehlung anzeigen</button>:<div><h2>Deine erste Empfehlung</h2><p>Für {kind==='wohnung'?'deine Wohnung':kind==='haus'?'dein Haus':'dein Gewerbeobjekt'} empfehlen wir als Ausgangspunkt das {priority==='basis'?'SAFE':priority==='premium'?'SAFER PLUS':'SAFER'}-Paket. {area==='gross'||access==='5'?'Bei größeren Objekten und vielen Zugängen solltest du zusätzliche Melder einplanen.':''} {pets==='ja'?'Die Eignung der Bewegungsmelder für Haustiere muss anhand der konkreten Bedingungen geprüft werden.':''}</p><p className="note">Unverbindliche Ersteinschätzung, keine Sicherheitsplanung. Im Konfigurator kannst du Räume, Zugänge und Komponenten genau anpassen.</p><Link className="button" href={'/konfigurator?'+params.toString()}>Empfehlung konfigurieren →</Link></div>}
 </section></main>;
}