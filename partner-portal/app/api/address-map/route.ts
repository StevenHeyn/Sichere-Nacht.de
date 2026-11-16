import {member,json,failure,body} from '../../../lib/server';
import {catalogFile} from '../../../lib/address-catalog-server';
import {parseBounds,tileKeys,decodePoint,inBounds,mergePoints,clustersFor} from '../../../lib/address-catalog.mjs';
export const dynamic='force-dynamic';export const maxDuration=60;
export async function GET(request:Request){try{
 const {db,account}=await member();if(account.status!=='active')throw new Error('Aktiver Partnerzugang erforderlich');
 const params=new URL(request.url).searchParams;
 const snapshotResult=await db.from('vp_address_snapshots').select('id,source_at,address_count,verified_at,total_bytes').eq('active',true).maybeSingle();
 if(snapshotResult.error)throw new Error('Adresskatalog konnte nicht geprüft werden');
 const snapshot=snapshotResult.data;
 if(params.has('search')){
  const q=(params.get('search')||'').trim().toLocaleLowerCase('de-DE').slice(0,100);if(q.length<2)return json({places:[],snapshot});
  if(!snapshot)return json({places:[],snapshot});
  const postcodes=await catalogFile(snapshot.id,'postcodes.json.gz');
  const places=postcodes.filter((p:any)=>p.postcode.startsWith(q)||p.cities.some((c:string)=>c.toLocaleLowerCase('de-DE').includes(q))).sort((a:any,b:any)=>a.postcode.localeCompare(b.postcode)).slice(0,20);
  return json({places,snapshot});
 }
 const b=parseBounds(params.get('bbox')),zoom=Number(params.get('zoom')||6);
 if(!Number.isInteger(zoom)||zoom<3||zoom>20)throw new Error('Ungültige Zoomstufe');
 const edits=await db.rpc('vp_map_overlays',{p_west:b[0],p_south:b[1],p_east:b[2],p_north:b[3]});if(edits.error)throw new Error('Bearbeitungsstände konnten nicht geladen werden');
 const overlays=edits.data||[];
 if(!snapshot)return json({snapshot:null,points:overlays.slice(0,1500),clusters:[],truncated:overlays.length>1500,message:'Deutschland-Bestand wird vorbereitet. Bereits gespeicherte Adressen bleiben verfügbar.'});
 const keys=tileKeys(b);
 if(zoom<14||keys.length>12){const summary=await catalogFile(snapshot.id,'summary.json.gz');return json({snapshot,points:overlays.slice(0,500),clusters:clustersFor(summary,b,zoom),truncated:overlays.length>500,message:'Zum Bearbeiten näher heranzoomen oder einen Ort suchen.'})}
 const summary=await catalogFile(snapshot.id,'summary.json.gz'),available=new Set(summary.map((p:any)=>p.x+'/'+p.y));
 const blocks=await Promise.all(keys.filter((k:any)=>available.has(k.x+'/'+k.y)).map((k:any)=>catalogFile(snapshot.id,`tiles/${k.x}/${k.y}.json.gz`)));
 const base=blocks.flatMap((rows:any[])=>rows.map(decodePoint).filter((p:any)=>inBounds(p,b)));
 const merged=mergePoints(base,overlays);const q=(params.get('q')||'').trim().toLocaleLowerCase('de-DE').slice(0,100),status=params.get('status');
 const filtered=merged.filter((p:any)=>(!q||`${p.street} ${p.house_number} ${p.postal_code} ${p.city}`.toLocaleLowerCase('de-DE').includes(q))&&(!status||p.status===status));
 return json({snapshot,points:filtered.slice(0,1500),clusters:[],truncated:filtered.length>1500||overlays.length>2000,total:filtered.length,message:filtered.length>1500?'Viele Adressen in diesem Ausschnitt. Bitte weiter heranzoomen.':''});
}catch(e){return failure(e)}}
export async function POST(request:Request){try{
 const input=await body(request),{db,account}=await member();if(account.status!=='active')throw new Error('Aktiver Partnerzugang erforderlich');
 const {data}=await db.auth.getSession();
 const r=await fetch(`${process.env.SUPABASE_URL}/functions/v1/address-catalog`,{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+data.session?.access_token},body:JSON.stringify({x:input.x,y:input.y,key:input.source_key}),signal:AbortSignal.timeout(30000)});
 const result=await r.json();if(!r.ok)throw new Error(result.error||'Adresse konnte nicht geöffnet werden');return json(result);
}catch(e){return failure(e)}}
