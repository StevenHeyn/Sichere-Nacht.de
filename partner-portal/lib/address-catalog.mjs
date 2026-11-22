export const TILE_ZOOM=12;
export function tileOf(longitude,latitude,zoom=TILE_ZOOM){const n=2**zoom,r=latitude*Math.PI/180;return {x:Math.floor((longitude+180)/360*n),y:Math.floor((1-Math.asinh(Math.tan(r))/Math.PI)/2*n)}}
export function parseBounds(raw){const b=String(raw||'').split(',').map(Number);if(b.length!==4||b.some(v=>!Number.isFinite(v))||b[0]<5||b[2]>16||b[1]<47||b[3]>56||b[0]>=b[2]||b[1]>=b[3])throw new Error('Ungültiger Kartenausschnitt');return b}
export function tileKeys(b){const nw=tileOf(b[0],b[3]),se=tileOf(b[2],b[1]),keys=[];for(let x=nw.x;x<=se.x;x++)for(let y=nw.y;y<=se.y;y++)keys.push({x,y});return keys}
export function decodePoint(r){return {source_key:r[0],street:r[1],house_number:r[2],city:r[3],postal_code:r[4],longitude:r[5],latitude:r[6],status:'new',blocked:false,...tileOf(r[5],r[6])}}
export function inBounds(p,b){return p.longitude>=b[0]&&p.longitude<=b[2]&&p.latitude>=b[1]&&p.latitude<=b[3]}
export function mergePoints(base,edits){
 const bySource=new Map(edits.map(p=>[p.source_key,p])),byName=new Map(),remaining=new Map(edits.map(p=>[p.id,p])),seen=new Set();
 const name=p=>p.street.toLocaleLowerCase('de-DE')+'|'+p.house_number.toLocaleLowerCase('de-DE');
 for(const e of edits){const key=name(e);byName.set(key,[...(byName.get(key)||[]),e])}
 const result=[];
 for(const p of base){const existing=bySource.get(p.source_key)||(byName.get(name(p))||[]).find(e=>(!e.postal_code||!p.postal_code||e.postal_code===p.postal_code)&&Math.abs(e.longitude-p.longitude)<.0006&&Math.abs(e.latitude-p.latitude)<.0006);if(existing){remaining.delete(existing.id);if(!seen.has(existing.id)){result.push({...p,...existing});seen.add(existing.id)}}else result.push(p)}
 return [...result,...remaining.values()];
}
export function clustersFor(summary,b,zoom){const groups=new Map();const z=Math.max(3,Math.min(12,zoom-1));for(const p of summary){if(!inBounds(p,b))continue;const t=tileOf(p.longitude,p.latitude,z),key=t.x+'/'+t.y,g=groups.get(key)||{count:0,longitude:0,latitude:0};g.count+=p.count;g.longitude+=p.longitude*p.count;g.latitude+=p.latitude*p.count;groups.set(key,g)}return [...groups.values()].map(g=>({...g,longitude:g.longitude/g.count,latitude:g.latitude/g.count}))}
