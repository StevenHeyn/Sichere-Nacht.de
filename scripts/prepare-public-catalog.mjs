import {readFileSync,writeFileSync} from 'node:fs';
// A supplier-branded custom faceplate is not a neutral product. Do not rename it deceptively.
const excluded=new Set(['77436.63.WH-ST1']);
const products=JSON.parse(readFileSync(new URL('../products.json',import.meta.url),'utf8'));
const visible=products.filter(p=>!excluded.has(p.sku));
const text=JSON.stringify(visible);
if(/sec[\s-]?plan|Reichelsheim|Buchenstra[ßs]e/i.test(text))throw new Error('Public catalog requires a supplier-identity review.');
writeFileSync(new URL('../lib/public-products.generated.json',import.meta.url),JSON.stringify(visible,null,2)+'\n');
console.log('Public catalog prepared:',visible.length,'records; excluded branded variant:',excluded.size);
