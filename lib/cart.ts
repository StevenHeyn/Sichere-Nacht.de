export type CartLine={sku:string;quantity:number};
export type CartDraft={version:1;items:CartLine[];installation:boolean;installationZip:string;source:'konfigurator'|'shop';updatedAt:string};
export const CART_KEY='sichere-nacht-cart-v1';
export const MAX_QTY=30;
export function normalizeLines(lines:CartLine[]):CartLine[]{
 const sums=new Map<string,number>();
 for(const line of lines){if(!line||typeof line.sku!=='string')continue;const sku=line.sku.trim();const qty=Math.floor(Number(line.quantity));if(!sku||!Number.isFinite(qty)||qty<=0)continue;sums.set(sku,Math.min(MAX_QTY,(sums.get(sku)||0)+qty));}
 return [...sums].map(([sku,quantity])=>({sku,quantity}));
}
export function loadCart():CartDraft{
 const empty:CartDraft={version:1,items:[],installation:false,installationZip:'',source:'shop',updatedAt:''};
 if(typeof window==='undefined')return empty;
 try{const raw=localStorage.getItem(CART_KEY);if(!raw)return empty;const v=JSON.parse(raw);if(v?.version!==1||!Array.isArray(v.items))return empty;
 return {...empty,items:normalizeLines(v.items),installation:v.installation===true,installationZip:typeof v.installationZip==='string'?v.installationZip.slice(0,5):'',source:v.source==='konfigurator'?'konfigurator':'shop',updatedAt:typeof v.updatedAt==='string'?v.updatedAt:''};
 }catch{return empty;}
}
export function saveCart(draft:Omit<CartDraft,'version'|'updatedAt'>){
 const value:CartDraft={...draft,version:1,updatedAt:new Date().toISOString(),items:normalizeLines(draft.items)};
 localStorage.setItem(CART_KEY,JSON.stringify(value));window.dispatchEvent(new Event('sichere-nacht-cart-updated'));
 return value;
}
