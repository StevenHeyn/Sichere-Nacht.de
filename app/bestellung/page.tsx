import Link from 'next/link';
export const metadata={title:'Zahlungsstatus | Sichere Nacht'};
export const dynamic='force-dynamic';

type SessionStatus={id?:string;status?:string;payment_status?:string;livemode?:boolean};
async function getVerifiedPaymentStatus(sessionId:string):Promise<'paid'|'pending'|'unavailable'>{
 const secret=process.env.STRIPE_SECRET_KEY;
 const testMode=process.env.VERCEL_ENV==='preview'&&Boolean(secret?.startsWith('sk_test_'));
 const liveMode=process.env.VERCEL_ENV==='production'&&process.env.PAYMENTS_LIVE_APPROVED==='true'&&Boolean(secret?.startsWith('sk_live_')||secret?.startsWith('rk_live_'));
 if(!testMode&&!liveMode)return 'unavailable';
 if(!sessionId.startsWith(liveMode?'cs_live_':'cs_test_')||!/^cs_(?:live|test)_[A-Za-z0-9]{12,}$/.test(sessionId))return 'unavailable';
 try{
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions/'+encodeURIComponent(sessionId),{
   headers:{Authorization:'Bearer '+secret,'Stripe-Version':'2026-03-25.dahlia'},
   cache:'no-store'
  });
  if(!response.ok)return 'unavailable';
  const session=await response.json() as SessionStatus;
  if(session.id!==sessionId||session.livemode!==liveMode)return 'unavailable';
  if(session.status==='complete'&&session.payment_status==='paid')return 'paid';
  return 'pending';
 }catch{return 'unavailable';}
}
export default async function Bestellung({searchParams}:{searchParams:Promise<{session_id?:string}>}){
 const params=await searchParams;
 const sessionId=typeof params.session_id==='string'?params.session_id:'';
 const state=sessionId?await getVerifiedPaymentStatus(sessionId):'unavailable';
 const isLive=process.env.VERCEL_ENV==='production'&&process.env.PAYMENTS_LIVE_APPROVED==='true';
 return <main className="wrap" style={{maxWidth:800,paddingBottom:80}}>
  <Link href="/" className="accent">← Startseite</Link>
  <h1>{state==='paid'?(isLive?'Zahlung erfolgreich!':'Testzahlung erfolgreich!'):state==='pending'?'Zahlung wird geprüft':'Zahlungsstatus'}</h1>
  {state==='paid'?<>
   <p>Stripe hat die Zahlung serverseitig als <strong>bezahlt</strong> bestätigt. {isLive?'Wir bearbeiten deine Bestellung nach Eingang der Bestellbestätigung.':'Das war eine Testzahlung: Es wurde kein echtes Geld abgebucht.'}</p>
   <p>{isLive?'Die Bestellung wird nach Zahlungsbestätigung über unsere Bestellverwaltung verarbeitet. Bitte bewahre die Bestätigungs-E-Mail auf.':'Nach erfolgreicher Testzahlung wird die Bestellung über unseren Stripe-Webhook automatisch in der Bestellverwaltung erfasst. Eine Bestätigung wird im Testbetrieb ausschließlich an das interne Testpostfach gesendet. Es erfolgt kein echter Versand und keine verbindliche Kundenbestellung.'}</p>
  </>:state==='pending'?<>
   <p>Stripe meldet noch keine abgeschlossene und bezahlte Zahlung. Bei manchen Zahlungsarten dauert die Verarbeitung etwas länger.</p>
   <p>Bitte prüfe den Status später erneut. Eine Bestellung gilt erst nach serverseitig bestätigter Zahlung als bezahlt.</p>
  </>:<>
   <p>Der Zahlungsstatus konnte noch nicht serverseitig bestätigt werden. Eine Weiterleitung auf diese Seite ist allein kein Zahlungsnachweis.</p>
   <p>Öffne diese Seite nach Abschluss einer neuen Testzahlung erneut. Falls Stripe die Zahlung bereits bestätigt hat, kann die serverseitige Bestellverarbeitung unabhängig von dieser Anzeige bereits erfolgen.</p>
  </>}
  <Link className="button" href="/shop">Zum Shop</Link>
 </main>;
}
).test(sessionId))return 'unavailable';
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
   <p>Nach erfolgreicher Testzahlung wird die Bestellung über unseren Stripe-Webhook automatisch in der Bestellverwaltung erfasst. Eine Bestätigung wird im Testbetrieb ausschließlich an das interne Testpostfach gesendet. Es erfolgt kein echter Versand und keine verbindliche Kundenbestellung.</p>
  </>:state==='pending'?<>
   <p>Stripe meldet noch keine abgeschlossene und bezahlte Zahlung. Bei manchen Zahlungsarten dauert die Verarbeitung etwas länger.</p>
   <p>Bitte prüfe den Status später erneut. Eine Bestellbestätigung wird erst nach serverseitig bestätigter Zahlung verarbeitet; im Testbetrieb wird sie nur an unser internes Testpostfach gesendet.</p>
  </>:<>
   <p>Der Zahlungsstatus konnte noch nicht serverseitig bestätigt werden. Eine Weiterleitung auf diese Seite ist allein kein Zahlungsnachweis.</p>
   <p>Öffne diese Seite nach Abschluss einer neuen Testzahlung erneut. Falls Stripe die Zahlung bereits bestätigt hat, kann die serverseitige Bestellverarbeitung unabhängig von dieser Anzeige bereits erfolgen.</p>
  </>}
  <Link className="button" href="/shop">Zum Shop</Link>
 </main>;
}
