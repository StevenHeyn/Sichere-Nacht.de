import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import products from '../../../products.json';
import AddToCart from './add-to-cart';
export const dynamic='force-dynamic';
type Product=(typeof products)[number];
const catalog=new Map<string,Product>(products.map(p=>[p.sku,p]));
const money=(c:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(c/100);
type Props={params:Promise<{sku:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {sku}=await params;const p=catalog.get(sku);
 return {title:p?p.name+' | Sichere Nacht':'Produkt nicht gefunden | Sichere Nacht',description:p?.shortDescription?.slice(0,150)||'Ajax-Sicherheitsprodukte von Sichere Nacht'};
}
export default async function ProductPage({params}:Props){
 const {sku}=await params;const p=catalog.get(sku);
 if(!p)notFound();
 const related=products.filter(x=>x.sku!==p.sku&&x.category===p.category&&!!x.image).slice(0,4);
 return <main className="wrap" style={{paddingBottom:90}}><nav className="nav"><Link href="/" className="brand">◈ SICHERE <span className="accent">NACHT</span></Link><div className="row"><Link href="/shop">Alle Produkte</Link><Link href="/warenkorb" className="button secondary">Warenkorb</Link></div></nav>
 <p><Link href="/shop" className="accent">← Zurück zum Shop</Link></p>
 <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',alignItems:'start',gap:36,marginTop:24}}>
 <div style={{background:'#f4f7fa',borderRadius:18,padding:22,minHeight:340,display:'grid',placeItems:'center'}}>{p.image?<img src={p.image} alt={p.name} width={440} height={400} style={{maxWidth:'100%',maxHeight:410,objectFit:'contain'}}/>:<span style={{color:'#586a7e'}}>Für diesen Artikel ist noch kein Produktbild verfügbar.</span>}</div>
 <section><p className="eyebrow">{p.category} · {p.line}</p><h1 style={{fontSize:'clamp(31px,4vw,48px)',lineHeight:1.13}}>{p.name}</h1><p style={{fontSize:13}}>Artikelnummer: {p.sku}{p.ean?' · EAN: '+p.ean:''}</p><div className="price">{money(p.priceCents)}</div><p className="note">inkl. 19 % MwSt., zzgl. Versandkosten</p><AddToCart sku={p.sku}/><p className="note">Die Online-Zahlung ist noch nicht freigeschaltet. Verfügbarkeit und Kompatibilität sind vor Kaufabschluss zu prüfen.</p><hr/><h2 style={{fontSize:22}}>Beschreibung</h2><p style={{whiteSpace:'pre-line'}}>{p.shortDescription||'Weitere Produktinformationen folgen.'}</p></section></div>
 {related.length>0&&<section className="section"><h2>Weitere Artikel aus dieser Kategorie</h2><div className="grid">{related.map(x=><Link key={x.sku} href={'/shop/'+encodeURIComponent(x.sku)} className="card" style={{display:'block'}}><div style={{height:125,background:'#f5f7fa',borderRadius:10,padding:12}}><img src={x.image||''} alt={x.name} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div><h3 style={{fontSize:17}}>{x.name}</h3><strong className="accent">{money(x.priceCents)}</strong></Link>)}</div></section>}
 </main>;
}
