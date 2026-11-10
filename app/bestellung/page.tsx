import Link from 'next/link';
export const metadata={title:'Zahlungsstatus | Sichere Nacht'};
export const dynamic='force-dynamic';

type SessionStatus={id?:string;status?:string;payment_status?:string;livemode?:boolean};
async function getVerifiedPaymentStatus(sessionId:string):Promise<'paid'|'pending'|'unavailable'>{
 const secret=process.env.STRIPE_SECRET_KEY;
 if(process.env.VERCEL_ENV!=='preview'||!secret?.startsWith('sk_test_'))return 'unavailable';
 if(!/^cs_test_[a-zA-Z0-9]{12,}$/.test(sessionId))return 'unavailable';
 try{
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(sessionId),{
   headers:{Authorization:'Bearer '+secret,'Stripe-Version':'2026-03-25.dahlia'},
   cache:'no-store'
  });
  if(!response.ok)return 'unavailable';
  const session=await response.json() as SessionStatus;
  if(session.id!==sessionId||session.livemode!==false)return 'unavailable';
  if(session.status==='complete'&&session.payment_status==='paid')return 'paid';
  return 'pending';
 }catch{return 'unavailable';}
}
export default async function Bestellung({searchParams}:{searchParams:Promise<{session_id?:string}>}){
 const params=await searchParams;
 const sessionId=typeof params.session_id==='string'?params.session_id:'';
 const state=sessionId?await getVerifiedPaymentStatus(sessionId):'unavailable';
 return <main className="wrap" style={{maxWidth:800,paddingBottom:80}}>
  <Link href="/" className="accent">← Startseite</Link>
  <h1>{state==='paid'?'Testzahlung erfolgreich!':state==='pending'?'Zahlung wird geprüft':'Zahlungsstatus'}</h1>
  {state==='paid'?<>
   <p>Stripe hat die Zahlung serverseitig als <strong>bezahlt</strong> bestätigt. Das war eine Testzahlung: Es wurde kein echtes Geld abgebucht.</p>
   <p>Die Bestellung wurde noch nicht automatisch gespeichert oder an den Versand übergeben. Eine verbindliche Bestellbestätigung wird derzeit nicht versendet.</p>
  </>:state==='pending'?<>
   <p>Stripe meldet noch keine abgeschlossene und bezahlte Zahlung. Bei manchen Zahlungsarten dauert die Verarbeitung etwas länger.</p>
   <p>Bitte prüfe den Status später erneut. Eine Bestellbestätigung erfolgt erst nach der serverseitigen Zahlungsprüfung und Einrichtung der Bestellverwaltung.</p>
  </>:<>
   <p>Der Zahlungsstatus konnte noch nicht serverseitig bestätigt werden. Eine Weiterleitung auf diese Seite ist allein kein Zahlungsnachweis.</p>
   <p>Öffne diese Seite nach Abschluss einer neuen Testzahlung erneut. Die Bestellverwaltung und Bestätigungsmails sind noch nicht aktiviert.</p>
  </>}
  <Link className="button" href="/shop">Zum Shop</Link>
 </main>;
}
