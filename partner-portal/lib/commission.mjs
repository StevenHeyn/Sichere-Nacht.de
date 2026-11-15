export function commissionPreview({netCents,agency=false,underAgency=false,reserveCents=0}){
 for(const n of [netCents,reserveCents])if(!Number.isSafeInteger(n)||n<0)throw new Error('Non-negative integer cents required');
 if(reserveCents>250000)throw new Error('Reserve exceeds cap');
 const roundRatio=(n,num,den)=>Number((BigInt(n)*BigInt(num)+BigInt(Math.floor(den/2)))/BigInt(den));
 const rate=agency||underAgency?2000:1500,earnerRate=underAgency?1500:rate;
 const commission=roundRatio(netCents,rate,10000),earnerCommission=roundRatio(netCents,earnerRate,10000);
 const withheld=Math.min(roundRatio(earnerCommission,5,100),250000-reserveCents);
 return {rateBps:rate,earnerRateBps:earnerRate,commissionCents:commission,earnerCommissionCents:earnerCommission,agencyDifferenceCents:commission-earnerCommission,reserveWithheldCents:withheld,payableCents:commission-withheld,nextReserveCents:reserveCents+withheld};
}
export function settlementDate(month){if(!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month))throw new Error('Calendar month required');const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m+1,0)).toISOString().slice(0,10)}
export function berlinMonth(date){const d=new Date(date);if(!Number.isFinite(d.getTime()))throw new Error('Invalid date');const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit'}).formatToParts(d);return p.find(x=>x.type==='year').value+'-'+p.find(x=>x.type==='month').value}
export function reserveReleaseDate(date){const d=new Date(date);if(!Number.isFinite(d.getTime()))throw new Error('Invalid date');const y=d.getUTCFullYear()+1,m=d.getUTCMonth(),day=Math.min(d.getUTCDate(),new Date(Date.UTC(y,m+1,0)).getUTCDate());return new Date(Date.UTC(y,m,day,d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds())).toISOString()}
