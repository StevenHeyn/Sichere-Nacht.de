import type {MetadataRoute} from 'next';
import {publicIndexing,SITE_ORIGIN} from '../lib/seo';
import {audiencePages,guides} from '../lib/advice-content';
import {productAdvice} from '../lib/product-advice';
import products from '../lib/public-products.generated.json';
import {regionalPages} from '../lib/regional-content';
import {SHOP_GROUPS} from '../lib/shop-groups';
export default function sitemap():MetadataRoute.Sitemap{
 if(!publicIndexing())return [];
 const paths=['','/shop','/konfigurator','/sicherheitscheck','/kontakt','/montage-hamburg','/ratgeber','/regionen',...Object.keys(regionalPages).map(x=>'/regionen/'+x),...SHOP_GROUPS.filter(g=>g.id!=='alle').map(g=>'/shop/kategorie/'+g.id),...Object.keys(audiencePages).map(x=>'/alarmanlagen/'+x),...Object.keys(guides).map(x=>'/ratgeber/'+x),...products.filter(p=>p.priceCents>0&&productAdvice(p).reviewed).map(p=>'/shop/'+encodeURIComponent(p.sku))];
 return paths.map(path=>({url:SITE_ORIGIN+path}));
}
