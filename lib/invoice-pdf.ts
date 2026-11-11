/* Minimal deterministic A4 invoice PDF without an external runtime dependency. */
type Address=Record<string,unknown>|null;
type Item={name:string;quantity:number;amount_total:number|null;sku:string|null};
export type InvoiceSnapshot={
 invoice_number:string;issued_at:string;shipped_at:string;
 customer_name:string|null;customer_email:string|null;
 billing_address:Address;shipping_address:Address;
 amount_total:number;amount_tax:number;shipping_amount:number|null;
 currency:string;items:Item[];test_mode:boolean;
};
const euros=(n:number)=>new Intl.NumberFormat('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100)+' EUR';
function address(a:Address):string[]{
 if(!a)return [];
 const s=(key:string)=>typeof a[key]==='string'?String(a[key]):'';
 return [s('line1'),s('line2'),[s('postal_code'),s('city')].filter(Boolean).join(' '),s('country')].filter(Boolean);
}
function latin(input:string){return input.replace(/[€]/g,'EUR').replace(/[–—]/g,'-').replace(/[„“”]/g,'"').replace(/[^\u0009\u000a\u000d\u0020-\u00ff]/g,'?');}
function escapePdf(input:string){return latin(input).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
function shortLines(text:string,width=88){
 const words=text.split(/\s+/).filter(Boolean);const lines:string[]=[];let cur='';
 for(const word of words){if(cur&&cur.length+word.length+1>width){lines.push(cur);cur='';}cur+=(cur?' ':'')+word;}
 if(cur)lines.push(cur);return lines;
}
function draw(lines:string[],pageIndex:number,totalPages:number):string{
 let y=790;const cmds=['BT','/F1 10 Tf'];
 for(const line of lines){if(line===''){y-=9;continue;}
 cmds.push('1 0 0 1 42 '+y+' Tm','('+escapePdf(line)+') Tj');y-=16;
 }
 cmds.push('1 0 0 1 42 35 Tm','('+escapePdf('Sichere Nacht | Seite '+(pageIndex+1)+' von '+totalPages)+') Tj','ET');
 return cmds.join('\n');
}
export function invoicePdf(invoice:InvoiceSnapshot,issuer:{name:string;street:string;postalCity:string;vatId:string;registry:string;email:string}):Buffer{
 if(invoice.currency!=='eur'||invoice.amount_tax<=0||!invoice.invoice_number)throw new Error('Rechnungsdaten unvollständig');
 const net=invoice.amount_total-invoice.amount_tax;
 const lines:string[]=[
  issuer.name,issuer.street,issuer.postalCity,'USt-IdNr.: '+issuer.vatId,
  issuer.registry,'E-Mail: '+issuer.email,'',
  invoice.test_mode?'TESTRECHNUNG - NICHT FÜR DIE BUCHHALTUNG':'RECHNUNG',
  'Rechnungsnummer: '+invoice.invoice_number,
  'Rechnungsdatum: '+new Date(invoice.issued_at).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'}),
  'Liefer-/Leistungsdatum: '+new Date(invoice.shipped_at).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'}),'',
  'Rechnung an:',invoice.customer_name||'Kundin/Kunde',
  ...address(invoice.billing_address),invoice.customer_email||'','',
  'Pos.  Bezeichnung und Menge                                      Brutto',''
 ];
 for(const [i,item] of invoice.items.entries()){
  const chunks=shortLines(item.name,64);
  lines.push((i+1)+'.  '+item.quantity+' x '+chunks[0]+' | '+euros(item.amount_total??0));
  for(const more of chunks.slice(1))lines.push('     '+more);
  if(item.sku)lines.push('     Art.: '+item.sku);
 }
 if(invoice.shipping_amount)lines.push('Versandkosten: '+euros(invoice.shipping_amount));
 lines.push('','Nettobetrag: '+euros(net),
 'Umsatzsteuer 19 %: '+euros(invoice.amount_tax),
 'Gesamtbetrag brutto: '+euros(invoice.amount_total),'',
 'Zahlungsstatus: Bereits online bezahlt. Keine weitere Zahlung erforderlich.',
 'Bitte diese Rechnung für Ihre Unterlagen aufbewahren.');
 const chunks:string[][]=[];
 for(let i=0;i<lines.length;i+=37)chunks.push(lines.slice(i,i+37));
 const objs:string[]=[];const add=(s:string)=>{objs.push(s);return objs.length};
 const catalog=add('');const pages=add('');const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 const pageRefs:number[]=[];
 for(let i=0;i<chunks.length;i++){
  const stream=draw(chunks[i],i,chunks.length);
  const streamBytes=Buffer.from(stream,'latin1');
  const contents=add('<< /Length '+streamBytes.length+' >>\nstream\n'+stream+'\nendstream');
  const page=add('<< /Type /Page /Parent '+pages+' 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '+font+' 0 R >> >> /Contents '+contents+' 0 R >>');
  pageRefs.push(page);
 }
 objs[catalog-1]='<< /Type /Catalog /Pages '+pages+' 0 R >>';
 objs[pages-1]='<< /Type /Pages /Count '+pageRefs.length+' /Kids ['+pageRefs.map(x=>x+' 0 R').join(' ')+'] >>';
 let output='%PDF-1.4\n';const offsets=[0];
 for(let i=0;i<objs.length;i++){offsets.push(Buffer.byteLength(output,'latin1'));output+=(i+1)+' 0 obj\n'+objs[i]+'\nendobj\n';}
 const xref=Buffer.byteLength(output,'latin1');
 output+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
 for(const offset of offsets.slice(1))output+=String(offset).padStart(10,'0')+' 00000 n \n';
 output+='trailer\n<< /Size '+(objs.length+1)+' /Root '+catalog+' 0 R >>\nstartxref\n'+xref+'\n%%EOF';
 return Buffer.from(output,'latin1');
}
