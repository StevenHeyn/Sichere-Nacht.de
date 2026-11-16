import {member,json,failure} from '../../../lib/server';
export async function GET(){try{await member();return json({error:'Bitte die lokale Orts-/PLZ-Suche unter /api/address-map verwenden.'},410)}catch(e){return failure(e)}}
