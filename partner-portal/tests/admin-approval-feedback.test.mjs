import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const admin=readFileSync(new URL('../app/portal/views/admin.tsx',import.meta.url),'utf8');
const portal=readFileSync(new URL('../app/portal/portal-client.tsx',import.meta.url),'utf8');
test('approval form renders at selected partner rather than below list',()=>{
 assert.match(admin,/approval\?\.user_id===a\.user_id/);
 assert.match(admin,/autoFocus value=\{approvalReason\}/);
});
test('approval displays clear success and actionable errors',()=>{
 assert.match(admin,/setApprovalSuccess\(label\+' wurde erfolgreich als Vertriebspartner freigegeben\.'/);
 assert.match(admin,/role="status" aria-live="polite"/);
 assert.match(admin,/role="alert"/);
 assert.match(admin,/Freigabe fehlgeschlagen:/);
});
test('successful mutation is not misreported on data refresh failure',()=>{
 assert.match(portal,/try\{await load\(\)\}catch\{/);
 assert.match(portal,/Änderung gespeichert\. Die Ansicht konnte nicht aktualisiert werden/);
});
