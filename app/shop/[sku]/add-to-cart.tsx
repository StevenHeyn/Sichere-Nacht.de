'use client';
import {useState} from 'react';
import Link from 'next/link';
import {loadCart,saveCart} from '../../../lib/cart';
export default function AddToCart({sku}:{sku:string}){
 const [added,setAdded]=useState(false);
 return <div><button type="button" className="button" onClick={()=>{try{const old=loadCart();saveCart({items:[...old.items,{sku,quantity:1}],installation:old.installation,installationZip:old.installationZip,source:'shop'});setAdded(true)}catch{setAdded(false)}}}>In den Warenkorb</button>{added&&<p role="status" className="accent">Hinzugefügt! <Link href="/warenkorb" style={{textDecoration:'underline'}}>Zum Warenkorb →</Link></p>}</div>
}
