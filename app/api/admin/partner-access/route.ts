import {NextResponse} from 'next/server';
import {hasOrdersAdminAccess} from '../../../../lib/admin-auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'cache-control':'private, no-store','referrer-policy':'no-referrer'};
export async function POST(request:Request){
 if(!hasOrdersAdminAccess(request))return NextResponse.json({error:'Nicht autorisiert'},{status:401,headers});
 if(!['https://sichere-nacht.de','https://www.sichere-nacht.de'].includes(request.headers.get('origin')||''))return NextResponse.json({error:'Bitte die interne Shopverwaltung verwenden.'},{status:403,headers});
 const raw=await request.text();if(raw.length>1000)return NextResponse.json({error:'Anfrage zu groß.'},{status:413,headers});
 let body;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:'Ungültige Anfrage.'},{status:400,headers})}
 if(body?.action!=='grant_portal_admin'||body?.confirm!==true||typeof body.email!=='string'||!/^\S+@\S+\.\S+$/.test(body.email)||body.email.length>200)return NextResponse.json({error:'Bestätigte Konto-E-Mail und ausdrückliche Adminfreigabe erforderlich.'},{status:400,headers});
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!base||!key)return NextResponse.json({error:'Interne Datenbankverbindung fehlt.'},{status:503,headers});
 const r=await fetch(new URL('/rest/v1/rpc/vp_bootstrap_admin',base),{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify({p_email:body.email.trim().toLowerCase()}),cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!r.ok)return NextResponse.json({error:'Freigabe fehlgeschlagen. Zuerst im Partnerportal ein eigenes Konto erstellen und die E-Mail bestätigen; andernfalls Datenbankprotokoll prüfen.'},{status:409,headers});
 return NextResponse.json({ok:true,message:'Das bestätigte Partnerkonto hat jetzt Adminrechte. Im Partnerportal neu laden. Der Shop-Adminschlüssel wurde nicht übertragen.'},{headers});
}
