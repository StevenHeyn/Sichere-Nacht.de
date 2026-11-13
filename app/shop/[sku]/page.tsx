import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import products from '../../../products.json';
import AddToCart from './add-to-cart';
import {catalogDetail} from '../../../lib/ajax-catalog-content';
import DeliveryNote from '../../components/delivery-note';
export const dynamic='force-dynamic';
type Product=(typeof products)[number];
const catalog=new Map<string,Product>(products.map(p=>[p.sku,p]));
const money=(c:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(c/100);
type Props={params:Promise<{sku:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {sku}=await params;const p=catalog.get(sku);return {title:p?p.name+' | Sichere Nacht':'Produkt nicht gefunden | Sichere Nacht',description:p?(catalogDetail(p.name)?.summary||p.shortDescription||'Ajax-Sicherheitsprodukte von Sichere Nacht').slice(0,155):'Ajax-Sicherheitsprodukte von Sichere Nacht'}}
export default async function ProductPage({params}:Props){
 const {sku}=await params;const p=catalog.get(sku);if(!p||!Number.isInteger(p.priceCents)||p.priceCents<=0)notFound();
 const detail=catalogDetail(p.name);const related=products.filter(x=>x.sku!==p.sku&&x.category===p.category&&!!x.image&&x.priceCents>0).slice(0,4);
 return <main className="wrap" style={{paddingBottom:90}}><nav className="nav"><Link href="/" className="brand">◈ SICHERE <span className="accent">NACHT</span></Link><div className="row"><Link href="/shop">Alle Produkte</Link><Link href="/warenkorb" className="button secondary">Warenkorb</Link></div></nav>
 <p><Link href="/shop" className="accent">← Zurück zum Shop</Link></p>
 <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',alignItems:'start',gap:36,marginTop:24}}>
 <div style={{background:'#f4f7fa',borderRadius:18,padding:22,minHeight:340,display:'grid',placeItems:'center'}}>{p.image?<img src={p.image} alt={p.name} width={440} height={400} style={{maxWidth:'100%',maxHeight:410,objectFit:'contain'}}/>:<span style={{color:'#586a7e'}}>Für diesen Artikel ist noch kein Produktbild verfügbar.</span>}</div>
 <section><p className="eyebrow">{p.category} · {p.line}</p><h1 style={{fontSize:'clamp(31px,4vw,48px)',lineHeight:1.13}}>{p.name}</h1><p style={{fontSize:13}}>Artikelnummer: {p.sku}{p.ean?' · EAN: '+p.ean:''}</p><div className="price">{money(p.priceCents)}</div><p className="note">inkl. 19 % MwSt., zzgl. <Link href="/versand">Versandkosten</Link></p><DeliveryNote/><p className="note">Kein Live-Bestandsnachweis. Die konkrete Lieferantenverfügbarkeit ist vor Bestellfreigabe zu prüfen.</p><AddToCart sku={p.sku}/><hr/>
 {detail&&<div style={{margin:'24px 0',padding:22,borderRadius:16,background:'rgba(255,255,255,.045)',border:'1px solid rgba(255,255,255,.14)'}}><p className="eyebrow">AUF EINEN BLICK · AJAX KATALOG 02/2026</p><h2 style={{fontSize:24,marginTop:8}}>Das macht dieses Gerät besonders</h2><p style={{lineHeight:1.75}}>{detail.summary}</p><ul style={{display:'grid',gap:10,paddingLeft:21}}>{detail.highlights.map(h=><li key={h}>{h}</li>)}</ul>{detail.advice&&<p className="note" style={{marginTop:18}}><strong>Wichtig:</strong> {detail.advice}</p>}<p className="note" style={{fontSize:12}}>Technische Produktfamilieninformation aus dem Ajax-Katalog 02/2026 (S. {detail.page}). Die Ausführung der Artikelnummer ist maßgeblich.</p></div>}
 <h2 style={{fontSize:22}}>Technische Daten und weitere Produktangaben</h2><p style={{whiteSpace:'pre-line',lineHeight:1.75}}>{p.shortDescription||'Weitere Produktinformationen folgen.'}</p></section></div>
 {related.length>0&&<section className="section"><h2>Weitere Artikel aus dieser Kategorie</h2><div className="grid">{related.map(x=><Link key={x.sku} href={'/shop/'+encodeURIComponent(x.sku)} className="card" style={{display:'block'}}><div style={{height:125,background:'#f5f7fa',borderRadius:10,padding:12}}><img src={x.image||''} alt={x.name} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div><h3 style={{fontSize:17}}>{x.name}</h3><strong className="accent">{money(x.priceCents)}</strong></Link>)}</div></section>}
 </main>;
}
