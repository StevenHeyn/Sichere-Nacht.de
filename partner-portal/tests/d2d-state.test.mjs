import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyContact,addressQuery} from '../lib/d2d-state.mjs';
test('opening an address keeps the current page, including after page 1',()=>{
 const p=new URLSearchParams(addressQuery('area-1',400,'address-451'));
 assert.equal(p.get('area'),'area-1');assert.equal(p.get('offset'),'400');assert.equal(p.get('address'),'address-451');
});
test('changing page removes the previous selected contact',()=>{
 const p=new URLSearchParams(addressQuery('area-1',600));
 assert.equal(p.get('offset'),'600');assert.equal(p.has('address'),false);
});
test('a new contact never inherits consent, evidence or private fields',()=>{
 const previous=emptyContact();Object.assign(previous,{full_name:'Previous person',phone:'123',phone_permission:true,email_permission:true,permission_evidence:'Previous consent',purpose:'Previous request',privacy_notice_at:'2026-11-14',retain_until:'2026-12-14'});
 const next=emptyContact();assert.equal(next.full_name,'');assert.equal(next.phone,'');assert.equal(next.phone_permission,false);assert.equal(next.email_permission,false);assert.equal(next.permission_evidence,'');assert.equal(next.purpose,'');assert.equal(next.privacy_notice_at,'');assert.equal(next.retain_until,'');assert.notEqual(next,previous);
});
