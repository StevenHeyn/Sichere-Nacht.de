'use client';
import {useState} from 'react';
import Link from 'next/link';
const money=(value:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);
export default function Wertvergleich(){
 const [immobilie,setImmobilie]=useState(650000);
 const [anlage,setAnlage]=useState(1500);
 const anteil=anlage/immobilie*100;
 return <section className="section band" aria-labelledby="wertvergleich-title"><div className="wrap">
 <div className="sectionTop"><p className="eyebrow">SCHUTZ IST EINE BEWUSSTE ENTSCHEIDUNG</p><h2 id="wertvergleich-title">Dein Zuhause ist viel wert. Dein Sicherheitsgefühl auch.</h2><p>Eine Alarmanlage schützt nicht vor jedem Einbruch. Sie kann aber helfen, unbefugte Zugänge zu erkennen und frühzeitig Alarm auszulösen. Und sie lässt sich passend zum Zuhause planen.</p></div>
 <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,290px),1fr))',gap:24}}>
 <div className="card"><h3>Was ist dir dein Zuhause wert?</h3><p>Vergleiche beispielhaft den Immobilienwert mit einem frei gewählten Budget für Sicherheitstechnik.</p>
 <label htmlFor="immobilienwert"><strong>Immobilienwert: {money(immobilie)}</strong></label><input id="immobilienwert" type="range" min="200000" max="1500000" step="50000" value={immobilie} onChange={e=>setImmobilie(Number(e.target.value))} style={{width:'100%',margin:'16px 0 24px'}}/>
 <label htmlFor="alarmbudget"><strong>Budget für Alarmtechnik: {money(anlage)}</strong></label><input id="alarmbudget" type="range" min="500" max="5000" step="100" value={anlage} onChange={e=>setAnlage(Number(e.target.value))} style={{width:'100%',margin:'16px 0 24px'}}/>
 <p className="eyebrow">ANTEIL AM IMMOBILIENWERT</p><div style={{fontSize:'clamp(36px,5vw,56px)',fontWeight:800}}>{anteil.toLocaleString('de-DE',{maximumFractionDigits:2})} %</div>
 <div role="img" aria-label={'Anteil am Immobilienwert: '+anteil.toLocaleString('de-DE',{maximumFractionDigits:2})+' Prozent'} style={{height:12,borderRadius:99,background:'rgba(120,120,120,.22)',overflow:'hidden',margin:'14px 0'}}><div style={{height:'100%',width:Math.max(anteil,0.8)+'%',background:'#25b99a',borderRadius:99}}/></div>
 <p className="note">Rechenbeispiel, keine Preiszusage. Der tatsächliche Systempreis hängt von den gewählten Komponenten ab. Immobilienwert und Sicherheitsbudget sind unabhängig voneinander.</p></div>
 <div className="card"><p className="eyebrow">NICHT NUR EINE FRAGE DES GELDES</p><h3>Wertsachen kann man ersetzen. Das Gefühl, zu Hause sicher zu sein, nicht so einfach.</h3><p>Ein Einbruch kann die Privatsphäre und das Sicherheitsgefühl stark beeinträchtigen. Mit einem durchdachten System kannst du wichtige Zugänge und Bereiche überwachen.</p><p>Finde heraus, welche Ausstattung zu deiner Wohnung oder deinem Haus passt. Ohne Druck, mit nachvollziehbaren Empfehlungen.</p><Link href="/sicherheitscheck" className="button">Kostenlosen Sicherheitscheck starten →</Link><p className="note">Dauert nur wenige Minuten. Die Empfehlung ist unverbindlich.</p></div>
 </div></div></section>;
