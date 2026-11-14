import {productAdvice,type AdviceProduct} from './product-advice';
export type SystemLine={product:AdviceProduct;quantity:number};
export type SystemCheck={errors:string[];warnings:string[];devices:number};
/** Conservative incompatibility guard, not a substitute for an installation plan. */
export function checkSystem(lines:SystemLine[],newSystem=false):SystemCheck{
 const errors:string[]=[],warnings:string[]=[];
 const hubs=lines.filter(l=>productAdvice(l.product).role==='Zentrale'||(!/bracket|cover|case|psu|batter|holder|gehäuse/i.test(l.product.name)&&/\bhub\b/i.test(l.product.name)));
 const hubName=hubs.map(l=>l.product.name).join(' ');
 const active=lines.filter(l=>productAdvice(l.product).technology!=='Zubehör');
 const devices=active.filter(l=>!hubs.includes(l)).reduce((n,l)=>n+l.quantity,0);
 if(lines.some(l=>!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>30))errors.push('Pro Artikel sind ganze Mengen von 1 bis 30 möglich. Größere Objekte bitte individuell planen.');
 if(newSystem&&hubs.reduce((n,l)=>n+l.quantity,0)!==1)errors.push('Eine neue Einzelanlage benötigt genau eine passende Zentrale.');
 if(hubs.some(l=>l.quantity>1)||hubs.length>1)warnings.push('Mehrere Zentralen ergeben mehrere Anlagen. Die Zuordnung der Geräte muss separat geplant werden.');
 if(hubs.length===1){
  if(active.some(l=>productAdvice(l.product).technology==='Fibra')&&!/Hybrid/i.test(hubName))errors.push('Fibra-Komponenten lassen sich nicht direkt an diesen Funk-Hub anschließen. Eine Fibra-fähige Zentrale ist erforderlich.');
  if(active.some(l=>/MotionCam/i.test(l.product.name))&&!/Hub\s*2|Hybrid|G3|Hub BP/i.test(hubName))errors.push('Der gewählte Hub ist nicht für diese Fotoverifizierung eingeplant. Hub, Hub Plus und Hub 2 sind unterschiedliche Zentralen.');
  if(active.some(l=>/\bG3\b/i.test(l.product.name))&&!/\bG3\b/i.test(hubName))errors.push('Superior-G3-Geräte benötigen eine konkret freigegebene Systemkombination. Diese Mischung bitte fachlich prüfen.');
  const capacity=/Hub 2 Plus/i.test(hubName)?200:/Hub 2\b/i.test(hubName)?100:null;
  if(capacity&&devices>capacity)errors.push('Die Anzahl angeschlossener Geräte übersteigt die dokumentierte Hub-Kapazität von '+capacity+'.');
 }
 if(active.some(l=>/EN54/i.test(l.product.name))&&active.some(l=>!hubs.includes(l)&&!/EN54/i.test(l.product.name)))errors.push('EN54 und andere Produktlinien nicht als ungeprüfte gemeinsame Brandmeldeanlage zusammenstellen.');
 if(!hubs.length&&active.length)warnings.push('Keine Zentrale enthalten: Nur als Ergänzung eines bereits vorhandenen, passenden Systems verwenden.');
 if(lines.some(l=>!productAdvice(l.product).reviewed))warnings.push('Mindestens ein Artikel benötigt noch eine individuelle Kompatibilitäts- und Zubehörprüfung.');
 if(lines.some(l=>productAdvice(l.product).environment==='Außen geeignet'))warnings.push('Außenpositionen, Funkverbindung und gegebenenfalls örtliche Alarmierungsvorgaben vor Installation prüfen.');
 if(newSystem&&!active.some(l=>/melder/i.test(productAdvice(l.product).role)))errors.push('Die Zusammenstellung enthält noch keinen für die Erkennung vorgesehenen Melder.');
 return {errors:[...new Set(errors)],warnings:[...new Set(warnings)],devices};
}
