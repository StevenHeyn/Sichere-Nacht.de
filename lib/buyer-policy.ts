/** Purchase-purpose declaration, not an automatic legal determination of consumer status. */
export const BUYER_POLICY_VERSION='2026-11-13-v1';
export type CustomerType='b2c'|'b2b'|'unclassified';
export type BuyerRecord={customer_type:CustomerType;buyer_company:string|null;business_purchase_declared:boolean;buyer_policy_version:string|null;buyer_declared_at:string|null};
export type BuyerInput={customerType:'b2c'|'b2b';company:string;businessPurchaseDeclared:boolean};
export const BUSINESS_DECLARATION='Ich bestelle für das genannte Unternehmen in Ausübung einer gewerblichen oder selbstständigen beruflichen Tätigkeit und nicht überwiegend für private Zwecke.';
export const B2B_WITHDRAWAL_NOTE='Bei einem Kauf als Unternehmer besteht kein gesetzliches Verbraucherwiderrufsrecht. Wir räumen Unternehmern kein freiwilliges Widerrufsrecht ein. Gesetzliche Mängelrechte bleiben unberührt.';
export const B2C_WITHDRAWAL_NOTE='Bei einem Kauf als Verbraucher besteht das gesetzliche Widerrufsrecht nach Maßgabe der Widerrufsbelehrung.';
export const BUYER_PURPOSE_NOTE='Maßgeblich ist der tatsächliche Kaufzweck. Ein Firmenname, eine Lieferadresse oder diese Auswahl allein beseitigen keine gesetzlichen Verbraucherrechte.';
export const customerTypeLabels:Record<CustomerType,string>={b2c:'B2C · Privatkauf',b2b:'B2B · Unternehmenskauf erklärt',unclassified:'Kaufart nicht erfasst / prüfen'};
export const unknownBuyer=():BuyerRecord=>({customer_type:'unclassified',buyer_company:null,business_purchase_declared:false,buyer_policy_version:null,buyer_declared_at:null});
function company(value:unknown):string|null{
 if(typeof value!=='string'||/[\u0000-\u001f\u007f<>]/.test(value))return null;
 const clean=value.trim().replace(/ +/g,' ');return clean.length>=2&&clean.length<=160?clean:null;
}
function timestamp(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value))}
export function validateBuyerInput(value:unknown,now=new Date()):BuyerRecord{
 const input=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
 if(!input||!['b2c','b2b'].includes(String(input.customerType)))throw new Error('Bitte Privatkauf oder geschäftlichen Kauf auswählen.');
 if(!Number.isFinite(now.valueOf()))throw new Error('Zeitpunkt der Kaufarterklärung ungültig.');
 if(input.customerType==='b2c')return {customer_type:'b2c',buyer_company:null,business_purchase_declared:false,buyer_policy_version:BUYER_POLICY_VERSION,buyer_declared_at:now.toISOString()};
 const name=company(input.company);
 if(!name)throw new Error('Bitte den vollständigen Unternehmensnamen mit 2 bis 160 Zeichen angeben.');
 if(input.businessPurchaseDeclared!==true)throw new Error('Bitte den geschäftlichen Kaufzweck ausdrücklich bestätigen.');
 return {customer_type:'b2b',buyer_company:name,business_purchase_declared:true,buyer_policy_version:BUYER_POLICY_VERSION,buyer_declared_at:now.toISOString()};
}
export function applyBuyerMetadata(form:URLSearchParams,buyer:BuyerRecord):void{
 if(buyer.customer_type==='unclassified')throw new Error('Kaufart vor dem Checkout erforderlich.');
 for(const [key,value] of Object.entries(buyer))form.set('metadata['+key+']',value===null?'':String(value));
 form.set('custom_text[submit][message]',buyer.customer_type==='b2b'?B2B_WITHDRAWAL_NOTE:B2C_WITHDRAWAL_NOTE);
}
export function buyerFromStripeMetadata(metadata:unknown):BuyerRecord{
 const m=metadata&&typeof metadata==='object'?metadata as Record<string,unknown>:{};
 if(m.buyer_policy_version!==BUYER_POLICY_VERSION||!timestamp(m.buyer_declared_at))return unknownBuyer();
 if(m.customer_type==='b2c')return {customer_type:'b2c',buyer_company:null,business_purchase_declared:false,buyer_policy_version:BUYER_POLICY_VERSION,buyer_declared_at:m.buyer_declared_at};
 const name=company(m.buyer_company);
 if(m.customer_type==='b2b'&&m.business_purchase_declared==='true'&&name)return {customer_type:'b2b',buyer_company:name,business_purchase_declared:true,buyer_policy_version:BUYER_POLICY_VERSION,buyer_declared_at:m.buyer_declared_at};
 return unknownBuyer();
}
export function documentedBuyerType(row:Partial<BuyerRecord>):CustomerType{
 if(row.customer_type==='b2c')return 'b2c';
 if(row.customer_type==='b2b'&&row.business_purchase_declared===true&&company(row.buyer_company)&&row.buyer_policy_version===BUYER_POLICY_VERSION&&timestamp(row.buyer_declared_at))return 'b2b';
 return 'unclassified';
}
export function documentBuyerName(row:Partial<BuyerRecord>&{customer_name:string|null}):string|null{return documentedBuyerType(row)==='b2b'?row.buyer_company!:row.customer_name}
