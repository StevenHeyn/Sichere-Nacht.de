import {unstable_cache} from 'next/cache';
import {body,member,json,failure} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const d=await body(request),{db,account}=await member();if(account.status!=='active')throw new Error('Aktiver Partnerzugang erforderlich.');
 const q=typeof d.query==='string'?d.query.trim():'';if(q.length<3||q.length>160)throw new Error('Bitte Ort oder Straße und Ort eingeben.');
 const permit=await db.rpc('vp_geo_request');if(permit.error||!permit.data)return json({error:'Bitte einige Sekunden warten und erneut suchen.'},429);
 const rows=await searchPlaces(q);
 return json({results:rows.filter(x=>x.address?.country_code==='de').map(x=>({label:String(x.display_name),latitude:Number(x.lat),longitude:Number(x.lon),city:String(x.address.city||x.address.town||x.address.village||x.address.municipality||x.address.county||x.display_name)}))});
}catch(e){return failure(e)}}

const searchPlaces=unstable_cache(async(q:string)=>{
 const u=new URL('https://nominatim.openstreetmap.org/search');for(const [k,v] of Object.entries({q,format:'jsonv2',countrycodes:'de',addressdetails:'1',limit:'8'}))u.searchParams.set(k,v);
 const r=await fetch(u,{headers:{'User-Agent':'SichereNachtPartnerportal/1.0 (bestellungen@sichere-nacht.de)'},next:{revalidate:86400},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Ortssuche gerade nicht verfügbar. Bitte später erneut versuchen.');
 const rows=await r.json();if(!Array.isArray(rows))throw new Error('Ortssuche lieferte keine gültige Antwort.');
 return rows;
},['vp-place-search'],{revalidate:86400});
