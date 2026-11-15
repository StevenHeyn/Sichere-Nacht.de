import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const source=fs.readFileSync('lib/portal-partner.ts','utf8').replace("import 'server-only';",'').replace("import {validPartner} from './referral-consent';","const validPartner=(s)=>/^VP-[A-Z0-9]{3,16}$/.test(s);");
const {activePortalPartner}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
test('portal eligibility follows active qualification and agency status; unavailable DB never silently drops attribution',async()=>{
 const old=global.fetch;const env={...process.env};process.env.SUPABASE_URL='https://example.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
 try{
 const qualified={status:'active',sales_passed_at:'2026-11-15',sales_quiz_version:'ajax-basics-v1',agency_id:null};
 for(const [row,want] of [[qualified,true],[{...qualified,status:'suspended'},false],[{...qualified,sales_passed_at:null},false],[{...qualified,sales_quiz_version:'old'},false],[null,false]]){global.fetch=async()=>Response.json(row?[row]:[]);assert.equal(await activePortalPartner('VP-ABC123'),want);}
 for(const status of ['active','suspended']){let calls=0;global.fetch=async()=>Response.json(++calls===1?[{...qualified,agency_id:'some-id'}]:[{status,role:'agency'}]);assert.equal(await activePortalPartner('VP-ABC123'),status==='active');}
 global.fetch=async()=>new Response('',{status:503});await assert.rejects(()=>activePortalPartner('VP-ABC123'));
 assert.equal(await activePortalPartner('invalid'),false);
 }finally{global.fetch=old;process.env=env;}
});
