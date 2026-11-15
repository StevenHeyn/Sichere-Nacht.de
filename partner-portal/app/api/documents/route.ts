import {randomUUID} from 'node:crypto';
import {member,sameOrigin,json,failure} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 sameOrigin(request);const {db,user,account}=await member();if(!['onboarding','pending'].includes(account.status))throw new Error('Dokumente können nur während der Antragsprüfung ergänzt werden.');
 if(Number(request.headers.get('content-length')||0)>3500000)throw new Error('Maximal 3 MB pro Datei.');
 const form=await request.formData(),file=form.get('file'),kind=form.get('kind');
 if(!(file instanceof File)||!['portrait','trade_proof'].includes(String(kind))||file.size<1||file.size>3*1024*1024)throw new Error('Bild oder PDF mit maximal 3 MB auswählen.');
 const bytes=Buffer.from(await file.arrayBuffer());let mime='',ext='';
 if(bytes.subarray(0,3).equals(Buffer.from([255,216,255]))){mime='image/jpeg';ext='jpg'}else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';ext='png'}else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'){mime='image/webp';ext='webp'}else if(bytes.subarray(0,5).toString()==='%PDF-'){mime='application/pdf';ext='pdf'}
 if(!mime||(kind==='portrait'&&mime==='application/pdf'))throw new Error('Dateiformat nicht erlaubt. Portrait als JPEG, PNG oder WebP; Nachweis zusätzlich als PDF.');
 const path=user.id+'/'+kind+'/'+randomUUID()+'.'+ext;
 const uploaded=await db.storage.from('vp-private').upload(path,bytes,{contentType:mime,upsert:false});if(uploaded.error)throw new Error('Geschützte Ablage fehlgeschlagen.');
 const saved=await db.rpc('vp_register_document',{p_kind:kind,p_path:path,p_mime:mime,p_bytes:bytes.length});if(saved.error)throw new Error('Datei abgelegt, Zuordnung fehlgeschlagen. Bitte Administration informieren.');
 return json({ok:true,id:saved.data});
 }catch(e){return failure(e)}}
export async function GET(request:Request){try{const {db}=await member(),id=new URL(request.url).searchParams.get('id');if(!id)throw new Error('Dokumentreferenz fehlt.');const r=await db.from('vp_documents').select('path,kind,mime').eq('id',id).single();if(r.error||!r.data)throw new Error('Kein Zugriff auf dieses Dokument.');const ext=r.data.mime==='application/pdf'?'pdf':r.data.mime.split('/')[1];const signed=await db.storage.from('vp-private').createSignedUrl(r.data.path,60,{download:r.data.kind+'.'+ext});if(signed.error)throw new Error('Dateifreigabe fehlgeschlagen.');return json({url:signed.data.signedUrl,expiresIn:60});}catch(e){return failure(e)}}
