'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import productsData from '../../products.json';
import {CartDraft,loadCart,saveCart} from '../../lib/cart';
type Product={sku:string;name:string;priceCents:number;image:string|null};
const products=new Map((productsData as Product[]).map(p=>[p.sku,p]));
const money=(c:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(c/100);
export default function CartPage(){
 const [cart,setCart]=useState<CartDraft|null>(null);
 useEffect(()=>{setCart(loadCart())},[]);
 const lines=useMemo(()=>cart?.items.map(line=>({...line,product:products.get(line.sku)}))||[],[cart]);
 const invalid=lines.filter(l=>!l.product);
 const subtotal=lines.reduce((sum,l)=>sum+(l.product?.priceCents||0)*l.quantity,0);
 const montage=cart?.installation?19900:0;
 const total=subtotal+montage;
 function update(items:CartDraft['items']){if(!cart)return;setCart(saveCart({items,installation:cart.installation,installationZip:cart.installationZip,source:cart.source}));}
 function setInstallation(installation:boolean){if(!cart)return;setCart(saveCart({items:cart.items,installation,installationZip:cart.installationZip,source:cart.source}));}
 function setZip(zip:string){if(!cart)return;setCart(saveCart({items:cart.items,installation:cart.installation,installationZip:zip.replace(/\D/g,'').slice(0,5),source:cart.source}));}
 return <main className="wrap" style={{paddingBottom:80}}><nav className="nav"><Link href="/" className="brand">◈ SICHERE <span className="accent">NACHT</span></Link><Link href="/shop">Zum Shop</Link></nav><p className="accent">DEINE ZUSAMMENSTELLUNG</p><h1>Warenkorb</h1><p>Alle Preise inklusive 19 % Mehrwertsteuer. Noch kein verbindlicher Kauf: Die Zahlungsfunktion folgt nach der technischen und rechtlichen Freigabe.</p>
 {!cart?<p>Warenkorb wird geladen …</p>:lines.length===0?<div className="card"><h2>Dein Warenkorb ist leer.</h2><p>Stelle deine Alarmanlage im Konfigurator zusammen oder wähle einzelne Artikel aus.</p><div className="row"><Link className="button" href="/konfigurator">Zum Konfigurator</Link><Link className="button secondary" href="/shop">Ajax-Produkte ansehen</Link></div></div>:<div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',alignItems:'start'}}>
 <section className="card"><h2>Produkte ({lines.reduce((n,l)=>n+l.quantity,0)})</h2>{lines.map(l=><div key={l.sku} style={{display:'grid',gridTemplateColumns:'68px 1fr',gap:14,borderBottom:'1px solid #30445b',padding:'16px 0'}}>
 <div style={{width:68,height:68,background:'#f4f6f8',borderRadius:10,display:'grid',placeItems:'center'}}>{l.product?.image?<img src={l.product.image} alt="" width={65} height={65} style={{width:65,height:65,objectFit:'contain'}}/>:<span style={{color:'#456'}}>AJAX</span>}</div>
 <div><strong>{l.product?.name||'Unbekannte Artikelnummer'}</strong><p style={{fontSize:12,margin:'4px 0'}}>Art. {l.sku}</p><div className="row" style={{alignItems:'center'}}><label style={{margin:0}}>Anzahl <select aria-label={'Anzahl '+l.sku} value={l.quantity} style={{width:76,marginLeft:7}} onChange={e=>update(cart.items.map(i=>i.sku===l.sku?{...i,quantity:Number(e.target.value)}:i))}>{Array.from({length:30},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label><button className="button secondary" onClick={()=>update(cart.items.filter(i=>i.sku!==l.sku))}>Entfernen</button></div><strong className="accent">{l.product?money(l.product.priceCents*l.quantity):'Preis nicht verfügbar'}</strong></div></div>)}</section>
 <aside className="card"><h2>Preisübersicht</h2><div style={{display:'flex',justifyContent:'space-between',gap:12}}><span>Ajax-Komponenten</span><strong>{money(subtotal)}</strong></div>
 <label style={{marginTop:22}}><input type="checkbox" checked={cart.installation} onChange={e=>setInstallation(e.target.checked)}/> Optionale Montage (+199,00 € brutto)</label>
 {cart.installation&&<><label htmlFor="plz">Montage-PLZ (Hamburg und Umgebung)</label><input id="plz" inputMode="numeric" value={cart.installationZip} maxLength={5} placeholder="z. B. 20095" onChange={e=>setZip(e.target.value)}/><p className="note">Die Montage ist nur nach Prüfung von Standort und Leistungsumfang buchbar. Ein PLZ-Check wird noch ergänzt.</p></>}

 <hr/><div style={{display:'flex',justifyContent:'space-between',gap:12}}><span>Gesamt inkl. MwSt.</span><strong className="price">{money(total)}</strong></div><p>Darin enthaltene MwSt.: {money(Math.round(total*19/119))}</p><p className="note">Zzgl. eventueller Versandkosten; Höhe wird vor dem verbindlichen Kauf ausgewiesen.</p>
 {invalid.length>0&&<p style={{color:'#ffb38a'}}>Einige Artikel sind nicht mehr im aktuellen Katalog. Bitte prüfe die Auswahl.</p>}
 <button className="button secondary" disabled style={{width:'100%',cursor:'not-allowed'}}>Bezahlung folgt</button><p className="note">Stripe wird erst nach Einrichtung der Zahlungsdaten, Versandberechnung und Montageprüfung freigeschaltet.</p><Link href="/konfigurator">Konfiguration anpassen</Link></aside></div>}
 </main>;
}
