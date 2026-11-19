import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../app/api/command/route.ts',import.meta.url),'utf8');
const ui=readFileSync(new URL('../app/portal/views/admin.tsx',import.meta.url),'utf8');
test('SMTP test runs behind admin authorization',()=>{
 assert.match(src,/startsWith\('admin_'\).*account\.role!==\s*'admin'/);
 assert.match(src,/case 'admin_test_smtp'/);
});
test('SMTP test destination is the authenticated admin account only',()=>{
 const block=src.split("case 'admin_test_smtp':")[1].split("case 'admin_job_cancel':")[0];
 assert.match(block,/account\.email/);
 assert.match(block,/to:userEmail/);
 assert.doesNotMatch(block,/d\.email|d\.to|d\.recipient/);
 assert.match(block,/process\.env\.SMTP_PASSWORD/);
 assert.doesNotMatch(block,/password[,}]\s*\}\)/);
});
test('admin UI exposes safe, opt-in SMTP test',()=>{
 assert.match(ui,/IONOS-SMTP-Test/);
 assert.match(ui,/action:'admin_test_smtp'/);
 assert.match(ui,/aria-live="polite"/);
 assert.match(ui,/setSmtpMessage/);
});
