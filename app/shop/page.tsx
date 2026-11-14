import rawProducts from '../../products.json';
import ShopView from './shop-view';
import {pageMetadata} from '../../lib/seo';
export const metadata=pageMetadata('Ajax-Alarmanlagen und Komponenten kaufen | Sichere Nacht','Ajax-Komponenten nach Funktion, Systemtechnik und Einsatzort auswählen. Transparente Bruttopreise, Systemhinweise und Produktvergleich.','/shop');
export default function Shop(){const products=rawProducts.filter(p=>Number.isInteger(p.priceCents)&&p.priceCents>0);return <ShopView products={products}/>}
