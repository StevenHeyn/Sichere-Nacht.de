/** Shop-local identity. Never changes the shared Stripe account settings. */
export const STRIPE_SHOP_ID='sichere-nacht';
export const STRIPE_SHOP_NAME='Sichere Nacht';
export function applyCheckoutBranding(parameters:URLSearchParams,mode:'hosted'|'embedded'|'form'='form'):void{
 // The actual Stripe form SDK rejects branding_settings. The shop's own header
 // renders Sichere Nacht. Other integrations must opt into supported modes.
 if(mode==='form')parameters.delete('branding_settings[display_name]');
 else parameters.set('branding_settings[display_name]',STRIPE_SHOP_NAME);
}
export function isSichereNachtCheckout(value:unknown):boolean{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const metadata=(value as {metadata?:unknown}).metadata;
 if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))return false;
 const fields=metadata as Record<string,unknown>;
 return fields.shop===STRIPE_SHOP_ID&&(fields.diagnostic===undefined||fields.diagnostic==='');
}
