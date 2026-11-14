import {createHash,timingSafeEqual} from 'node:crypto';
/** Server-side shared-admin guard. Referral identifiers never authorize administrative access. */
export function hasOrdersAdminAccess(request:Request):boolean{
 const expected=process.env.ORDERS_ADMIN_TOKEN;
 const header=request.headers.get('authorization')||'';
 if(!expected||!header.startsWith('Bearer ')||header.length>4096)return false;
 return timingSafeEqual(createHash('sha256').update(expected).digest(),createHash('sha256').update(header.slice(7)).digest());
}
