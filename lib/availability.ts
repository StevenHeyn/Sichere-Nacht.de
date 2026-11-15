import confirmation from './merchant-availability.json';
export type AvailabilityEvidence={status:'in_stock';confirmedAt:string;validUntil?:string;mode?:'merchant_confirmed'};
// The merchant explicitly confirmed the current catalog as deliverable in 2–4 days.
// This is manually maintained, not measured live stock. New SKUs do not inherit it.
export const availabilityData:Record<string,AvailabilityEvidence>=Object.fromEntries(confirmation.skus.map(sku=>[sku,{status:'in_stock',confirmedAt:confirmation.confirmedAt,mode:'merchant_confirmed'}]));
export function confirmedAvailability(sku:string,now=Date.now(),data:Record<string,AvailabilityEvidence>=availabilityData){
 const entry=data[sku];if(!entry||entry.status!=='in_stock')return null;
 const start=Date.parse(entry.confirmedAt);if(!Number.isFinite(start)||start>now)return null;
 if(entry.mode==='merchant_confirmed'&&entry.validUntil===undefined)return entry;
 const end=Date.parse(entry.validUntil||'');
 return Number.isFinite(end)&&end>now&&end>start&&end-start<=86400000?entry:null;
}
