import Link from 'next/link';
import {deliveryPolicy} from '../../lib/delivery-policy';
export default function DeliveryNote(){return <p className="note"><strong>Direktversand durch SECPLAN.</strong> Verkauf, Rechnung und Kundenservice durch {deliveryPolicy.seller}. Lieferung nur innerhalb Deutschlands: 9,90 € brutto pro Bestellung; {deliveryPolicy.deliveryLabel}. <Link href="/versand">Lieferinformationen</Link></p>}
