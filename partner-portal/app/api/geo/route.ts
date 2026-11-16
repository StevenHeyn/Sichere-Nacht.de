import {member,json,failure} from '../../../lib/server';
export async function POST(){try{await member();return json({error:'Einzelimporte wurden durch den gespeicherten Deutschland-Katalog ersetzt.'},410)}catch(e){return failure(e)}}
