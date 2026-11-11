'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {loadCart,saveCart} from '../../lib/cart';
import {SHOP_GROUPS,getShopGroup,ShopGroup} from '../../lib/shop-groups';
import rawProducts from '../../products.json';
import {catalogDetail} from '../../lib/ajax-catalog-content';
type Product={sku:string;ean:string;name:string;shortDescription:string;category:string;line:string;priceCents:number;uvpCents:number;image:string|null};
const products=rawProducts as Product[];
const productGroups=products.map(p=>({...p,group:getShopGroup(p)}));
const groupCounts=Object.fromEntries(SHOP_GROUPS.map(g=>[g.id,g.id==='alle'?products.length:productGroups.filter(p=>p.group===g.id).length]));
const euro=(cents:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(cents/100);
export default function Shop(){
 const [notice,setNotice]=useState('');
 const addToCart=(sku:string)=>{const old=loadCart();saveCart({items:[...old.items,{sku,quantity:1}],installation:old.installation,installationZip:old.installationZip,source:'shop'});setNotice('Artikel zum Warenkorb hinzugefügt.');};
 const [query,setQuery]=useState(''),[category,setCategory]=useState<ShopGroup>('alle'),[line,setLine]=useState('Alle'),[sort,setSort]=useState('relevant'),[page,setPage]=useState(1);
 const pageSize=24;
 const selectCategory=(id:ShopGroup)=>{setCategory(id);setPage(1)};
 const shown=useMemo(()=>{
 const q=query.toLocaleLowerCase('de-DE').trim();
 const arr=productGroups.filter(p=>(!q||[p.name,p.sku,p.category,p.line].some(x=>x.toLocaleLowerCase('de-DE').includes(q)))&&(category==='alle'||p.group===category)&&(line==='Alle'||p.line===line));
 if(sort==='low')return arr.sort((a,b)=>a.priceCents-b.priceCents);
 if(sort==='high')return arr.sort((a,b)=>b.priceCents-a.priceCents);
 return arr;
 },[query,category,line,sort]);
 const pageCount=Math.ceil(shown.length/pageSize);
 const visible=shown.slice((page-1)*pageSize,page*pageSize);
 return <main className="wrap"><nav className="nav"><Link className="brand" href="/">◈ SICHERE <span className="accent">NACHT</span></Link><div className="row"><Link className="button secondary" href="/warenkorb">Warenkorb</Link><Link className="button" href="/konfigurator">Sicherheitsberater</Link></div></nav>
 <p className="accent">AJAX ALARMANLAGEN UND SICHERHEITSTECHNIK</p><h1>Deine Sicherheit. <span className="accent">Deine Auswahl.</span></h1>
 <p>Finde deine Ajax-Sicherheitstechnik nach Einsatzbereich. Wähle eine Kategorie oder nutze die Suche. Alle Preise inklusive 19 % MwSt.</p>
 <section className="shopCategories" aria-label="Produktkategorien">{SHOP_GROUPS.map(g=><button key={g.id} type="button" className={'shopCategory '+(category===g.id?'isActive':'')} onClick={()=>selectCategory(g.id)} aria-pressed={category===g.id}><span className="shopCategoryIcon">{g.icon}</span><span><strong>{g.label}</strong><small>{g.description}</small></span><span className="shopCount">{groupCounts[g.id]}</span></button>)}</section>
 {notice&&<p role="status" className="accent">{notice} <Link href="/warenkorb">Warenkorb öffnen</Link></p>}
 <section className="card" style={{margin:'32px 0',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:16}}>
 <div><label htmlFor="q">Produkte suchen</label><input id="q" placeholder="z. B. StreetSiren oder Artikelnummer" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></div>
 <div><label htmlFor="c">Produktbereich</label><select id="c" value={category} onChange={e=>selectCategory(e.target.value as ShopGroup)}>{SHOP_GROUPS.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}</select></div>
 <div><label htmlFor="l">Produktlinie</label><select id="l" value={line} onChange={e=>{setLine(e.target.value);setPage(1)}}>{['Alle',...Array.from(new Set(products.map(p=>p.line)))].map(l=><option key={l}>{l}</option>)}</select></div>
 <div><label htmlFor="s">Sortierung</label><select id="s" value={sort} onChange={e=>{setSort(e.target.value);setPage(1)}}><option value="relevant">Empfohlen</option><option value="low">Preis aufsteigend</option><option value="high">Preis absteigend</option></select></div>
 </section><div className="row" style={{alignItems:'center',justifyContent:'space-between'}}><p><strong>{shown.length}</strong> Produkte gefunden · Seite {Math.min(page,pageCount||1)} von {pageCount||1}</p><button type="button" className="button secondary" onClick={()=>{setQuery('');setCategory('alle');setLine('Alle');setSort('relevant');setPage(1)}}>Filter zurücksetzen</button></div><section className="grid" style={{margin:'20px 0 35px'}}>
 {visible.map(p=><article className="card" key={p.sku} style={{display:'flex',flexDirection:'column',gap:6}}>
 <div style={{background:'#F5F7FA',borderRadius:12,height:190,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',padding:12}}>
 {p.image ? <img src={p.image} alt={p.name} loading="lazy" decoding="async" width={240} height={170} style={{width:'100%',height:'100%',objectFit:'contain'}}/> : <span style={{color:'#52677B',textAlign:'center'}}>AJAX<br/><small>Kein Produktbild verfügbar</small></span>}
 </div>
 <p className="accent" style={{marginBottom:0,fontSize:12}}>{p.category} · {p.line}</p><Link href={'/shop/'+encodeURIComponent(p.sku)}><h3 style={{margin:'4px 0'}}>{p.name}</h3></Link><p style={{margin:0,fontSize:14,display:'-webkit-box',WebkitLineClamp:4,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{catalogDetail(p.name)?.summary||p.shortDescription}</p><p style={{fontSize:12,margin:'auto 0 0'}}>Art.-Nr. {p.sku}</p><div className="price">{euro(p.priceCents)}</div><p style={{fontSize:12,margin:0}}>inkl. 19 % MwSt., zzgl. Versand</p><div className="row" style={{marginTop:8}}><button type="button" className="button" onClick={()=>addToCart(p.sku)} aria-label={p.name+' in den Warenkorb'}>In den Warenkorb</button><Link className="button secondary" href={'/shop/'+encodeURIComponent(p.sku)}>Details</Link></div>
 </article>)}</section>{pageCount>1&&<nav className="shopPagination" aria-label="Produktseiten"><button type="button" disabled={page<=1} onClick={()=>{setPage(p=>Math.max(1,p-1));window.scrollTo({top:0,behavior:'smooth'})}}>← Zurück</button><span>Seite {page} / {pageCount}</span><button type="button" disabled={page>=pageCount} onClick={()=>{setPage(p=>Math.min(pageCount,p+1));window.scrollTo({top:0,behavior:'smooth'})}}>Weiter →</button></nav>}{shown.length===0&&<p>Keine passenden Produkte gefunden. Versuche einen anderen Suchbegriff.</p>}
 <footer className="footer">H&K Projekt UG (haftungsbeschränkt) · Lehmkoppel 7 · 25499 Tangstedt<br/><small>Testbetrieb: Zahlungsabwicklung ausschließlich mit Stripe-Testdaten. Es werden keine echten Zahlungen angenommen.</small></footer>
 </main>;
}
