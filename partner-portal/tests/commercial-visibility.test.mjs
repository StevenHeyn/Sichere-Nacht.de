import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const policySource=readFileSync(new URL('../lib/commercial-policy.ts',import.meta.url),'utf8').replace("import 'server-only';",'').replace('role:string','role');
const {commercialPolicy}=await import('data:text/javascript;base64,'+Buffer.from(policySource).toString('base64'));
test('normal VP policy contains only own sales rate and no agency economics',()=>{
 for(const role of ['vp','installer','unknown']){const p=commercialPolicy(role);assert.equal(p.ownRateBps,1500);assert.equal(p.agencySummary,null);assert.doesNotMatch(JSON.stringify(p),/20\s*%|2000|20-Prozent|zwanzig/);assert.match(p.financeSummary,/15 %/)}
});
test('privileged roles retain their commercial information',()=>{for(const role of ['admin','agency'])assert.match(commercialPolicy(role).agencySummary,/20 %/)});
test('shared course seed never discloses agency commission rates',()=>{const sql=readFileSync(new URL('../../database/vp_portal_starter_courses.sql',import.meta.url),'utf8');assert.match(sql,/Verkaufsprovision als Vertriebspartner beträgt 15 %/);assert.doesNotMatch(sql,/20\s*%|20\s*Prozent|zwanzig/)});
