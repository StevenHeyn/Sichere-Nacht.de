import {notFound} from 'next/navigation';
import products from '../../../../products.json';
import {SHOP_GROUPS} from '../../../../lib/shop-groups';
import {pageMetadata} from '../../../../lib/seo';
import ShopView from '../../shop-view';
export function generateStaticParams(){return SHOP_GROUPS.filter(g=>g.id!=='alle').map(g=>({gruppe:g.id}))}
export async function generateMetadata({params}:{params:Promise<{gruppe:string}>}){const {gruppe}=await params;const g=SHOP_GROUPS.find(g=>g.id===gruppe);return g?pageMetadata('Ajax '+g.label+' | Sichere Nacht',g.description+'. Geräte, Systemvoraussetzungen und Montagehinweise vor dem Kauf vergleichen.','/shop/kategorie/'+gruppe):{title:'Kategorie nicht gefunden'}}
export default async function Category({params}:{params:Promise<{gruppe:string}>}){const {gruppe}=await params;const g=SHOP_GROUPS.find(g=>g.id===gruppe&&g.id!=='alle');if(!g)notFound();return <ShopView products={products.filter(p=>p.priceCents>0)} initialGroup={g.id}/>}
