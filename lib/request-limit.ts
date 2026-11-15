import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';
const limits={contact:5,checkout:20,widerruf:10} as const;
export async function requestLimit(request:Request,scope:keyof typeof limits):Promise<Response|null>{
 const reply=(status:number,retry:number,error:string)=>Response.json({error},{status,headers:{'cache-control':'no-store','Retry-After':String(retry)}});
 const unavailable=()=>reply(503,30,'Anfrageprüfung momentan nicht verfügbar. Bitte in 30 Sekunden erneut versuchen oder bestellungen@sichere-nacht.de kontaktieren.');
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.SUPABASE_URL;
 // Only trust the header overwritten by the hosting platform. Never trust a body/session IP.
 const ip=process.env.VERCEL==='1'?request.headers.get('x-vercel-forwarded-for')?.trim():process.env.NODE_ENV==='development'?'127.0.0.1':undefined;
 if(!key||!url||!ip||!isIP(ip))return unavailable();
 // Canonicalize IPv6 spellings; store neither raw IP nor browser identifiers.
 const normalized=isIP(ip)===6?new URL('http://['+ip+']/').hostname:ip;
 const bucket=createHmac('sha256',key).update('sn-request-limit-v1\n'+scope+'\n'+normalized).digest('hex');
 try{
  const endpoint=new URL('/rest/v1/rpc/shop_take_request_slot',url);if(endpoint.protocol!=='https:')return unavailable();
  const r=await fetch(endpoint,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify({p_key:bucket,p_limit:limits[scope],p_seconds:600}),cache:'no-store',signal:AbortSignal.timeout(4000)});
  if(!r.ok)return unavailable();const data=await r.json();
  if(typeof data?.allowed!=='boolean'||!Number.isInteger(data.retry_after)||data.retry_after<1||data.retry_after>600)return unavailable();
  return data.allowed?null:reply(429,data.retry_after,'Zu viele Anfragen. Bitte nach der angegebenen Wartezeit erneut versuchen. Alternativ: bestellungen@sichere-nacht.de.');
 }catch{return unavailable();}
}
