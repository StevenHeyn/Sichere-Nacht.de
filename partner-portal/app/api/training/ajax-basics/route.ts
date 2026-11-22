import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {member,failure,json} from '../../../../lib/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const {account}=await member();
 if(account.status!=='active')return json({error:'Aktiver Partnerzugang erforderlich.'},403);
 const pdf=await readFile(path.join(process.cwd(),'assets/training/ajax-technisches-basiswissen.pdf'));
 const disposition=new URL(request.url).searchParams.get('download')==='1'?'attachment':'inline';
 return new Response(new Uint8Array(pdf),{headers:{'content-type':'application/pdf','content-disposition':disposition+'; filename="Ajax-Technisches-Basiswissen.pdf"','cache-control':'private, no-store','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'}});
 }catch(e){return failure(e)}}
