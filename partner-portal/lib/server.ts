import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
export function configured(){return Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY)}
export async function client(){
 if(!configured())throw new Error('Portal-Datenverbindung noch nicht eingerichtet.');
 const jar=await cookies();
 return createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_PUBLISHABLE_KEY!,{cookieOptions:{name:'sn-vp-auth',httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'},cookies:{getAll:()=>jar.getAll(),setAll:values=>{for(const c of values)jar.set(c.name,c.value,{...c.options,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'})}}});
}
export const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'cache-control':'private, no-store, max-age=0','vary':'Cookie','referrer-policy':'no-referrer'}});
export function sameOrigin(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new Error('Ungültiger Anfrageursprung.');}
export async function body(request:Request){sameOrigin(request);if(Number(request.headers.get('content-length')||0)>24000)throw new Error('Anfrage zu groß.');const raw=await request.text();if(raw.length>24000)throw new Error('Anfrage zu groß.');const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Ungültige Anfrage.');return data as Record<string,unknown>;}
export class SignInRequired extends Error {}
export async function member(){const db=await client();const {data,error}=await db.auth.getUser();if(error||!data.user||!data.user.email_confirmed_at)throw new SignInRequired('Anmeldung mit bestätigter E-Mail erforderlich.');const result=await db.rpc('vp_ensure_account');if(result.error)throw new Error('Partnerkonto konnte nicht geladen werden. Bitte erneut versuchen.');return {db,user:data.user,account:result.data};}
export function failure(e:unknown){const message=e instanceof Error?e.message:'Anfrage konnte nicht verarbeitet werden.';return json({error:message.slice(0,450)},/Anmeldung|Anfrageursprung/.test(message)?401:400)}
