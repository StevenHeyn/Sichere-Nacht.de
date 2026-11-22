import 'server-only';
import {gunzipSync} from 'node:zlib';
const cache=new Map<string,{at:number;value:any}>();
export async function catalogFile(snapshot:string,path:string){
 if(!/^[a-z0-9-]{8,64}$/.test(snapshot)||!/^(summary\.json\.gz|postcodes\.json\.gz|tiles\/\d+\/\d+\.json\.gz)$/.test(path))throw new Error('Ungültige Katalogdatei');
 const url=`${process.env.SUPABASE_URL}/storage/v1/object/public/vp-address-catalog/${snapshot}/${path}`,hit=cache.get(url);
 if(hit&&Date.now()-hit.at<3600000){cache.delete(url);cache.set(url,hit);return hit.value}
 const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Der gespeicherte Adressbestand ist vorübergehend nicht erreichbar. Bitte erneut versuchen.');
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>12000000)throw new Error('Katalogdatei zu groß');
 const value=JSON.parse(gunzipSync(bytes,{maxOutputLength:80000000}).toString('utf8'));
 cache.set(url,{at:Date.now(),value});if(cache.size>16)cache.delete(cache.keys().next().value!);return value;
}
