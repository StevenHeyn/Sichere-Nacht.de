type Details={name?:string|null;address?:Record<string,unknown>|null};
/** Do not silently reuse billing contact details for a different shipping recipient. */
export function stripeShipping(session:{collected_information?:{shipping_details?:Details|null}|null;shipping_details?:Details|null}){
 const details=session.collected_information?.shipping_details??session.shipping_details;
 return {name:typeof details?.name==='string'&&details.name.trim()?details.name.trim():null,address:details?.address??null};
}
