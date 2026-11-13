import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyBuyerMetadata,validateBuyerInput,buyerFromStripeMetadata} from '../lib/buyer-policy.ts';
for(const type of ['b2c','b2b'])test(type+' form parameters preserve declarations without unsupported custom_text',()=>{
 const buyer=validateBuyerInput({customerType:type,company:'Sandbox Test GmbH',businessPurchaseDeclared:true});
 const form=new URLSearchParams();applyBuyerMetadata(form,buyer,'form');
 assert.equal(form.has('custom_text[submit][message]'),false);
 assert.deepEqual(buyerFromStripeMetadata(Object.fromEntries([...form].map(([k,v])=>[k.slice(9,-1),v]))),buyer);
});
test('form checkout is explicitly selected while buyer notices remain rendered in cart',()=>{
 assert.match(readFileSync('app/api/checkout/route.ts','utf8'),/applyBuyerMetadata\(form,buyer,'form'\)/);
 assert.match(readFileSync('app/warenkorb/page.tsx','utf8'),/<BuyerSelector/);
 assert.match(readFileSync('app/components/buyer-selector.tsx','utf8'),/B2B_WITHDRAWAL_NOTE/);
});
