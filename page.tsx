'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Product = {
  sku: string;
  ean: string;
  name: string;
  shortDescription: string;
  category: string;
  line: string;
  priceCents: number;
  uvpCents: number;
  image: string | null;
};

const money = (cents: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Alle');
  const [line, setLine] = useState('Alle');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch('/data/products.json')
      .then(r => { if (!r.ok) throw new Error(`Katalog ${r.status}`); return r.json(); })
      .then((data: Product[]) => setProducts(data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['Alle', ...Array.from(new Set(products.map(p => p.category))).sort((a,b) => a.localeCompare(b,'de'))], [products]);
  const lines = useMemo(() => ['Alle', ...Array.from(new Set(products.map(p => p.line))).sort()], [products]);
  const filtered = useMemo(() => {
    const q = query.toLocaleLowerCase('de').trim();
    const arr = products.filter(p =>
      (!q || [p.sku,p.name,p.category,p.shortDescription].some(x => x.toLocaleLowerCase('de').includes(q))) &&
      (category === 'Alle' || p.category === category) &&
      (line === 'Alle' || p.line === line)
    );
    if (sort === 'low') arr.sort((a,b) => a.priceCents-b.priceCents);
    else if (sort === 'high') arr.sort((a,b) => b.priceCents-a.priceCents);
    else arr.sort((a,b) => a.name.localeCompare(b.name,'de'));
    return arr;
  }, [products,query,category,line,sort]);
  const perPage = 24;
  const pages = Math.max(1,Math.ceil(filtered.length/perPage));
  const items = filtered.slice((page-1)*perPage,page*perPage);
  useEffect(() => setPage(1), [query,category,line,sort]);

  return <main className="wrap">
    <nav className="nav"><Link href="/" className="brand">◈ SICHERE <span className="accent">NACHT</span></Link><Link href="/konfigurator" className="button">Sicherheitsberater</Link></nav>
    <p className="accent">AJAX SICHERHEITSTECHNIK</p>
    <h1>Finde die Sicherheit, <span className="accent">die zu dir passt.</span></h1>
    <p>Ajax-Komponenten für Wohnung, Haus und Gewerbe. Alle Verkaufspreise inklusive 19 % MwSt.</p>
    <section className="card" style={{margin:'28px 0',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:16}}>
      <div><label htmlFor="search">Suche</label><input id="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Produkt oder Artikelnummer" /></div>
      <div><label htmlFor="category">Kategorie</label><select id="category" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      <div><label htmlFor="line">Produktlinie</label><select id="line" value={line} onChange={e=>setLine(e.target.value)}>{lines.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
      <div><label htmlFor="sort">Sortieren</label><select id="sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Name A–Z</option><option value="low">Preis aufsteigend</option><option value="high">Preis absteigend</option></select></div>
    </section>
    {loading&&<p>Katalog wird geladen …</p>}
    {failed&&<p>Der Produktkatalog konnte nicht geladen werden. Bitte versuche es erneut.</p>}
    {!loading&&!failed&&<><p>{filtered.length} Produkte gefunden · Seite {page} von {pages}</p>
      <section className="grid" style={{margin:'24px 0 40px'}}>
        {items.map(p=><article key={p.sku} className="card" style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{height:195,background:'#fff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
            {p.image?<img src={p.image} alt={p.name} loading="lazy" width="280" height="190" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{color:'#5d6670',textAlign:'center'}}>Produktbild<br/>noch nicht verfügbar</span>}
          </div>
          <small className="accent">{p.category} · {p.line}</small>
          <h3 style={{margin:'2px 0'}}>{p.name}</h3>
          <p style={{fontSize:13,margin:0}}>{p.shortDescription}</p>
          <small style={{marginTop:'auto'}}>Art.-Nr. {p.sku}</small>
          <strong className="price">{money(p.priceCents)}</strong>
          <small>inkl. 19 % MwSt., zzgl. Versand</small>
          <button type="button" disabled className="button secondary">Bald bestellbar</button>
        </article>)}
      </section>
      <div className="row" style={{justifyContent:'center',marginBottom:60}}>
        <button className="button secondary" disabled={page===1} onClick={()=>{setPage(p=>p-1);window.scrollTo({top:0,behavior:'smooth'})}}>← Zurück</button>
        <span style={{alignSelf:'center'}}>{page} / {pages}</span>
        <button className="button secondary" disabled={page===pages} onClick={()=>{setPage(p=>p+1);window.scrollTo({top:0,behavior:'smooth'})}}>Weiter →</button>
      </div>
    </>}
    <footer className="footer">H&amp;K Projekt UG (haftungsbeschränkt) · Lehmkoppel 7 · 25499 Tangstedt<br/><small>Produktkatalog-Vorschau. Noch keine Bestellfunktion aktiv; technische Kompatibilität vor Bestellung prüfen.</small></footer>
  </main>;
}
