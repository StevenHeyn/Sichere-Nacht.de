import {unstable_cache} from 'next/cache';
export const resolvePostalArea=unstable_cache(async(postalCode:string)=>{
 if(!/^\d{5}$/.test(postalCode))throw new Error('Bitte eine fünfstellige deutsche PLZ eingeben.');
 const url=new URL('https://nominatim.openstreetmap.org/search');
 for(const [key,value] of Object.entries({postalcode:postalCode,country:'Germany',countrycodes:'de',format:'jsonv2',addressdetails:'1',limit:'5'}))url.searchParams.set(key,value);
 const response=await fetch(url,{headers:{'User-Agent':'SichereNachtPartnerportal/1.0 (bestellungen@sichere-nacht.de)'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('PLZ-Suche momentan nicht verfügbar. Bitte später erneut versuchen.');
 const rows=await response.json();const place=Array.isArray(rows)?rows.find((p:any)=>p.address?.country_code==='de'&&p.address?.postcode===postalCode):null;
 if(!place)throw new Error('PLZ konnte nicht eindeutig gefunden werden. Bitte prüfen.');
 const latitude=Number(place.lat),longitude=Number(place.lon),locality=String(place.address.city||place.address.town||place.address.village||place.address.municipality||place.address.county||postalCode);
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<47||latitude>56||longitude<5||longitude>16)throw new Error('Ungültiger PLZ-Ort.');
 return {latitude,longitude,locality};
},['installer-postal-centres-v1'],{revalidate:604800});
