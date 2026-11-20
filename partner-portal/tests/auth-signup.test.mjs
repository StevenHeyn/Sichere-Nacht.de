import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const source=readFileSync(new URL('../app/api/auth/route.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function signupWith(providerResult,overrides={},requestUrl='https://vp.sichere-nacht.de/api/auth'){
 const calls=[],exports={};
 const server={
  body:request=>request.json(),
  client:async()=>({auth:{signUp:async(...args)=>{calls.push(args);return providerResult},resend:async(...args)=>{calls.push(args);return providerResult}}}),
  json:(data,status=200)=>Response.json(data,{status}),
  failure:error=>Response.json({error:error.message},{status:400})
 };
 runInNewContext(code,{exports,URL,require:name=>{assert.equal(name,'../../../lib/server');return server}});
 const response=await exports.POST(new Request(requestUrl,{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'signup',email:' Partner@Example.com ',password:'a-long-test-password',accountPrivacyAccepted:true,...overrides})
 }));
 return {status:response.status,data:await response.json(),calls};
}
test('accepted signup directs the partner to email confirmation without resubmitting',async()=>{
 const result=await signupWith({data:{user:{id:'pending-user'},session:null},error:null});
 assert.equal(result.status,200);
 assert.equal(result.data.ok,true);
 assert.equal(result.data.retryAfterSeconds,60);
 assert.match(result.data.message,/Spamordner/);
 assert.match(result.data.message,/selben Browser/);
 assert.match(result.data.message,/nicht erneut erstellen/);
 assert.equal(result.calls.length,1);
 assert.equal(result.calls[0][0].email,'partner@example.com');
 assert.equal(result.calls[0][0].options.emailRedirectTo,'https://vp.sichere-nacht.de/auth/callback');
 assert.equal(result.calls[0][0].options.data,undefined);
});
test('repeated signup returns a cooldown and inbox guidance, not a configuration failure',async()=>{
 const result=await signupWith({error:{status:429,code:'over_email_send_rate_limit',message:'For security purposes, you can only request this after 50 seconds.'}});
 assert.equal(result.status,429);
 assert.equal(result.data.ok,undefined);
 assert.equal(result.data.retryAfterSeconds,60);
 assert.match(result.data.error,/kein neuer Bestätigungslink/);
 assert.match(result.data.error,/Spamordner/);
 assert.doesNotMatch(result.data.error,/Konfiguration|Kontoregistrierung derzeit nicht möglich/);
});
test('provider cooldown longer than a minute is respected',async()=>{
 const result=await signupWith({error:{status:429,message:'Please try after 120 seconds.'}});
 assert.equal(result.data.retryAfterSeconds,120);
});
test('hourly mail limits do not claim that a mail was sent or the account exists',async()=>{
 const result=await signupWith({error:{status:429,code:'over_email_send_rate_limit',message:'email rate limit exceeded'}});
 assert.equal(result.status,429);
 assert.equal(result.data.ok,undefined);
 assert.match(result.data.error,/Falls du dich gerade registriert hast/);
 assert.doesNotMatch(result.data.error,/Konto wurde erstellt|E-Mail wurde versendet/);
});
test('unexpected provider failures stay failures and hide internal diagnostics',async()=>{
 const result=await signupWith({error:{status:500,code:'unexpected_failure',message:'private SMTP credential diagnostic'}});
 assert.equal(result.status,503);
 assert.equal(result.data.ok,undefined);
 assert.doesNotMatch(result.data.error,/private|SMTP|credential/);
});
test('weak passwords receive actionable feedback',async()=>{
 const result=await signupWith({error:{status:422,code:'weak_password'}});
 assert.equal(result.status,400);
 assert.match(result.data.error,/stärkeres Passwort/);
});
test('privacy acknowledgement and password minimum remain enforced before signup',async()=>{
 for(const overrides of [{accountPrivacyAccepted:false},{password:'short'}]){
  const result=await signupWith({error:null},overrides);
  assert.equal(result.status,400);
  assert.equal(result.calls.length,0);
 }
});
test('resend uses signup confirmation and a neutral account response',async()=>{
 const result=await signupWith({error:null},{action:'resend_confirmation',password:''});
 assert.equal(result.status,200);
 assert.equal(result.calls[0][0].type,'signup');
 assert.equal(result.calls[0][0].email,'partner@example.com');
 assert.equal(result.calls[0][0].options.emailRedirectTo,'https://vp.sichere-nacht.de/auth/callback');
 assert.match(result.data.message,/Falls die Adresse/);
 assert.match(result.data.message,/selben Browser/);
});
test('resend rate limits return a cooldown and never claim delivery',async()=>{
 const result=await signupWith({error:{status:429,code:'over_email_send_rate_limit'}},{action:'resend_confirmation'});
 assert.equal(result.status,429);
 assert.equal(result.data.ok,undefined);
 assert.equal(result.data.retryAfterSeconds,60);
 assert.match(result.data.error,/kein neuer Link/);
});

test('confirmation redirect cannot be influenced by a hostile request origin',async()=>{
 const result=await signupWith({error:null},{},'https://attacker.example/api/auth');
 assert.equal(result.status,200);
 assert.equal(result.calls[0][0].options.emailRedirectTo,'https://vp.sichere-nacht.de/auth/callback');
});
test('resend redirect cannot be influenced by a preview or hostile request origin',async()=>{
 const result=await signupWith({error:null},{action:'resend_confirmation'},'https://attacker.example/api/auth');
 assert.equal(result.status,200);
 assert.equal(result.calls[0][0].options.emailRedirectTo,'https://vp.sichere-nacht.de/auth/callback');
});
