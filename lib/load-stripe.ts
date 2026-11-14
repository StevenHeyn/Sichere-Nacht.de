let loading:Promise<void>|null=null;
/** Load payment code only following a checkout interaction, never on every content page. */
export function loadStripeScript():Promise<void>{
 if(typeof window==='undefined')return Promise.reject(new Error('Zahlungsmaske benötigt einen Browser.'));
 if((window as unknown as {Stripe?:unknown}).Stripe)return Promise.resolve();
 if(loading)return loading;
 loading=new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src='https://js.stripe.com/dahlia/stripe.js';s.async=true;s.id='sn-stripe-sdk';const timer=window.setTimeout(()=>{s.remove();loading=null;reject(new Error('Zahlungsdienst ist nicht rechtzeitig erreichbar.'))},20000);s.onload=()=>{clearTimeout(timer);resolve()};s.onerror=()=>{clearTimeout(timer);s.remove();loading=null;reject(new Error('Zahlungsdienst konnte nicht geladen werden.'))};document.head.appendChild(s)});return loading;
}
