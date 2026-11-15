import availabilityData from './merchant-availability.json';
import {productAdvice} from './product-advice';
import {SITE_ORIGIN} from './seo';

export type MerchantProduct={sku:string;name:string;ean?:string;image?:string|null;priceCents:number;category?:string;line?:string};
// Only confirmed, time-limited supplier/warehouse evidence may be added here.
// No catalog price or successful payment is evidence of stock.
export type AvailabilityEvidence={status:'in_stock';confirmedAt:string;validUntil:string};
export function confirmedAvailability(sku:string,now=Date.now(),data:Record<string,AvailabilityEvidence>=availabilityData){
 const entry=data[sku];
 if(!entry||entry.status!=='in_stock')return null;
 const start=Date.parse(entry.confirmedAt),end=Date.parse(entry.validUntil);
 return Number.isFinite(start)&&Number.isFinite(end)&&start<=now&&end>now&&end>start&&end-start<=86400000?entry:null;
}
export function validGtin(value:string|undefined){
 if(!value||! /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value))return false;
 const digits=[...value].map(Number),check=digits.pop()!;
 const sum=digits.reverse().reduce((total,n,i)=>total+n*(i%2===0?3:1),0);
 return (10-sum%10)%10===check;
}
export function productUrl(sku:string){return SITE_ORIGIN+'/shop/'+encodeURIComponent(sku)}
export function productImage(image:string|null|undefined){
 if(!image)return undefined;
 try{const url=new URL(image,SITE_ORIGIN);return url.protocol==='https:'?url.href:undefined}catch{return undefined}
}
export function productStructuredData(p:MerchantProduct){
 const advice=productAdvice(p),available=confirmedAvailability(p.sku);
 return {'@context':'https://schema.org','@type':'Product','@id':productUrl(p.sku)+'#product',name:p.name,sku:p.sku,
 brand:{'@type':'Brand',name:'Ajax'},description:advice.purpose,image:productImage(p.image),url:productUrl(p.sku),
 ...(validGtin(p.ean)?{gtin:p.ean}:{}),
 ...(advice.reviewed&&Number.isInteger(p.priceCents)&&p.priceCents>0?{offers:{'@type':'Offer',url:productUrl(p.sku),price:(p.priceCents/100).toFixed(2),priceCurrency:'EUR',itemCondition:'https://schema.org/NewCondition',seller:{'@type':'Organization',name:'H&K Projekt UG (haftungsbeschränkt)'},
 ...(available?{availability:'https://schema.org/InStock'}:{}),
 shippingDetails:{'@type':'OfferShippingDetails',shippingDestination:{'@type':'DefinedRegion',addressCountry:'DE'},shippingRate:{'@type':'MonetaryAmount',value:'9.90',currency:'EUR'}}}}:{})};
}
export function merchantExclusions(p:MerchantProduct,now=Date.now(),data:Record<string,AvailabilityEvidence>=availabilityData){
 const reasons:string[]=[];
 if(!productAdvice(p).reviewed)reasons.push('technical_review_missing');
 if(!Number.isInteger(p.priceCents)||p.priceCents<=0)reasons.push('invalid_price');
 if(!productImage(p.image))reasons.push('image_missing');
 if(!validGtin(p.ean))reasons.push('valid_gtin_missing');
 if(!confirmedAvailability(p.sku,now,data))reasons.push('confirmed_availability_missing');
 return reasons;
}
export function xmlEscape(value:string){return value.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!))}
export function merchantFeed(products:MerchantProduct[],now=Date.now(),data:Record<string,AvailabilityEvidence>=availabilityData){
 const tag=(name:string,value:string)=>`<${name}>${xmlEscape(value)}</${name}>`;
 const items=products.filter(p=>merchantExclusions(p,now,data).length===0).map(p=>'<item>'+[
 tag('g:id',p.sku),tag('g:title',p.name),tag('g:description',productAdvice(p).purpose),tag('g:link',productUrl(p.sku)),
 tag('g:image_link',productImage(p.image)!),tag('g:brand','Ajax'),tag('g:gtin',p.ean!),tag('g:condition','new'),tag('g:availability','in_stock'),
 tag('g:price',(p.priceCents/100).toFixed(2)+' EUR'),'<g:shipping>'+tag('g:country','DE')+tag('g:price','9.90 EUR')+'</g:shipping>'
 ].join('')+'</item>').join('');
 return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>'+tag('title','Sichere Nacht – Ajax Alarmanlagen')+tag('link',SITE_ORIGIN)+tag('description','Geprüfte Ajax-Produkte mit bestätigter Verfügbarkeit')+items+'</channel></rss>';
}
