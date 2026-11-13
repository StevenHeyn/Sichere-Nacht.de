import type {MetadataRoute} from 'next';
import {publicIndexing,SITE_ORIGIN} from '../lib/seo';
import {audiencePages,guides} from '../lib/advice-content';
import {verifiedCoreSkus} from '../lib/product-advice';
export default function sitemap():MetadataRoute.Sitemap{
 if(!publicIndexing())return [];
 const paths=['','/shop','/konfigurator','/sicherheitscheck','/kontakt','/montage-hamburg','/ratgeber',...Object.keys(audiencePages).map(x=>'/alarmanlagen/'+x),...Object.keys(guides).map(x=>'/ratgeber/'+x),...verifiedCoreSkus().map(x=>'/shop/'+encodeURIComponent(x))];
 return paths.map(path=>({url:SITE_ORIGIN+path}));
}
