/** Bounds are enforced while streaming, not only after buffering attacker input. */
export class RequestSecurityError extends Error {constructor(message:string,public status:number){super(message)}}
export function assertBrowserJson(request:Request){
 const origin=request.headers.get('origin');
 if(request.headers.get('sec-fetch-site')==='cross-site')throw new RequestSecurityError('Anfrage von fremder Website nicht erlaubt.',403);
 if(origin){let matches=false;try{matches=new URL(origin).origin===new URL(request.url).origin}catch{}if(!matches||origin==='null')throw new RequestSecurityError('Ungültiger Anfrageursprung.',403);}
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new RequestSecurityError('JSON-Anfrage erforderlich.',415);
}
export async function readLimitedText(request:Request,maxBytes:number,timeoutMs=10000):Promise<string>{
 const length=request.headers.get('content-length');
 if(length&&(!/^\d+$/.test(length)||Number(length)>maxBytes))throw new RequestSecurityError('Anfrage zu groß.',413);
 if(!request.body)return '';
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0,timer:ReturnType<typeof setTimeout>|undefined;
 const expired=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new RequestSecurityError('Anfrage hat zu lange gedauert.',408)),timeoutMs)});
 try{while(true){const {done,value}=await Promise.race([reader.read(),expired]);if(done)break;size+=value.byteLength;if(size>maxBytes)throw new RequestSecurityError('Anfrage zu groß.',413);chunks.push(value)}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}
 catch(e){void reader.cancel().catch(()=>{});if(e instanceof RequestSecurityError)throw e;throw new RequestSecurityError('Ungültige Anfrage.',400)}finally{clearTimeout(timer);reader.releaseLock()}
}
export function securityStatus(e:unknown){return e instanceof RequestSecurityError?e.status:400}
