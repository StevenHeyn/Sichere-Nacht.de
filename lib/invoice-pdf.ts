/* Matching, dependency-free A4 PDFs for invoices and order confirmations. */
type Address=Record<string,unknown>|null;
type Item={name:string;quantity:number;amount_total:number|null;sku:string|null};
type Issuer={name:string;street:string;postalCity:string;vatId:string;registry:string;email:string};
export type InvoiceSnapshot={
 invoice_number:string;issued_at:string;shipped_at:string;
 customer_name:string|null;customer_email:string|null;
 billing_address:Address;shipping_address:Address;
 amount_total:number;amount_tax:number;shipping_amount:number|null;
 currency:string;items:Item[];test_mode:boolean;
};
export type ConfirmationSnapshot={
 stripe_session_id:string;created_at?:string;
 customer_name:string|null;customer_email:string|null;
 billing_address:Address;shipping_address:Address;
 amount_total:number;amount_tax:number|null;shipping_amount:number|null;
 currency:string;items:Item[];test_mode:boolean;
};
type Doc={kind:'invoice'|'confirmation';number:string;date:string;deliveryDate?:string;
 customerName:string|null;email:string|null;billing:Address;items:Item[];
 total:number;tax:number|null;shipping:number|null;test:boolean;currency:string};
const money=(n:number)=>new Intl.NumberFormat('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100)+' EUR';
const date=(s:string)=>{const d=new Date(s);return Number.isNaN(d.valueOf())?s:d.toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'})};
const enc=(s:string)=>s.replace(/€/g,'EUR').replace(/[–—]/g,'-').replace(/[„“”]/g,'"').replace(/[\u0100-\uffff]/g,'?').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
const esc=(s:string)=>enc(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
const fmt=(n:number)=>Number.isFinite(n)?n.toFixed(2):'0';
function addressParts(a:Address):string[]{
 if(!a)return [];
 const s=(key:string)=>typeof a[key]==='string'?String(a[key]):'';
 return [s('line1'),s('line2'),[s('postal_code'),s('city')].filter(Boolean).join(' '),s('country')].filter(Boolean);
}
function wrap(text:string,max=48):string[]{
 const words=enc(text).split(/\s+/).filter(Boolean),lines:string[]=[];let line='';
 for(const word of words){if(word.length>max){if(line){lines.push(line);line='';}for(let i=0;i<word.length;i+=max)lines.push(word.slice(i,i+max));continue;}
  if(line && line.length+word.length+1>max){lines.push(line);line='';}line+=(line?' ':'')+word;
 }
 if(line)lines.push(line);return lines.length?lines:[''];
}
class Page{
 commands:string[]=[];
 text(x:number,y:number,s:string,size=10,bold=false,color=[0.13,0.17,0.23]):void{
  this.commands.push('BT',fmt(color[0])+' '+fmt(color[1])+' '+fmt(color[2])+' rg',
  '/'+(bold?'F2':'F1')+' '+fmt(size)+' Tf','1 0 0 1 '+fmt(x)+' '+fmt(y)+' Tm','('+esc(s)+') Tj','ET');
 }
 rect(x:number,y:number,w:number,h:number,color:number[]):void{
  this.commands.push(fmt(color[0])+' '+fmt(color[1])+' '+fmt(color[2])+' rg',
   fmt(x)+' '+fmt(y)+' '+fmt(w)+' '+fmt(h)+' re f');
 }
 line(x:number,y:number,x2:number,y2:number,color=[0.84,0.86,0.88],thickness=0.6):void{
  this.commands.push(fmt(color[0])+' '+fmt(color[1])+' '+fmt(color[2])+' RG',
   fmt(thickness)+' w',fmt(x)+' '+fmt(y)+' m '+fmt(x2)+' '+fmt(y2)+' l S');
 }
}
const RED=[0.77,0.12,0.17],INK=[0.11,0.15,0.20],GRAY=[0.43,0.47,0.52],PALE=[0.96,0.97,0.98];
function header(p:Page,d:Doc,issuer:Issuer,page:number){
 p.rect(0,828,595,14,RED);
 p.rect(42,753,35,35,INK);p.rect(51,762,17,17,RED);
 p.text(86,775,'SICHERE',19,true,INK);p.text(194,775,'NACHT',19,true,RED);
 p.text(86,757,'SICHERHEIT. EINFACH. DURCHDACHT.',7,false,GRAY);
 const name=d.kind==='invoice'?'RECHNUNG':'AUFTRAGSBESTÄTIGUNG';
 p.text(42,705,name,20,true,INK);
 p.rect(42,686,70,3,RED);
 if(d.test){p.rect(371,695,182,20,[1,0.94,0.94]);p.text(381,702,'TESTDOKUMENT - KEIN ORIGINAL',8,true,RED);}
 p.text(42,663,'H&K Projekt UG (haftungsbeschränkt)',8,false,GRAY);
 p.line(42,650,553,650);
 if(page>0)p.text(42,633,'Fortsetzung | '+d.number,9,false,GRAY);
}
function footer(p:Page,issuer:Issuer,page:number,totalPages:number){
 p.line(42,90,553,90);
 p.text(42,75,issuer.name,8,true,INK);
 p.text(42,62,issuer.street+' | '+issuer.postalCity,8,false,GRAY);
 p.text(42,49,'USt-IdNr.: '+issuer.vatId+' | '+issuer.registry,7.5,false,GRAY);
 p.text(42,36,issuer.email,7.5,false,GRAY);
 p.text(496,36,'Seite '+page+' / '+totalPages,7.5,false,GRAY);
}
function row(p:Page,y:number,idx:number,item:Item){
 const lines=wrap(item.name,45),h=Math.max(48,lines.length*13+26);
 p.text(51,y-18,String(idx).padStart(2,'0'),9,true,GRAY);
 for(let i=0;i<lines.length;i++)p.text(92,y-18-i*13,lines[i],9.5,i===0,INK);
 if(item.sku)p.text(92,y-21-lines.length*13,'Art.-Nr. '+item.sku,7.8,false,GRAY);
 p.text(438,y-18,String(item.quantity),9,false,INK);
 p.text(484,y-18,item.amount_total===null?'-':money(item.amount_total),8.4,true,INK);
 p.line(42,y-h,553,y-h,[0.88,0.89,0.90]);
 return y-h;
}
function pdf(d:Doc,issuer:Issuer):Buffer{
 if(d.total<0||d.currency!=='eur')throw new Error('Ungültige Dokumentbeträge');
 const pages:Page[]=[];let p=new Page();pages.push(p);
 header(p,d,issuer,0);
 let y=624;
 p.text(42,y,'RECHNUNG AN',8,true,RED);
 p.text(314,y,'DOKUMENTDATEN',8,true,RED);
 y-=19;
 p.text(42,y,d.customerName||'Kunde',10,true,INK);
 p.text(314,y,(d.kind==='invoice'?'Rechnungsnummer: ':'Bestellreferenz: ')+d.number,8.5,false,INK);
 y-=16;
 for(const part of addressParts(d.billing)){p.text(42,y,part,9,false,INK);y-=14;}
 if(d.email){p.text(42,y,d.email,8.5,false,GRAY);y-=14;}
 p.text(314,589,(d.kind==='invoice'?'Rechnungsdatum: ':'Bestelldatum: ')+date(d.date),8.5,false,INK);
 if(d.deliveryDate)p.text(314,573,'Lieferdatum: '+date(d.deliveryDate),8.5,false,INK);
 p.text(314,557,d.kind==='invoice'?'Zahlung: Bereits bezahlt':'Zahlungsstatus: Bezahlt',8.5,false,INK);
 y=Math.min(y,527);
 p.rect(42,y-32,511,32,INK);
 p.text(51,y-20,'POS.',8,true,[1,1,1]);p.text(92,y-20,'ARTIKEL / BESCHREIBUNG',8,true,[1,1,1]);
 p.text(438,y-20,'MENGE',8,true,[1,1,1]);p.text(487,y-20,'BRUTTO',8,true,[1,1,1]);
 y-=32;
 for(let i=0;i<d.items.length;i++){
  const item=d.items[i],h=Math.max(48,wrap(item.name,45).length*13+26);
  if(y-h<230){
   p=new Page();pages.push(p);header(p,d,issuer,pages.length-1);
   y=614;p.rect(42,y-32,511,32,INK);
   p.text(51,y-20,'POS.',8,true,[1,1,1]);p.text(92,y-20,'ARTIKEL / BESCHREIBUNG',8,true,[1,1,1]);
   p.text(438,y-20,'MENGE',8,true,[1,1,1]);p.text(487,y-20,'BRUTTO',8,true,[1,1,1]);y-=32;
  }
  if(i%2===0)p.rect(42,y-h,511,h,PALE);
  y=row(p,y,i+1,item);
 }
 if(y<230){p=new Page();pages.push(p);header(p,d,issuer,pages.length-1);y=606;}
 y-=18;
 const totalRectY=y-100;
 p.rect(306,totalRectY,247,103,PALE);
 p.text(320,y-16,'Warenwert brutto',9,false,GRAY);
 p.text(468,y-16,money(d.total-(d.shipping||0)),9,true,INK);
 p.text(320,y-35,'Versandkosten',9,false,GRAY);
 p.text(468,y-35,money(d.shipping||0),9,true,INK);
 if(d.tax!==null && d.tax>0){
  p.text(320,y-54,'Darin enthaltene USt. 19 %',8.5,false,GRAY);
  p.text(468,y-54,money(d.tax),9,true,INK);
 }else{
  p.text(320,y-54,'Steuerberechnung nicht ausgewiesen',7.7,false,GRAY);
 }
 p.line(320,y-64,538,y-64,[0.82,0.84,0.86]);
 p.text(320,y-86,'GESAMTBETRAG',10,true,INK);
 p.text(460,y-86,money(d.total),10,true,RED);
 const note=d.kind==='invoice'?
  'Diese Rechnung ist bereits online bezahlt. Es ist keine weitere Zahlung erforderlich.':
  'Vielen Dank für deine Bestellung. Dies ist eine Auftragsbestätigung, keine Rechnung oder Versandbestätigung.';
 const lines=wrap(note,77);
 let ny=totalRectY-24;
 for(const s of lines){p.text(42,ny,s,9,false,GRAY);ny-=13;}
 if(d.test)p.text(42,ny-13,'TESTMODUS: keine echte Zahlung, nicht für die Buchhaltung.',8,true,RED);
 for(let i=0;i<pages.length;i++)footer(pages[i],issuer,i+1,pages.length);
 const objects:string[]=[];const add=(o:string)=>{objects.push(o);return objects.length};
 const root=add(''),pagesRef=add('');
 const regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
 const pageRefs:number[]=[];
 for(const page of pages){
  const stream=page.commands.join('\n'),length=Buffer.byteLength(stream,'latin1');
  const contents=add('<< /Length '+length+' >>\nstream\n'+stream+'\nendstream');
  pageRefs.push(add('<< /Type /Page /Parent '+pagesRef+' 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '+regular+' 0 R /F2 '+bold+' 0 R >> >> /Contents '+contents+' 0 R >>'));
 }
 objects[root-1]='<< /Type /Catalog /Pages '+pagesRef+' 0 R >>';
 objects[pagesRef-1]='<< /Type /Pages /Count '+pageRefs.length+' /Kids ['+pageRefs.map(x=>x+' 0 R').join(' ')+'] >>';
 let data='%PDF-1.4\n';const offsets=[0];
 for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(data,'latin1'));data+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}
 const xref=Buffer.byteLength(data,'latin1');
 data+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
 for(const off of offsets.slice(1))data+=String(off).padStart(10,'0')+' 00000 n \n';
 data+='trailer\n<< /Size '+(objects.length+1)+' /Root '+root+' 0 R >>\nstartxref\n'+xref+'\n%%EOF';
 return Buffer.from(data,'latin1');
}
export function invoicePdf(v:InvoiceSnapshot,issuer:Issuer):Buffer{
 if(!v.invoice_number||!v.amount_tax||v.amount_tax<=0)throw new Error('Rechnungsdaten oder Steuerbetrag fehlen');
 return pdf({kind:'invoice',number:v.invoice_number,date:v.issued_at,deliveryDate:v.shipped_at,
  customerName:v.customer_name,email:v.customer_email,billing:v.billing_address,items:v.items,
  total:v.amount_total,tax:v.amount_tax,shipping:v.shipping_amount,test:v.test_mode,currency:v.currency},issuer);
}
export function confirmationPdf(v:ConfirmationSnapshot,issuer:Issuer):Buffer{
 return pdf({kind:'confirmation',number:'SN-AB-'+v.stripe_session_id.slice(-12).toUpperCase(),date:v.created_at||new Date().toISOString(),
  customerName:v.customer_name,email:v.customer_email,billing:v.billing_address||v.shipping_address,
  items:v.items,total:v.amount_total,tax:v.amount_tax,shipping:v.shipping_amount,test:v.test_mode,currency:v.currency},issuer);
}
