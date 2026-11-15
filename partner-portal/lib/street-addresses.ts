import {OSM_SOURCE} from './germany-addresses';
export {OSM_SOURCE};
export function streetSelection(street:unknown,postalCode:unknown){
 if(typeof street!=='string'||typeof postalCode!=='string'||!/^\d{5}$/.test(postalCode))throw new Error('Straße und fünfstellige Postleitzahl eingeben.');
 const name=street.trim();if(name.length<3||name.length>160||/[\x00-\x1f]/.test(name))throw new Error('Gültigen Straßennamen eingeben.');
 return {street:name,postalCode};
}
export async function getStreetAddresses(street:unknown,postalCode:unknown){
 const s=streetSelection(street,postalCode),pattern='^'+s.street.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$';
 const quoted=JSON.stringify(pattern),postcode=JSON.stringify(s.postalCode);
 const query=`[out:json][timeout:15];area["boundary"="postal_code"]["postal_code"=${postcode}]->.zip;nwr(area.zip)["addr:street"~${quoted},i]["addr:housenumber"];out center 5001;`;
 let r:Response|undefined;
 for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
  try{const response=await fetch(endpoint+'?data='+encodeURIComponent(query),{headers:{'User-Agent':'SichereNachtPartnerportal/1.0 (bestellungen@sichere-nacht.de)','Accept':'application/json'},next:{revalidate:86400},signal:AbortSignal.timeout(20000)});if(response.ok){r=response;break}}catch{}
 }
 if(!r)throw new Error('Der Adressdienst antwortet derzeit nicht. Bitte die Straßensuche erneut versuchen. Es wurden keine leeren Adressdaten gespeichert.');
 const text=await r.text();if(text.length>12000000)throw new Error('Adressantwort zu groß. Die Straße wurde nicht als vollständig importiert markiert.');
 const data=JSON.parse(text);if(data.remark||!Array.isArray(data.elements))throw new Error('Straßenabfrage abgebrochen. Bitte erneut versuchen.');
 if(data.elements.length>5000)throw new Error('Über 5.000 Adressobjekte. Keine gekürzte Straßenliste übernommen; bitte Administration kontaktieren.');
 const rows=data.elements.flatMap((e:Record<string,any>)=>{
  const tags=e.tags||{},lat=Number(e.lat??e.center?.lat),lon=Number(e.lon??e.center?.lon);
  if(String(tags['addr:street']||'').toLocaleLowerCase('de-DE')!==s.street.toLocaleLowerCase('de-DE')||!tags['addr:housenumber']||(tags['addr:postcode']&&tags['addr:postcode']!==s.postalCode)||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<47||lat>56||lon<5||lon>16)return [];
  return [{source_key:`osm:${e.type}:${e.id}`,street:String(tags['addr:street']),house_number:String(tags['addr:housenumber']),city:String(tags['addr:city']||'PLZ '+s.postalCode),postal_code:s.postalCode,longitude:lon,latitude:lat}];
 });
 if(!rows.length)throw new Error('Keine Adresspunkte für diese Straße und PLZ gefunden. Schreibweise und PLZ prüfen; die Datenquelle kann Lücken haben.');
 const west=Math.min(...rows.map((x:Record<string,any>)=>x.longitude)),east=Math.max(...rows.map((x:Record<string,any>)=>x.longitude)),south=Math.min(...rows.map((x:Record<string,any>)=>x.latitude)),north=Math.max(...rows.map((x:Record<string,any>)=>x.latitude));
 return {...s,rows,bbox:[Math.max(5,west-.00001),Math.max(47,south-.00001),Math.min(16,east+.00001),Math.min(56,north+.00001)]};
}
