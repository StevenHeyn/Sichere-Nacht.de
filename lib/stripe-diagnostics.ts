/** Redacted integration errors. Never log request bodies, customer data or credentials. */
export function logStripeFailure(response:Response,data:unknown){
 const e=(data&&typeof data==='object'&&'error' in data)?(data as {error?:unknown}).error:null;
 const error=e&&typeof e==='object'?e as Record<string,unknown>:{};
 const safe=(x:unknown)=>typeof x==='string'&&/^[A-Za-z0-9_\[\].:-]{1,160}$/.test(x)&&!/(?:sk|rk|pk)_(?:test|live)_|whsec_/.test(x)?x:undefined;
 const message=process.env.VERCEL_ENV==='preview'&&typeof error.message==='string'?error.message.replace(/(?:sk|rk|pk)_(?:test|live)_[A-Za-z0-9_]+|whsec_[A-Za-z0-9_]+|cs_(?:live|test)_[A-Za-z0-9_]+/g,'[REDACTED]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[EMAIL]').replace(/[\r\n]/g,' ').slice(0,420):undefined;
 console.error('Stripe checkout rejected',{status:response.status,code:safe(error.code),type:safe(error.type),param:safe(error.param),requestId:safe(response.headers.get('request-id')),message});
}
