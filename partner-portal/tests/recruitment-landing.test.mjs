import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/vertriebspartner/page.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/vertriebspartner/page.module.css',import.meta.url),'utf8');
const home=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
test('public recruitment page links to real account signup',()=>{
 assert.match(page,/const register='\/login\?register=1'/);
 assert.match(page,/href=\{register\}/);
 assert.match(home,/href="\/vertriebspartner"/);
});
test('recruitment copy respects approval and qualification gates',()=>{
 assert.match(page,/Antrag vervollständigen/);
 assert.match(page,/Freigabe erhalten/);
 assert.match(page,/Akademie absolvieren/);
 assert.match(page,/Keine Verdienstgarantie/);
 assert.doesNotMatch(page,/garantiert.{0,20}(?:€|Umsatz|Provision)/i);
});
test('recruitment landing is indexable after go-live while portal remains protected',()=>{
 assert.match(page,/robots:\{index:true,follow:true\}/);
 assert.match(page,/alternates:\{canonical:/);
});
test('responsive landing styles support mobile and reduced motion',()=>{
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
