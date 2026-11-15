import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

// Exercise the actual route with Supabase's resolved {error} responses. These
// errors do not reject the promise, which previously caused false successes.
const source=readFileSync(new URL('../app/api/auth/route.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function resetWith(providerResult){
 const calls=[],exports={};
 const server={
  body:request=>request.json(),
  client:async()=>({auth:{resetPasswordForEmail:async(...args)=>{calls.push(args);return providerResult}}}),
  json:(data,status=200)=>Response.json(data,{status}),
  failure:error=>Response.json({error:error.message},{status:400})
 };
 runInNewContext(code,{exports,URL,require:name=>{assert.equal(name,'../../../lib/server');return server}});
 const response=await exports.POST(new Request('https://vp.sichere-nacht.de/api/auth',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'reset',email:' Partner@Example.com '})
 }));
 return {status:response.status,data:await response.json(),calls};
}
test('recovery email rate limit returns an error instead of claiming success',async()=>{
 const result=await resetWith({data:null,error:{status:429,code:'over_email_send_rate_limit',message:'email rate limit exceeded'}});
 assert.equal(result.status,429);
 assert.equal(result.data.ok,undefined);
 assert.match(result.data.error,/Versandlimit/);
 assert.match(result.data.error,/kein neuer Link/);
});
test('mail transport failure does not expose provider details or claim success',async()=>{
 const result=await resetWith({data:null,error:{status:500,code:'unexpected_failure',message:'private SMTP diagnostic'}});
 assert.equal(result.status,503);
 assert.equal(result.data.ok,undefined);
 assert.doesNotMatch(result.data.error,/private SMTP/);
});
test('accepted reset keeps a neutral account response and the portal recovery callback',async()=>{
 const result=await resetWith({data:{},error:null});
 assert.equal(result.status,200);
 assert.equal(result.data.ok,true);
 assert.match(result.data.message,/Falls ein passendes Konto besteht/);
 assert.match(result.data.message,/selben Browser/);
 assert.equal(result.calls.length,1);
 assert.equal(result.calls[0][0],'partner@example.com');
 assert.equal(result.calls[0][1].redirectTo,'https://vp.sichere-nacht.de/auth/callback?recovery=1');
});
