import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {secplanPortal} from '../lib/secplan-portal.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('portal is exactly the operator-supplied HTTPS login, without order data',()=>{
 assert.equal(secplanPortal.loginUrl,'https://www.secplan.de/account/login');
 const url=new URL(secplanPortal.loginUrl);
 assert.equal(url.protocol,'https:');
 for(const field of ['search','hash','username','password'])assert.equal(url[field],'');
});
test('selecting a channel does not pretend that account access or checkout is verified',()=>{
 assert.equal(secplanPortal.channel,'manual_portal');
 assert.equal(secplanPortal.selectedByOperator,true);
 assert.equal(secplanPortal.accountAccessVerified,false);
 assert.equal(secplanPortal.supplierCheckoutVerified,false);
 assert.equal(secplanPortal.automaticTransmission,false);
});
test('portal link is plain external navigation without side effects or referrer',()=>{
 const view=read('app/admin/bestellungen/supplier-portal-link.tsx');
 assert.match(view,/<a\s[^>]*href=\{secplanPortal.loginUrl\}/);
 assert.match(view,/target="_blank"/);assert.match(view,/rel="noopener noreferrer"/);assert.match(view,/referrerPolicy="no-referrer"/);
 assert.doesNotMatch(view,/onClick=|fetch\(|<form|useEffect|localStorage|sessionStorage|Authorization|process\.env|dangerouslySetInnerHTML/);
});
test('test orders carry a conspicuous no-order warning instead of a live instruction list',()=>{
 const view=read('app/admin/bestellungen/supplier-portal-link.tsx');
 assert.match(view,/testMode\?/);assert.match(view,/TESTBESTELLUNG/);assert.match(view,/nicht im SECPLAN-Portal bestellen/);assert.match(view,/kein Lieferantenauftrag/);
});
test('real order guide requires checking recipient and actual portal completion',()=>{
 const view=read('app/admin/bestellungen/supplier-portal-link.tsx');
 assert.match(view,/abweichende Kundenlieferadresse/);assert.match(view,/Falls dieser Direktversand im Konto nicht möglich ist/);
 assert.match(view,/Erst nach tatsächlich abgeschlossener Portalbestellung/);assert.match(view,/keinen Bestellstatus/);
});
test('existing supplier export and status safeguards remain in the order panel',()=>{
 const view=read('app/admin/bestellungen/supplier-panel.tsx');
 assert.match(view,/<SupplierPortalLink testMode=\{order.test_mode\}/);
 assert.match(view,/!order.test_mode&&state\?\.status==='pending'/);
 assert.match(view,/!stockChecked\|\|reference.trim\(\).length<3\|\|stock.trim\(\).length<3/);
 assert.match(view,/action==='shipped'&&\(!complete\|\|!when\)/);
 assert.match(view,/Nur Teststatus dokumentieren\?/);
});
