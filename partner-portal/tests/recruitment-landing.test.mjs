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
 assert.match(page,/robots:\{index:true,follow:true/);
 assert.match(page,/alternates:\{canonical:/);
});
test('responsive landing styles support mobile and reduced motion',()=>{
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

const robots=readFileSync(new URL('../app/robots.ts',import.meta.url),'utf8');
const sitemap=readFileSync(new URL('../app/sitemap.ts',import.meta.url),'utf8');
const layout=readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
test('search crawlers can reach recruitment landing but not partner application',()=>{
 assert.match(robots,/allow:\['\/vertriebspartner'/);
 assert.match(robots,/disallow:\['\/portal'/);
 assert.doesNotMatch(robots,/disallow:'\/'\s*}/);
 assert.match(layout,/robots:\{index:false,follow:false/);
});
test('sitemap includes only the public recruitment page',()=>{
 assert.match(sitemap,/https:\/\/vp\.sichere-nacht\.de\/vertriebspartner/);
 assert.doesNotMatch(sitemap,/\/portal'|\/login'/);
});
test('page has focused title description and metadata for search/social',()=>{
 assert.match(page,/title:'Vertriebspartner für Alarmanlagen werden/);
 assert.match(page,/openGraph:/);
 assert.match(page,/twitter:/);
 assert.match(page,/robots:\{index:true,follow:true/);
});
test('structured data reflects visible FAQ, organization and breadcrumb',()=>{
 assert.match(page,/'@type':'Organization'/);
 assert.match(page,/'@type':'FAQPage'/);
 assert.match(page,/mainEntity:faqs\.map/);
 assert.match(page,/'@type':'BreadcrumbList'/);
 assert.match(page,/type="application\/ld\+json"/);
});
test('landing answers keyword intent with substantive helpful copy',()=>{
 assert.match(page,/Alarmanlagen verkaufen/);
 assert.match(page,/Vertrieb für Sicherheitstechnik/);
 assert.match(page,/Keine Verdienstgarantie/);
});

const nextConfig=readFileSync(new URL('../next.config.mjs',import.meta.url),'utf8');
test('no global X-Robots-Tag blocks the public landing',()=>{
 assert.match(nextConfig,/source:'\/:path\(\(\?!vertriebspartner\)\.\*\)'/);
 assert.match(nextConfig,/key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'/);
 const globalHeaders=nextConfig.split("source:'/:path*'")[1].split("source:'/:path((?!vertriebspartner).*)'")[0];
 assert.doesNotMatch(globalHeaders,/X-Robots-Tag/);
});
