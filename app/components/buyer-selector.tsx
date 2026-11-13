'use client';
import Link from 'next/link';
import {BUSINESS_DECLARATION,B2B_WITHDRAWAL_NOTE,BUYER_PURPOSE_NOTE,type BuyerInput} from '../../lib/buyer-policy';
export default function BuyerSelector({value,onChange}:{value:BuyerInput;onChange:(value:BuyerInput)=>void}){
 return <fieldset className="card" style={{marginBottom:20}}><legend><strong>Für wen kaufst du?</strong></legend>
  <label><input type="radio" name="buyer-type" value="b2c" checked={value.customerType==='b2c'} onChange={()=>onChange({customerType:'b2c',company:'',businessPurchaseDeclared:false})}/> Privatkauf (B2C)</label>
  <label><input type="radio" name="buyer-type" value="b2b" checked={value.customerType==='b2b'} onChange={()=>onChange({customerType:'b2b',company:'',businessPurchaseDeclared:false})}/> Geschäftlicher Kauf (B2B)</label>
  {value.customerType==='b2c'?<p>Du kaufst als Verbraucher. Es gilt das gesetzliche <Link href="/widerruf">Widerrufsrecht für Verbraucher</Link>.</p>:<>
   <label htmlFor="buyer-company">Vollständiger Unternehmensname / Name des Einzelunternehmens</label><input id="buyer-company" autoComplete="organization" maxLength={160} required value={value.company} onChange={e=>onChange({...value,company:e.target.value,businessPurchaseDeclared:false})}/>
   <p><strong>{B2B_WITHDRAWAL_NOTE}</strong></p>
   <label><input type="checkbox" checked={value.businessPurchaseDeclared} onChange={e=>onChange({...value,businessPurchaseDeclared:e.target.checked})}/>{' '}{BUSINESS_DECLARATION}</label>
   <p className="note">Eine Umsatzsteuer-ID ist hierfür nicht erforderlich. Die Auswahl führt nicht zu einer steuerfreien Bestellung.</p>
  </>}
  <p className="note">{BUYER_PURPOSE_NOTE} <Link href="/agb">Vertragsbedingungen</Link></p>
 </fieldset>;
}
