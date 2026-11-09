'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import rawProducts from '../../products.json';
type Product={sku:string;ean:string;name:string;shortDescription:string;category:string;line:string;priceCents:number;uvpCents:number;image:string|null};
const products=rawProducts as Product[];
const categories=['Alle',...Array.from(new Set(products.map(p=>p.category)))].sort((a,b)=>a==='Alle'?-1:b==='Alle'?1:a.localeCompare(b,'de'));
const euro=(cents:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(cents/100);
export default function Shop(){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('Alle'),[line,setLine]=useState('Alle'),[sort,setSort]=useState('relevant');
 const shown=useMemo(()=>{
 const q=query.toLocaleLowerCase('de-DE').trim();
 const arr=products.filter(p=>(!q||[p.name,p.sku,p.category].some(x=>x.toLocaleLowerCase('de-DE').includes(q)))&&(category==='Alle'||p.category===category)&&(line==='Alle'||p.line===line));
 if(sort==='low')return arr.sort((a,b)=>a.priceCents-b.priceCents);
 if(sort==='high')return arr.sort((a,b)=>b.priceCents-a.priceCents);
 return arr;
 },[query,category,line,sort]);
 return <main className="wrap"><nav className="nav"><Link className="brand" href="/">◈ SICHERE <span className="accent">NACHT</span></Link><Link className="button" href="/konfigurator">Sicherheitsberater</Link></nav>
 <p className="accent">AJAX ALARMANLAGEN UND SICHERHEITSTECHNIK</p><h1>Deine Sicherheit. <span className="accent">Deine Auswahl.</span></h1>
 <p>Entdecke unseren vollständigen Ajax-Katalog. Alle Preise inklusive 19 % MwSt. Den passenden Systemaufbau findest du über unseren Konfigurator.</p>
 <section className="card" style={{margin:'32px 0',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:16}}>
 <div><label htmlFor="q">Produkte suchen</label><input id="q" placeholder="Name oder Artikelnummer" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 <div><label htmlFor="c">Kategorie</label><select id="c" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
 <div><label htmlFor="l">Produktlinie</label><select id="l" value={line} onChange={e=>setLine(e.target.value)}>{['Alle',...Array.from(new Set(products.map(p=>p.line)))].map(l=><option key={l}>{l}</option>)}</select></div>
 <div><label htmlFor="s">Sortierung</label><select id="s" value={sort} onChange={e=>setSort(e.target.value)}><option value="relevant">Empfohlen</option><option value="low">Preis aufsteigend</option><option value="high">Preis absteigend</option></select></div>
 </section><p>{shown.length} Produkte gefunden</p><section className="grid" style={{margin:'20px 0 80px'}}>
 {shown.map(p=><article className="card" key={p.sku} style={{display:'flex',flexDirection:'column',gap:6}}>
 <div style={{background:'#0A1829',borderRadius:12,height:150,display:'grid',placeItems:'center',color:'#87b7a7',border:'1px dashed #30465a',textAlign:'center',padding:18}}><span>AJAX<br/><small>Produktbild folgt</small></span></div>
 <p className="accent" style={{marginBottom:0,fontSize:12}}>{p.category} · {p.line}</p><h3 style={{margin:'4px 0'}}>{p.name}</h3><p style={{margin:0,fontSize:14}}>{p.shortDescription}</p><p style={{fontSize:12,margin:'auto 0 0'}}>Art.-Nr. {p.sku}</p><div className="price">{euro(p.priceCents)}</div><p style={{fontSize:12,margin:0}}>inkl. 19 % MwSt., zzgl. Versand</p><button type="button" className="button secondary" disabled aria-label={p.name+' bestellen – noch nicht verfügbar'}>Bald bestellbar</button>
 </article>)}</section>{shown.length===0&&<p>Keine passenden Produkte gefunden. Versuche einen anderen Suchbegriff.</p>}
 <footer className="footer">H&K Projekt UG (haftungsbeschränkt) · Lehmkoppel 7 · 25499 Tangstedt<br/><small>Vorschau ohne aktive Bestellfunktion. Produktbilder werden noch ergänzt.</small></footer>
 </main>;
}
