export const OSM_SOURCE='OpenStreetMap contributors / ODbL';
export async function getGermanyAddresses(t:Record<string,any>){
 const b=[t.south,t.west,t.north,t.east].map(Number);if(b.some(n=>!Number.isFinite(n))||b[2]-b[0]>.03||b[3]-b[1]>.04)throw new Error('Bitte einen kleineren Gebietsausschnitt wählen.');
 const query=`[out:json][timeout:25];nwr["addr:housenumber"]["addr:street"](${b.join(',')});out center 501;`;
 const url='https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query);
 const r=await fetch(url,{headers:{'User-Agent':'SichereNachtPartnerportal/1.0 (bestellungen@sichere-nacht.de)'},next:{revalidate:86400},signal:AbortSignal.timeout(35000)});
 if(!r.ok)throw new Error('Der Adressdienst ist ausgelastet. Bitte später erneut versuchen.');
 const text=await r.text();if(text.length>4000000)throw new Error('Bitte einen kleineren Gebietsausschnitt wählen.');
 const data=JSON.parse(text);if(data.remark||!Array.isArray(data.elements))throw new Error('Adressabfrage nicht vollständig abgeschlossen. Bitte später erneut versuchen.');
 if(data.elements.length>500)throw new Error('Mehr als 500 Adresspunkte: Bitte einen kleineren Ausschnitt auswählen.');
 return data.elements.map((e:Record<string,any>)=>({source_key:`osm:${e.type}:${e.id}`,street:String(e.tags['addr:street']),house_number:String(e.tags['addr:housenumber']),city:String(e.tags['addr:city']||t.locality||t.label),postal_code:String(e.tags['addr:postcode']||''),longitude:Number(e.lon??e.center?.lon),latitude:Number(e.lat??e.center?.lat)})).filter((a:Record<string,any>)=>a.longitude>=b[1]&&a.longitude<=b[3]&&a.latitude>=b[0]&&a.latitude<=b[2]);
}
