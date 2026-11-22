import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const alerts=readFileSync(new URL('../lib/vp-signup-alerts.mjs',import.meta.url),'utf8');
const signup=readFileSync(new URL('../app/api/auth/route.ts',import.meta.url),'utf8');
const cron=readFileSync(new URL('../app/api/cron/vp-reminders/route.ts',import.meta.url),'utf8');
const sql=readFileSync(new URL('../../database/vp_signup_admin_notifications.sql',import.meta.url),'utf8');
test('signup notification is queued only after a genuine new Supabase identity',()=>{
 assert.match(signup,/candidate\.identities\.length>0/);
 assert.match(signup,/candidate\.email\?\.toLowerCase\(\)===email/);
 assert.match(signup,/queueSignupAdminNotification/);
 assert.doesNotMatch(signup,/action==='resend_confirmation'[\s\S]{0,100}queueSignupAdminNotification/);
});
test('only the configured admin email receives alerts, never partner addresses',()=>{
 assert.match(alerts,/process\.env\.VP_SIGNUP_NOTIFY_EMAIL/);
 assert.match(alerts,/to=destination\(\)/);
 assert.match(alerts,/sendSmtp\(\{\.\.\.cfg,/);
 assert.doesNotMatch(alerts,/to:signupEmail/);
});
test('private notification ledger prevents duplicate admin messages and retries safely',()=>{
 assert.match(sql,/user_id uuid primary key/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all .* from public, anon, authenticated/);
 assert.match(alerts,/error\.code==='23505'/);
 assert.match(alerts,/\.eq\('attempts',item\.attempts\)/);
 assert.match(alerts,/\.lt\('attempts',4\)/);
 assert.match(cron,/sendSignupAdminNotifications\(\{limit:5\}\)/);
});
test('notification does not override successful partner signup response',()=>{
 assert.match(signup,/try\{await queueSignupAdminNotification/);
 assert.match(signup,/catch\(err\)\{console\.error\('VP_SIGNUP_ALERT_QUEUING_FAILED'/);
});
