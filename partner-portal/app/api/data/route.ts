import {client,configured,member,json,failure,SignInRequired} from '../../../lib/server';
import {commercialPolicy} from '../../../lib/commercial-policy';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 if(!configured())return json({configured:false,settings:{registration_open:false,d2d_open:false,settlement_open:false},terms:null});
 const db0=await client(),settings=await db0.from('vp_settings').select('registration_open,d2d_open,settlement_open,claim_days,cooldown_days').single(),terms=await db0.from('vp_terms').select('id,version,title,body,content_hash,published_at').eq('status','published').maybeSingle();
 if(settings.error||terms.error){console.error('Portal configuration lookup failed',{settingsCode:settings.error?.code,termsCode:terms.error?.code});return json({error:'Die Portalverbindung ist vorübergehend nicht verfügbar. Bitte später erneut versuchen.'},503);}
 let m;try{m=await member()}catch(e){if(e instanceof SignInRequired)return json({configured:true,settings:settings.data,terms:terms.data,account:null});throw e;}
 const {db,account}=m,view=new URL(request.url).searchParams.get('view')||'overview';
 const documents=await db.from('vp_documents').select('id,kind,bytes,created_at').eq('user_id',account.user_id);
 const result:Record<string,unknown>={configured:true,settings:settings.data,terms:terms.data,account,documents:documents.data||[]};
 if(account.status!=='active')return json(result);
 result.commercialPolicy=commercialPolicy(account.role);
 async function query(name:string,q:PromiseLike<{data:unknown;error:unknown}>){const r=await q;if(r.error)throw new Error('Datenbereich '+name+' konnte nicht geladen werden.');result[name]=r.data}
 if(view==='overview'||view==='finance'){
 await query('earnings',db.from('vp_earnings').select('*').order('order_at',{ascending:false}).limit(200));await query('reserves',db.from('vp_reserves').select('*'));await query('statements',db.from('vp_statements').select('*').order('period',{ascending:false}).limit(100));await query('finance_lines',db.from('vp_finance_lines').select('*').order('created_at',{ascending:false}).limit(300));await query('reserve_releases',db.from('vp_reserve_releases').select('*').limit(100));
 }
 if(view==='training'||view==='overview'){
 await query('courses',db.from('vp_courses').select('*').order('created_at',{ascending:false}));await query('slots',db.rpc('vp_training_availability'));await query('bookings',db.from('vp_training_bookings').select('*').limit(300));
 }
 if(view==='agency'){await query('roster',db.rpc('vp_roster'));await query('invitations',db.from('vp_invitations').select('id,full_name,email,expires_at,accepted_by,created_at').order('created_at',{ascending:false}).limit(100))}
 if(view==='merch'){await query('products',db.from('vp_merch_products').select('*').eq('active',true));await query('merch_orders',db.from('vp_merch_orders').select('*').order('created_at',{ascending:false}).limit(100))}
 if(view==='d2d'){
 await query('territories',db.from('vp_territories').select('*').order('label'));
 const areaId=new URL(request.url).searchParams.get('area'),areas=result.territories as Array<Record<string,unknown>>,area=areas.find(a=>a.id===areaId);
 if(area){const offset=Math.max(0,Math.min(100000,Math.floor(Number(new URL(request.url).searchParams.get('offset'))||0)));await query('addresses',db.from('vp_addresses').select('*').gte('longitude',Number(area.west)).lte('longitude',Number(area.east)).gte('latitude',Number(area.south)).lte('latitude',Number(area.north)).order('street').order('house_number').order('id').range(offset,offset+199));result.addressOffset=offset;result.areaId=area.id;}
 const addressId=new URL(request.url).searchParams.get('address');if(addressId){await query('contacts',db.from('vp_d2d_contacts').select('*').eq('address_id',addressId));const ids=(result.contacts as Array<{id:string}>).map(x=>x.id);if(ids.length)await query('contact_evidence',db.from('vp_contact_evidence').select('id,contact_id,phone_permission,email_permission,recorded_at,retain_until,last_use_at').in('contact_id',ids));}
 }
 if(view==='admin'){
 if(account.role!=='admin')throw new Error('Adminzugang erforderlich.');await query('accounts',db.from('vp_accounts').select('*').order('created_at',{ascending:false}).limit(300));await query('admin_documents',db.from('vp_documents').select('id,user_id,kind,bytes,created_at').limit(500));await query('courses',db.from('vp_courses').select('*'));await query('slots',db.rpc('vp_training_availability'));await query('bookings',db.from('vp_training_bookings').select('*').limit(500));await query('merch_orders',db.from('vp_merch_orders').select('*').order('created_at',{ascending:false}).limit(100));await query('earnings',db.from('vp_earnings').select('*').order('order_at',{ascending:false}).limit(300));await query('statements',db.from('vp_statements').select('*').order('period',{ascending:false}).limit(100));await query('reserves',db.from('vp_reserves').select('*'));await query('audit',db.from('vp_audit').select('id,actor,event,target,created_at').order('created_at',{ascending:false}).limit(100));
 }
 return json(result);
 }catch(e){return failure(e)}}
