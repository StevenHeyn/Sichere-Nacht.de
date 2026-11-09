'use client';
import {useState} from 'react';

export type RoomType='Flur'|'Wohnzimmer'|'Schlafzimmer'|'Kinderzimmer'|'Küche'|'Bad'|'Arbeitszimmer'|'Keller'|'Garage'|'Sonstiges';
export type PlannedRoom={id:number;type:RoomType;name:string;floor:number;entrances:number;terraces:number;windows:number;motion:boolean};
export const ROOM_TYPES:RoomType[]=['Flur','Wohnzimmer','Schlafzimmer','Kinderzimmer','Küche','Bad','Arbeitszimmer','Keller','Garage','Sonstiges'];
const icon:Record<RoomType,string>={Flur:'🚪',Wohnzimmer:'🛋️',Schlafzimmer:'🛏️',Kinderzimmer:'🧸',Küche:'🍳',Bad:'🛁',Arbeitszimmer:'💻',Keller:'📦',Garage:'🚗',Sonstiges:'🏠'};
export const initialRooms:PlannedRoom[]=[
 {id:1,type:'Flur',name:'Flur',floor:0,entrances:1,terraces:0,windows:0,motion:true},
 {id:2,type:'Wohnzimmer',name:'Wohnzimmer',floor:0,entrances:0,terraces:1,windows:1,motion:true},
 {id:3,type:'Schlafzimmer',name:'Schlafzimmer',floor:0,entrances:0,terraces:0,windows:1,motion:false}
];
const clip=(n:number)=>Math.max(0,Math.min(20,Number.isFinite(n)?Math.floor(n):0));
type Props={rooms:PlannedRoom[];onChange:(next:PlannedRoom[])=>void;floors:number};
export default function RoomPlanner({rooms,onChange,floors}:Props){
 const [activeId,setActiveId]=useState(rooms[0]?.id??1);
 const [floor,setFloor]=useState(0);
 const [newType,setNewType]=useState<RoomType>('Schlafzimmer');
 const selected=rooms.find(r=>r.id===activeId)||rooms[0];
 const floorRooms=rooms.filter(r=>r.floor===floor);
 const sum=(key:'entrances'|'terraces'|'windows')=>rooms.reduce((s,r)=>s+r[key],0);
 function changeRoom(id:number,change:Partial<PlannedRoom>){onChange(rooms.map(r=>r.id===id?{...r,...change}:r))}
 function addRoom(){
  if(rooms.length>=20)return;
  const id=Math.max(0,...rooms.map(r=>r.id))+1;
  const count=rooms.filter(r=>r.type===newType).length;
  const created:PlannedRoom={id,type:newType,name:newType+(count?' '+(count+1):''),floor,entrances:0,terraces:0,windows:0,motion:newType==='Flur'||newType==='Wohnzimmer'};
  onChange([...rooms,created]);setActiveId(id);
 }
 function removeRoom(){if(!selected||rooms.length<=1)return;const rest=rooms.filter(r=>r.id!==selected.id);onChange(rest);setActiveId(rest[0].id);setFloor(rest[0].floor)}
 const qty=(label:string,key:'entrances'|'terraces'|'windows')=><div className="rpQty" key={key}><span>{label}</span><div className="rpStepper"><button type="button" aria-label={label+' reduzieren'} onClick={()=>changeRoom(selected.id,{[key]:clip(selected[key]-1)})}>−</button><strong>{selected[key]}</strong><button type="button" aria-label={label+' erhöhen'} onClick={()=>changeRoom(selected.id,{[key]:clip(selected[key]+1)})}>+</button></div></div>;
 return <div className="rpRoot">
  <div className="rpIntro"><div><p className="accent rpKicker">VIRTUELLER RUNDGANG</p><h2>Gehe Raum für Raum durch dein Zuhause</h2><p>Wähle einen Raum im Hausplan aus und markiere, was gesichert werden soll. Die Stückzahlen aktualisieren sich automatisch.</p></div><div className="rpSummary"><span>{rooms.length} Räume</span><span>🚪 {sum('entrances')}</span><span>🌿 {sum('terraces')}</span><span>🪟 {sum('windows')}</span></div></div>
  <div className="rpFloors" aria-label="Etage wählen">{Array.from({length:floors},(_,f)=><button type="button" key={f} aria-pressed={floor===f} className={floor===f?'active':''} onClick={()=>{setFloor(f);const first=rooms.find(r=>r.floor===f);if(first)setActiveId(first.id)}}>{f===0?'Erdgeschoss':f===1?'1. OG':(f+'. OG')}</button>)}</div>
  <div className="rpLayout">
   <div className="rpBlueprint"><div className="rpBlueprintHead"><span>⌂ DEIN HAUSPLAN</span><small>Schematische Ansicht · kein maßstabsgetreuer Grundriss</small></div><div className="rpRooms">
    {floorRooms.length?floorRooms.map((r,i)=><button type="button" key={r.id} aria-pressed={selected?.id===r.id} onClick={()=>setActiveId(r.id)} className={'rpTile '+(selected?.id===r.id?'selected':'')}><span className="rpRoomIcon">{icon[r.type]}</span><strong>{r.name}</strong><small>{r.entrances+r.terraces+r.windows} Zugänge · {r.motion?'Melder ✓':'Ohne Melder'}</small><span className="rpWindowMarks" aria-hidden="true">{Array.from({length:Math.min(r.windows+r.terraces,5)},(_,n)=><i key={n}/>)}</span></button>):<div className="rpEmpty">Für diese Etage sind noch keine Räume angelegt.</div>}
   </div><div className="rpLegend"><span><i/> Raum auswählen</span><span>▰ Fenster / Terrassentüren</span></div></div>
   <div className="rpEditor">{selected?<><p className="accent rpKicker">AUSGEWÄHLTER RAUM</p><label htmlFor="rp-name">Raumbezeichnung</label><input id="rp-name" maxLength={35} value={selected.name} onChange={e=>changeRoom(selected.id,{name:e.target.value})}/><label htmlFor="rp-floor">Etage</label><select id="rp-floor" value={Math.min(selected.floor,floors-1)} onChange={e=>{const next=Number(e.target.value);changeRoom(selected.id,{floor:next});setFloor(next)}}>{Array.from({length:floors},(_,f)=><option key={f} value={f}>{f===0?'Erdgeschoss':f+'. Obergeschoss'}</option>)}</select>
   {qty('Eingangstüren von außen','entrances')}{qty('Terrassen-/Balkontüren','terraces')}{qty('Erreichbare Fenster','windows')}
   <label className="rpMotion"><input type="checkbox" checked={selected.motion} onChange={e=>changeRoom(selected.id,{motion:e.target.checked})}/><span><strong>Bewegungserkennung berücksichtigen</strong><small>Ermittelt eine Melderempfehlung für diesen Raum bzw. Laufweg</small></span></label>
   <button type="button" className="rpRemove" disabled={rooms.length<=1} onClick={removeRoom}>Raum entfernen</button>
   </>:null}</div>
  </div>
  <div className="rpAdd"><div><strong>Weiteren Raum hinzufügen</strong><p>Bis zu 20 Räume. Du kannst auch mehrere gleichartige Zimmer anlegen.</p></div><div className="rpAddControl"><select aria-label="Raumtyp hinzufügen" value={newType} onChange={e=>setNewType(e.target.value as RoomType)}>{ROOM_TYPES.map(t=><option key={t} value={t}>{icon[t]} {t}</option>)}</select><button type="button" onClick={addRoom} disabled={rooms.length>=20}>+ Hinzufügen</button></div></div>
  <p className="note rpFoot">Die Skizze ist eine Orientierungshilfe, keine echte 360°-Aufnahme. Außentüren und erreichbare Fenster werden als Öffnungskontakte berücksichtigt; Positionen, Funkreichweite und Melderkompatibilität müssen vor dem Kauf geprüft werden.</p>
 </div>
}
