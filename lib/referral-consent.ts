export const REFERRAL_KEY='sichere-nacht-referral-v2';
export const REFERRAL_POLICY='2026-11-14-v1';
export const REFERRAL_DAYS=30;
export type ReferralConsent={vpId:string;consentedAt:number;expiresAt:number;policy:typeof REFERRAL_POLICY};
export function validPartner(value:unknown):value is string{return typeof value==='string'&&/^VP-[A-Z0-9]{3,16}$/.test(value)}
export function parseReferral(value:unknown,now=Date.now()):ReferralConsent|null{
 if(!value||typeof value!=='object')return null;const r=value as ReferralConsent;
 return validPartner(r.vpId)&&r.policy===REFERRAL_POLICY&&Number.isFinite(r.consentedAt)&&Number.isFinite(r.expiresAt)&&r.consentedAt<=now&&r.expiresAt>now&&r.expiresAt-r.consentedAt<=REFERRAL_DAYS*86400000?r:null;
}
export function approvedReferral():ReferralConsent|null{
 if(typeof window==='undefined')return null;
 try{return parseReferral(JSON.parse(localStorage.getItem(REFERRAL_KEY)||'null'))}catch{return null}
}
export function storeReferral(vpId:string){if(!validPartner(vpId))throw new Error('Ungültige Partnerkennung');const now=Date.now();localStorage.setItem(REFERRAL_KEY,JSON.stringify({vpId,policy:REFERRAL_POLICY,consentedAt:now,expiresAt:now+REFERRAL_DAYS*86400000}));window.dispatchEvent(new Event('sn-referral-updated'))}
export function revokeReferral(){localStorage.removeItem(REFERRAL_KEY);try{const key='sichere-nacht-cart-v1',raw=localStorage.getItem(key);if(raw){const c=JSON.parse(raw);c.vpId='';localStorage.setItem(key,JSON.stringify(c))}}catch{/* Keep unrelated cart information. */}window.dispatchEvent(new Event('sn-referral-updated'))}
