import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const data=JSON.parse(readFileSync('lib/regional-statistics.json','utf8'));
const cities={...data.cities,...data.additionalCities};
assert.equal(Object.keys(data.cities).length,81);assert.equal(Object.keys(cities).length,119);
assert.equal(new Set(Object.values(cities).map(r=>r.ags)).size,119);
for(const [slug,r] of Object.entries(cities)){
 assert.equal(r.burglary,r.attempts+r.completed);assert.ok(r.totalCrime>=r.burglary);assert.ok(r.frequency>=0);
 const html=readFileSync('.next/server/app/regionen/'+slug+'.html','utf8');
 assert.ok(html.includes('rel="canonical" href="https://sichere-nacht.de/regionen/'+slug+'"'),slug+' canonical');
 for(const value of [r.burglary,r.attempts,r.completed,r.totalCrime])assert.ok(html.includes('<td>'+value.toLocaleString('de-DE')+'</td>'),slug+' source figure '+value);
 assert.ok(html.includes('Stadtgebiet'),slug+' geographic scope');
 assert.ok(html.includes('PKS 2025'),slug+' reporting year');
}
const directory=readFileSync('.next/server/app/regionen.html','utf8');
for(const slug of [...Object.keys(cities),'pinneberg','tangstedt'])assert.ok(directory.includes('href="/regionen/'+slug+'"'),slug+' discoverable');
const district=readFileSync('.next/server/app/regionen/pinneberg.html','utf8');assert.ok(district.includes('nicht allein für die Stadt Pinneberg'));assert.ok(district.includes('<td>233</td>'));
assert.equal(data.cities.hamburg.burglary,2837);assert.equal(data.cities.hamburg.attempts,1433);
assert.ok(!existsSync('.next/server/app/regionen/erfundene-stadt.html'));
console.log('119 city tables verified against extracted BKA records; 121 region links and canonicals checked; district labels verified.');
