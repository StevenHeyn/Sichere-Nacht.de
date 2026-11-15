import products from '../../../lib/public-products.generated.json';
import {merchantFeed} from '../../../lib/merchant';
import {publicIndexing} from '../../../lib/seo';
export const dynamic='force-dynamic';
export function GET(){
 if(!publicIndexing())return new Response('Feed is available on the approved production site only.',{status:404,headers:{'X-Robots-Tag':'noindex'}});
 return new Response(merchantFeed(products),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
}
