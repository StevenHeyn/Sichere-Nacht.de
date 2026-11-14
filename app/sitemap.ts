import type {MetadataRoute} from 'next';
import {publicIndexing,SITE_ORIGIN} from '../lib/seo';
import {audiencePages,guides} from '../lib/advice-content';
import {verifiedCoreSkus} from '../lib/product-advice';
import {SHOP_GROUPS} from '../lib/shop-groups';
export default function sitemap():MetadataRoute.Sitemap{
 if(!publicIndexing())return [];
 const paths=['','/shop','/konfigurator','/sicherheitscheck','/kontakt','/montage-hamburg','/ratgeber',...SHOP_GROUPS.filter(g=>g.id!=='alle').map(g=>'/shop/kategorie/'+g.id),...Object.keys(audiencePages).map(x=>'/alarmanlagen/'+x),...Object.keys(guides).map(x=>'/ratgeber/'+x),...verifiedCoreSkus().map(x=>'/shop/'+encodeURIComponent(x))];
 return paths.map(path=>({url:SITE_ORIGIN+path}));
}
