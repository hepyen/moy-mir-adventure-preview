import {Component,type ReactNode,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {MiroAvatar} from '../legacyWorld/MiroAvatar';
import type {GardenDecoration,HealthDaily} from './useHealthFamily';
import './HealthGarden.css';
type Kind='flower'|'tree'|'bench'|'lantern'|'path'|'pond'|'fence'|'mailbox'|'apple';
const ITEMS:{kind:Kind;name:string;emoji:string;need:number}[]=[
 {kind:'flower',name:'Цветы',emoji:'🌸',need:0},
 {kind:'path',name:'Дорожка',emoji:'🪨',need:0},
 {kind:'tree',name:'Дерево',emoji:'🌳',need:1},
 {kind:'lantern',name:'Фонарик',emoji:'🏮',need:2},
 {kind:'bench',name:'Скамейка',emoji:'🪑',need:3},
 {kind:'fence',name:'Забор',emoji:'🪵',need:4},
 {kind:'mailbox',name:'Почтовый ящик',emoji:'📫',need:5},
 {kind:'pond',name:'Пруд',emoji:'💧',need:6},
 {kind:'apple',name:'Яблоня',emoji:'🍎',need:7}
];
const FAMILY=[
 {id:'family_walk',emoji:'🚶',label:'Прогулялись вместе',detail:'Небольшая семейная прогулка'},
 {id:'family_cook',emoji:'🥗',label:'Приготовили что-то вместе',detail:'Выбрали рецепт и помогли на кухне'},
 {id:'family_game',emoji:'⚽',label:'Поиграли или потанцевали',detail:'Весёлое движение без соревнования'}
];
const slotX=(i:number)=>(i%4-1.5)*1.5;
const slotZ=(i:number)=>(Math.floor(i/4)-1.5)*1.5;
function Decoration({kind}:{kind:Kind}){
 const green='#3caa75';
 if(kind==='path')return <mesh position={[0,.08,0]}><boxGeometry args={[1.18,.13,1.18]}/><meshStandardMaterial color="#c5b9a8"/></mesh>;
 if(kind==='flower')return <group>
  {[[-.3,-.25],[.22,-.14],[.18,.3],[-.25,.28]].map(([x,z],i)=><group key={i} position={[x,0,z]}>
   <mesh position={[0,.30,0]}><cylinderGeometry args={[.026,.032,.58,6]}/><meshStandardMaterial color={green}/></mesh>
   <mesh position={[0,.65,0]}><sphereGeometry args={[.13,12,10]}/><meshStandardMaterial color={['#f471a6','#fee16a','#dd9fff','#fc8b6d'][i]}/></mesh>
   <mesh position={[0,.66,.13]}><sphereGeometry args={[.05,8,7]}/><meshStandardMaterial color="#ffd566"/></mesh>
  </group>)}
 </group>;
 if(kind==='tree'||kind==='apple')return <group>
  <mesh position={[0,.66,0]} castShadow><cylinderGeometry args={[.14,.23,1.3,10]}/><meshStandardMaterial color="#996746"/></mesh>
  {[[-.34,1.33,.1,.46],[.27,1.43,.06,.49],[0,1.77,-.15,.54]].map(([x,y,z,r],i)=>
   <mesh key={i} position={[x,y,z]} castShadow><sphereGeometry args={[r,14,12]}/><meshStandardMaterial color={i===2?'#5cc979':'#2b9b69'}/></mesh>)}
  {kind==='apple'&&[[-.31,1.43,.5],[.35,1.4,.29],[.02,1.86,.3]].map(([x,y,z],i)=><mesh key={i} position={[x,y,z]}><sphereGeometry args={[.12,9,8]}/><meshStandardMaterial color="#ef4a56"/></mesh>)}
 </group>;
 if(kind==='bench')return <group>
  <mesh position={[0,.49,0]} castShadow><boxGeometry args={[1.02,.14,.36]}/><meshStandardMaterial color="#b98559"/></mesh>
  <mesh position={[0,.74,-.17]}><boxGeometry args={[1,.48,.11]}/><meshStandardMaterial color="#b98559"/></mesh>
  {[-.37,.37].map(x=><mesh key={x} position={[x,.24,0]}><boxGeometry args={[.11,.43,.27]}/><meshStandardMaterial color="#78614f"/></mesh>)}
 </group>;
 if(kind==='lantern')return <group>
  <mesh position={[0,.70,0]}><cylinderGeometry args={[.055,.09,1.4,9]}/><meshStandardMaterial color="#426c78"/></mesh>
  <mesh position={[0,1.52,0]}><boxGeometry args={[.36,.31,.35]}/><meshStandardMaterial emissive="#ffdc83" emissiveIntensity={1.5} color="#ffecad"/></mesh>
  <mesh position={[0,1.73,0]}><coneGeometry args={[.31,.25,4]}/><meshStandardMaterial color="#44677e"/></mesh>
 </group>;
 if(kind==='pond')return <group>
  <mesh position={[0,.10,0]} rotation={[0,0,0]}><cylinderGeometry args={[.65,.68,.17,24]}/><meshStandardMaterial color="#799b99"/></mesh>
  <mesh position={[0,.20,0]}><cylinderGeometry args={[.57,.57,.035,24]}/><meshStandardMaterial color="#4cc3e3" metalness={.15} roughness={.2}/></mesh>
 </group>;
 if(kind==='fence')return <group>
  {[-.53,.53].map((x,i)=><mesh key={i} position={[x,.54,0]}><boxGeometry args={[.12,1.05,.14]}/><meshStandardMaterial color="#bf8f5b"/></mesh>)}
  {[.33,.68].map((y,i)=><mesh key={i} position={[0,y,0]}><boxGeometry args={[1.13,.10,.12]}/><meshStandardMaterial color="#dfb78a"/></mesh>)}
 </group>;
 return <group><mesh position={[0,.65,0]}><cylinderGeometry args={[.09,.1,1.28,8]}/><meshStandardMaterial color="#8f765d"/></mesh><mesh position={[0,1.33,0]}><boxGeometry args={[.65,.43,.38]}/><meshStandardMaterial color="#de6a77"/></mesh><mesh position={[0,1.32,.22]}><boxGeometry args={[.39,.10,.05]}/><meshStandardMaterial color="#fbe9b8"/></mesh></group>;
}
class GardenCanvasBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(error:Error){console.warn('WebGL garden unavailable, using accessible plot controls',error.message)}
 render(){return this.state.failed?<div className="h-garden-fallback">3D пока не поддерживается на устройстве. Украшай сад через участки ниже 🌿</div>:this.props.children}
}
/** Newly planted flowers and trees grow smoothly using the actual 3D mesh scale. */
function GrowingDecoration({kind}:{kind:Kind}){
 const ref=useRef<THREE.Group>(null);
 const started=useRef(performance.now());
 const {invalidate}=useThree();
 useEffect(()=>{started.current=performance.now();invalidate()},[kind,invalidate]);
 useFrame(()=>{
  const t=Math.min(1,(performance.now()-started.current)/840);
  const spring=t*t*(3-2*t);
  if(ref.current)ref.current.scale.setScalar(Math.max(.015,spring));
  if(t<1)invalidate();
 });
 return <group ref={ref}><Decoration kind={kind}/></group>;
}
function GardenScene({placements,night,angle,zoom,onTile}:{placements:GardenDecoration[];night:boolean;angle:number;zoom:number;onTile:(i:number)=>void}){
 return <Canvas frameloop="demand" camera={{position:[7*zoom,8*zoom,10*zoom],fov:44}} shadows={false} gl={{antialias:true,alpha:true,powerPreference:'low-power'}}>
  <color attach="background" args={[night?'#193552':'#aee8f3']}/>
  <ambientLight intensity={night?.62:1.1}/>
  <hemisphereLight args={[night?'#b5c9ff':'#fff7de',night?'#244f6e':'#6dba7e',night?.85:1.15]}/>
  <directionalLight position={[-6,10,5]} intensity={night?1.3:2.1} color={night?'#c3d8ff':'#fff9e8'}/>
  <group rotation={[0,angle,0]}>
   <mesh position={[0,-.31,0]}><boxGeometry args={[6.45,.55,6.45]}/><meshStandardMaterial color="#957453"/></mesh>
   <mesh position={[0,-.03,0]}><boxGeometry args={[6.46,.08,6.46]}/><meshStandardMaterial color={night?'#386f5e':'#6cc887'}/></mesh>
   {Array.from({length:16},(_,i)=>{const x=slotX(i),z=slotZ(i);return <group key={i} position={[x,.03,z]}>
    <mesh onClick={e=>{e.stopPropagation();onTile(i)}} position={[0,.05,0]}><boxGeometry args={[1.34,.11,1.34]}/><meshStandardMaterial color={(i%4+Math.floor(i/4))%2?'#70ca84':'#80d78a'}/></mesh>
    {placements.find(p=>p.slot===i)&&<group onClick={e=>{e.stopPropagation();onTile(i)}}><GrowingDecoration key={placements.find(p=>p.slot===i)!.kind} kind={placements.find(p=>p.slot===i)!.kind as Kind}/></group>}
   </group>})}
  </group>
 </Canvas>;
}
export function HealthGarden({days,placements,night,today,onSaveGarden,onSaveDay}:{days:HealthDaily[];placements:GardenDecoration[];night:boolean;today:HealthDaily;onSaveGarden:(d:GardenDecoration[])=>void;onSaveDay:(d:HealthDaily)=>void}){
 const [item,setItem]=useState<Kind>('flower');
 const [angle,setAngle]=useState(0);
 const [zoom,setZoom]=useState(1);
 const [weather,setWeather]=useState<'sun'|'rain'>('sun');
 const [show3d,setShow3d]=useState(true);
 const progress=useMemo(()=>days.filter(d=>new Set(d.habits).size>=2).length,[days]);
 const unlocked=ITEMS.filter(i=>progress>=i.need);
 const selected=ITEMS.find(i=>i.kind===item)!;
 function place(slot:number){
  if(progress<selected.need)return;
  const old=placements.find(p=>p.slot===slot);
  const next=old?.kind===item?placements.filter(x=>x.slot!==slot):[...placements.filter(x=>x.slot!==slot),{slot,kind:item}];
  onSaveGarden(next);
 }
 function markFamily(id:string){
  const now=new Set(today.habits);
  if(now.has(id))now.delete(id);else now.add(id);
  onSaveDay({...today,habits:[...now]});
 }
 return <section className="h-garden" aria-label="Сад здоровья">
  <header className="h-garden-hero"><span>🌿 МОЙ САД ЗДОРОВЬЯ</span><h2>Поляна Миро</h2><p>С каждым днём у тебя появляются новые украшения. Вес и рост на сад не влияют.</p><div className="h-garden-miro"><MiroAvatar face="smile"/></div></header>
  <div className="h-garden-score"><div><span>🌻 Дни заботы о себе</span><strong>{progress}</strong></div><div><span>🎁 Открыто украшений</span><strong>{unlocked.length}/{ITEMS.length}</strong></div></div>
  <div className="h-garden-stage">
   <div className="h-garden-stage-bar"><strong>{night?'🌙 Ночная поляна':'☀️ Солнечная поляна'}</strong><button onClick={()=>setWeather(w=>w==='sun'?'rain':'sun')}>{weather==='sun'?'☁️ Дождик':'☀️ Солнце'}</button></div>
   {show3d?<div className="h-garden-canvas"><GardenCanvasBoundary><GardenScene key={night?'night':'day'} placements={placements} night={night} angle={angle} zoom={zoom} onTile={place}/></GardenCanvasBoundary></div>:<div className="h-garden-fallback">🌿 Режим списка: выбирай сектор ниже</div>}
   {weather==='rain'&&<div className="h-garden-rain" aria-hidden="true">╱　╱　╱　╱　╱　╱　╱　╱　╱</div>}
   <div className="h-garden-controls"><button onClick={()=>setAngle(x=>x+Math.PI/8)}>↻ Повернуть</button><button onClick={()=>setZoom(v=>Math.max(.7,v-.15))}>＋</button><button onClick={()=>setZoom(v=>Math.min(1.5,v+.15))}>－</button><button onClick={()=>setShow3d(x=>!x)}>{show3d?'▦ Список':'🌿 3D'}</button></div>
   <small>Нажми участок сада, чтобы посадить выбранный предмет. Нажми повторно, чтобы убрать его. На слабом телефоне можно использовать список.</small>
  </div>
  <div className="h-card"><div className="h-card-heading"><span className="h-card-icon">🎨</span><h2>Мастерская украшений</h2></div>
   <div className="h-garden-inventory">{ITEMS.map(x=><button key={x.kind} disabled={progress<x.need} className={item===x.kind?'chosen':''} onClick={()=>setItem(x.kind)}>
    <span>{x.emoji}</span><strong>{x.name}</strong><small>{progress>=x.need?'Доступно':'После '+x.need+' дней'}</small>
   </button>)}</div>
   <p>Выбрано: <strong>{selected.emoji} {selected.name}</strong>. {progress<selected.need?'Предмет пока закрыт.':'Можешь разместить в любом секторе.'}</p>
  </div>
  <div className="h-card"><div className="h-card-heading"><span className="h-card-icon">🗺️</span><h2>Участки сада</h2></div>
   <div className="h-garden-slots">{Array.from({length:16},(_,i)=>{const placed=placements.find(p=>p.slot===i);return <button key={i} onClick={()=>place(i)} aria-label={'Сектор '+(i+1)+(placed?' '+placed.kind:' пустой')}><strong>{i+1}</strong><span>{ITEMS.find(x=>x.kind===placed?.kind)?.emoji||'▫️'}</span></button>})}</div>
   <small className="h-muted">Сад и расставленные предметы сохраняются в семейном аккаунте. Без интернета можно продолжать пользоваться локальной копией.</small>
  </div>
  <div className="h-card"><div className="h-card-heading"><span className="h-card-icon">👨‍👩‍👦</span><h2>Семейные приключения</h2></div>
   <p>Делайте это вместе, когда есть желание и силы. Задания добровольные.</p>
   {FAMILY.map(x=><label key={x.id} className="h-garden-quest"><span>{x.emoji}</span><span><strong>{x.label}</strong><small>{x.detail}</small></span><input type="checkbox" checked={today.habits.includes(x.id)} onChange={()=>markFamily(x.id)}/></label>)}
   <p className="h-garden-hint">🌱 Новый день с двумя отмеченными полезными или семейными делами добавляет один день развития сада. Штрафов за пропуск нет.</p>
  </div>
 </section>;
}
