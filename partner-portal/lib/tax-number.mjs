// Local plausibility only. Source: ELSTER specification, 2026-09-02, sections 4–7.
// Does not verify allocation, ownership or the current official tax-office directory.
export const taxStates = [
 ['BW','Baden-Württemberg','28',10],['BY','Bayern','9',11],
 ['BE','Berlin','11',10],['BB','Brandenburg','3',11],
 ['HB','Bremen','24',10],['HH','Hamburg','22',10],
 ['HE','Hessen','26',11],['MV','Mecklenburg-Vorpommern','4',11],
 ['NI','Niedersachsen','23',10],['NW','Nordrhein-Westfalen','5',11],
 ['RP','Rheinland-Pfalz','27',10],['SL','Saarland','1',11],
 ['SN','Sachsen','3',11],['ST','Sachsen-Anhalt','3',11],
 ['SH','Schleswig-Holstein','21',10],['TH','Thüringen','4',11]
];
const common=[0,5,4,3,0,2,7,6,5,4,3,2];
const northern=[0,0,4,3,0,2,7,6,5,4,3,2];
const berlinB=[0,0,2,9,0,8,7,6,5,4,3,2];
const berlinA=[0,0,0,0,0,7,6,5,8,4,3,2];
const fail=message=>({status:'invalid',message});
export function checkTaxNumber(value,state){
 if(typeof value!=='string'||!value.trim())return {status:'empty',message:'Steuernummer vom Finanzamt eintragen.'};
 const config=taxStates.find(s=>s[0]===state);
 if(!config)return {status:'incomplete',message:'Bitte das Bundesland deines Finanzamts auswählen.'};
 if(!/^[0-9/\s]+$/.test(value)||value.length>40)return fail('Nur Ziffern, Leerzeichen und Schrägstriche verwenden. Keine Steuer-ID oder USt-IdNr.');
 let n=value.replace(/[/\s]/g,'');
 if(n.length!==13){
  if(n.length!==config[3])return fail('Die Stellenzahl passt nicht zum gewählten Bundesland. Führende Nullen und vollständige Finanzamtsnummer prüfen.');
  if(state==='HE'){
   if(n[0]!=='0')return fail('Die Steuernummer in Hessen beginnt im Landesformat mit 0.');
   n='26'+n.slice(1,3)+'0'+n.slice(3);
  }else{
   const f=config[3]===10?2:3;
   n=config[2]+n.slice(0,f)+'0'+n.slice(f);
  }
 }
 const prefix={BB:'30',MV:'40',SL:'10',SN:'32',ST:'31',TH:'41'}[state]||config[2];
 if(!n.startsWith(prefix)||n[4]!=='0')return fail('Bundesland oder Aufbau der 13-stelligen Steuernummer passt nicht.');
 const district=Number(n.slice(5,state==='NW'?9:8));
 if([0,998,999].includes(district)||(['BY','BB','MV','SL','SN','ST','TH'].includes(state)&&district<100)||(state==='NW'&&Number(n.slice(9))<10))return fail('Der Nummernaufbau ist nicht plausibel. Bitte mit dem Finanzamtsschreiben vergleichen.');
 const d=[...n].map(Number);
 let expected;
 if(['BW','HE','SH'].includes(state)){
  const add=[0,0,9,8,0,7,6,5,4,3,2,1], weights=[0,0,512,256,0,128,64,32,16,8,4,2];
  const sum=weights.reduce((sum,w,i)=>{let v=((d[i]+add[i])%10)*w;while(v>9)v=[...String(v)].reduce((a,x)=>a+Number(x),0);return sum+v;},0);
  expected=(10-sum%10)%10;
 }else if(state==='RP'){
  const weights=[0,0,1,2,0,1,2,1,2,1,2,1];
  const sum=weights.reduce((sum,w,i)=>{const p=d[i]*w;return sum+(p>9?p%10+1:p);},0);
  expected=(10-sum%10)%10;
 }else{
  let weights=common;
  if(['HB','HH'].includes(state))weights=northern;
  if(state==='NI')weights=berlinB;
  if(state==='NW')weights=[0,3,2,1,0,7,6,5,4,3,2,1];
  if(state==='BE'){
   const office=Number(n.slice(0,4)), range=district>=201&&district<=693;
   if([1113,1114,1117,1120,1121,1123,1124,1125].includes(office))weights=range?berlinB:berlinA;
   else if(office===1116)weights=(range||(district>=1&&district<=29)||(district>=875&&district<=899))?berlinB:berlinA;
   else if(office===1119)weights=((district>=201&&district<=639)||[680,684].includes(district))?berlinB:berlinA;
   else if([1127,1129,1130].includes(office))weights=berlinA;
   else if([1115,1118,1131,1132,1133,1134,1135,1136,1137,1138,1194,1195,1196,1197,1198].includes(office))weights=berlinB;
   else return {status:'review',message:'Finanzamtsregel nicht eindeutig zugeordnet. Bitte manuell prüfen.'};
  }
  const sum=weights.reduce((s,w,i)=>s+w*d[i],0);
  expected=state==='NW'?sum%11:(11-sum%11)%11;
 }
 if(expected!==d[12])return fail('Die Prüfziffer passt nicht. Bitte die eingegebene Nummer mit dem Finanzamtsschreiben vergleichen.');
 return {status:'plausible',message:'Format und Prüfziffer sind plausibel. Vergabe, Finanzamtsbestand und Inhaber wurden nicht bestätigt.'};
}
