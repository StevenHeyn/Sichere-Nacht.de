import {customerTypeLabels,documentedBuyerType,type BuyerRecord} from '../../../lib/buyer-policy';
export default function BuyerDetails({order}:{order:Partial<BuyerRecord>}){
 const type=documentedBuyerType(order);
 return <section style={{padding:'12px 0'}}><strong>{customerTypeLabels[type]}</strong>
  {type==='b2b'&&<><p>Unternehmen: {order.buyer_company}</p><p>Kein freiwilliges Widerrufsrecht. Unternehmerstatus wurde vom Käufer erklärt, nicht durch diese Anzeige rechtlich verifiziert. Mängelrechte bleiben unberührt.</p></>}
  {type==='b2c'&&<p>Verbraucherwiderruf nach der Widerrufsbelehrung.</p>}
  {type==='unclassified'&&<p>Keine nachträgliche B2B-Einstufung. Bei einer Anfrage den tatsächlichen Kaufzweck prüfen.</p>}
  {order.buyer_declared_at&&<small>Auswahl dokumentiert: {new Date(order.buyer_declared_at).toLocaleString('de-DE')} · Version {order.buyer_policy_version}</small>}
 </section>;
}
