/** Only API status and non-personal identifiers enter runtime logs; never request bodies or credentials. */
export function logStripeFailure(response:Response,data:unknown){
 const e=(data&&typeof data==='object'&&'error' in data)?(data as {error?:unknown}).error:null;
 const error=e&&typeof e==='object'?e as Record<string,unknown>:{};
 const safe=(x:unknown)=>typeof x==='string'&&/^[A-Za-z0-9_\[\].:-]{1,160}$/.test(x)&&!/(?:sk|rk|pk)_(?:test|live)_|whsec_/.test(x)?x:undefined;
 console.error('Stripe checkout rejected',{status:response.status,code:safe(error.code),type:safe(error.type),param:safe(error.param),requestId:safe(response.headers.get('request-id'))});
}
