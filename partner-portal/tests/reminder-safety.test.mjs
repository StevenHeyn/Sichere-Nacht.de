import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const route=readFileSync(new URL('../app/api/cron/vp-reminders/route.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../../database/vp_daily_reminders.sql',import.meta.url),'utf8');
test('cron requires authorization and explicit launch flag',()=>{
 assert.match(route,/process\.env\.CRON_SECRET/);
 assert.match(route,/VP_REMINDERS_ENABLED.*'true'/);
 assert.match(route,/status:401/);
});
test('recipient selection excludes pending and admins and honors opt-out',()=>{
 assert.match(route,/\.in\('status',\['onboarding','active'\]\)/);
 assert.match(route,/\.neq\('role','admin'\)/);
 assert.match(route,/\.eq\('reminder_opt_out',false\)/);
 assert.match(route,/created_at/);
});
test('database prevents multiple daily reminders per user',()=>{
 assert.match(sql,/unique \(user_id,reminder_date\)/);
 assert.match(sql,/enable row level security/);
});
test('transport uses IONOS SMTP settings, not Resend',()=>{
 assert.match(route,/sendSmtp\(/);
 assert.match(route,/process\.env\.SMTP_HOST/);
 assert.doesNotMatch(route,/api\.resend\.com/);
});
