import {useEffect,useMemo,useRef,useState} from 'react'
import {useFrame} from '@react-three/fiber'
import {BufferAttribute,BufferGeometry,DoubleSide,Group} from 'three'
import type {ReactNode} from 'react'
import './LivingWorld.css'
export type Weather='sun'|'rain'|'wind'
export type DayMode='auto'|'day'|'night'
export function useLivingSettings(key:string,theme:'day'|'night'){
 const [mode,setMode]=useState<DayMode>(()=>{try{const v=localStorage.getItem(key+':sky');return v==='day'||v==='night'?v:'auto'}catch{return 'auto'}})
 const [weather,setWeather]=useState<Weather>('sun')
 const [hour,setHour]=useState(()=>new Date().getHours())
 useEffect(()=>{const t=window.setInterval(()=>setHour(new Date().getHours()),60000);return()=>clearInterval(t)},[])
 useEffect(()=>{try{localStorage.setItem(key+':sky',mode)}catch{}},[key,mode])
 return {mode,setMode,weather,setWeather,sky:(mode==='auto'?(hour>=7&&hour<20?'day':'night'):mode) as 'day'|'night'}
}
export function SkyControls({mode,setMode,weather,setWeather}:{mode:DayMode;setMode:(v:DayMode)=>void;weather:Weather;setWeather:(v:Weather)=>void}){
 return <div className="living-controls" aria-label="Погода и освещение"><div className="living-control-row"><span>Небо</span>{(['auto','day','night'] as const).map((v,i)=><button type="button" key={v} aria-pressed={mode===v} onClick={()=>setMode(v)}>{['🕒 Авто','☀️ День','🌙 Ночь'][i]}</button>)}</div><div className="living-control-row"><span>Погода</span>{(['sun','rain','wind'] as const).map((v,i)=><button type="button" key={v} aria-pressed={weather===v} onClick={()=>setWeather(v)}>{['Ясно','🌧 Дождь','🍃 Ветер'][i]}</button>)}</div></div>
}
function Butterfly({index,tree}:{index:number;tree:boolean}){
 const ref=useRef<Group>(null),left=useRef<Group>(null),right=useRef<Group>(null)
 useFrame(({clock})=>{const t=clock.elapsedTime*.72+index*2.1;if(ref.current){ref.current.position.set(Math.cos(t)*2.05,.42+(tree?1.5:0)+.28*Math.sin(t*1.7+index),Math.sin(t)*1.45);ref.current.rotation.y=-t}const flap=Math.sin(clock.elapsedTime*15+index)*.85;if(left.current)left.current.rotation.z=flap;if(right.current)right.current.rotation.z=-flap})
 const color=['#ff9f52','#e6a5ff','#55cef0'][index%3]
 return <group ref={ref}><group ref={left}><mesh position={[-.075,0,0]} rotation={[-Math.PI/2,0,0]} scale={[1,.75,1]}><circleGeometry args={[.092,9]}/><meshBasicMaterial color={color} side={DoubleSide}/></mesh></group><group ref={right}><mesh position={[.075,0,0]} rotation={[-Math.PI/2,0,0]} scale={[1,.75,1]}><circleGeometry args={[.092,9]}/><meshBasicMaterial color={color} side={DoubleSide}/></mesh></group><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.014,.014,.17,5]}/><meshBasicMaterial color="#754a39"/></mesh></group>
}
function Bird({index,tree}:{index:number;tree:boolean}){const ref=useRef<Group>(null),a=useRef<Group>(null),b=useRef<Group>(null);useFrame(({clock})=>{let t=clock.elapsedTime*.36+index*2.5;if(ref.current){ref.current.position.set(Math.cos(t)*3.45,(tree?5.7:3.35)+Math.sin(t*1.9)*.33,Math.sin(t)*2.65);ref.current.rotation.y=-t}let f=Math.sin(clock.elapsedTime*8+index)*.45;if(a.current)a.current.rotation.z=f;if(b.current)b.current.rotation.z=-f});return <group ref={ref}><mesh scale={[.7,.6,1.3]}><sphereGeometry args={[.13,10,7]}/><meshStandardMaterial color="#eff5f6"/></mesh><mesh position={[0,.05,.15]}><sphereGeometry args={[.075,8,6]}/><meshStandardMaterial color="#e5bd78"/></mesh>{[-1,1].map((s,i)=><group key={s} ref={i===0?a:b}><mesh position={[s*.16,0,0]} scale={[1,.13,.45]}><sphereGeometry args={[.19,8,6]}/><meshStandardMaterial color="#9eafc5"/></mesh></group>)}</group>}
function Particles({weather,night,tree}:{weather:Weather;night:boolean;tree:boolean}){
 const rain=weather==='rain',wind=weather==='wind',count=rain?140:wind?36:44
 const height=tree?7:4.5
 const geo=useMemo(()=>{const g=new BufferGeometry();const data=new Float32Array(count*3);for(let i=0;i<count;i++){data[i*3]=Math.sin(i*18.9)*3.4;data[i*3+1]=(i*.371%1)*height;data[i*3+2]=Math.cos(i*4.7)*2.6}g.setAttribute('position',new BufferAttribute(data,3));return g},[count,height])
 useEffect(()=>()=>geo.dispose(),[geo])
 useFrame(({clock},dt)=>{const attr=geo.getAttribute('position');const a=attr.array as Float32Array;for(let i=0;i<count;i++){const j=i*3;if(rain){a[j+1]-=Math.min(dt,.06)*7;if(a[j+1]<0)a[j+1]=height;a[j]+=.13*dt;if(a[j]>3.5)a[j]=-3.5}else if(wind){a[j+1]-=Math.min(dt,.06)*.6;a[j]+=.9*dt;if(a[j+1]<.05)a[j+1]=height;if(a[j]>3.5)a[j]=-3.5}else{a[j+1]+=.003*Math.sin(clock.elapsedTime*2+i);a[j]+=.003*Math.cos(clock.elapsedTime+i)}}attr.needsUpdate=true})
 if(!rain&&!wind&&!night)return null
 return <points geometry={geo} frustumCulled={false} raycast={()=>null}><pointsMaterial color={rain?'#d7eaff':wind?'#e6ae65':'#ffe984'} size={rain?.045:wind?.08:.055} transparent opacity={rain?.72:.9} depthWrite={false}/></points>
}
export function LivingAtmosphere({weather,sky,world,points}:{weather:Weather;sky:'day'|'night';world:1|2;points:number}){const tree=world===2;return <group>{sky==='day'&&weather!=='rain'&&points>=80&&[0,1,2].map(i=><Butterfly key={i} index={i} tree={tree}/>)}{sky==='day'&&weather!=='rain'&&points>=240&&[0,1].map(i=><Bird key={i} index={i} tree={tree}/>)}<Particles weather={weather} night={sky==='night'} tree={tree}/></group>}
type Furniture='bed'|'desk'|'plant'
type RoomLayout=Record<Furniture,number>
const original:RoomLayout={bed:0,desk:0,plant:0}
const positions:Record<Furniture,[number,number,number][]>={
 bed:[[-.74,.23,-.42],[.65,.23,-.42],[-.72,.23,.43]],
 desk:[[.66,.31,.38],[-.72,.31,.39],[.66,.31,-.45]],
 plant:[[1.08,.20,-.72],[-1.08,.20,-.72],[1.08,.20,.72]]
}
function RoomBox({p,s,c}:{p:[number,number,number];s:[number,number,number];c:string}){return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.8}/></mesh>}
export function useRoom(key:string){
 const [layout,setLayout]=useState<RoomLayout>(()=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v?{bed:[0,1,2].includes(v.bed)?v.bed:0,desk:[0,1,2].includes(v.desk)?v.desk:0,plant:[0,1,2].includes(v.plant)?v.plant:0}:original}catch{return original}})
 const [selected,setSelected]=useState<Furniture>('bed')
 const save=(next:RoomLayout)=>{setLayout(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{}}
 const move=()=>{const next={...layout};for(let i=1;i<=3;i++){next[selected]=(layout[selected]+i)%3;const a=positions[selected][next[selected]];if(Object.keys(next).every(k=>k===selected||Math.hypot(a[0]-positions[k as Furniture][next[k as Furniture]][0],a[2]-positions[k as Furniture][next[k as Furniture]][2])>.65)){save(next);return}}}
 return {layout,selected,setSelected,move,reset:()=>save(original)}
}
export function RoomScene({layout,selected,onSelect,lights,world}:{layout:RoomLayout;selected:Furniture;onSelect:(v:Furniture)=>void;lights:boolean;world:1|2|3}){
 return <group><RoomBox p={[0,-.08,0]} s={[2.8,.16,2.3]} c={world===3?"#647c9b":"#b18154"}/>{Array.from({length:7},(_,i)=><RoomBox key={i} p={[-1.2+i*.4,.015,0]} s={[.38,.03,2.25]} c={world===3?(i%2?'#8196ab':'#a0b1c5'):(i%2?'#d6ae7d':'#e4bf91')}/>)}<RoomBox p={[0,.79,-1.12]} s={[2.8,1.6,.12]} c={world===3?'#607b9b':world===1?'#f3ca92':'#d2a16c'}/><RoomBox p={[-1.34,.79,0]} s={[.12,1.6,2.2]} c={world===3?"#9caec6":"#e2b782"}/><RoomBox p={[.35,1.02,-1.035]} s={[.8,.65,.04]} c={world===3?(lights?'#7de9ff':'#204d7e'):(lights?'#ffde8e':'#8ccfe9')}/><RoomBox p={[.35,1.02,-1]} s={[.04,.65,.06]} c="#fff5dd"/><RoomBox p={[.35,1.02,-1]} s={[.8,.04,.06]} c="#fff5dd"/><RoomBox p={[0,.038,.25]} s={[.9,.025,.65]} c="#75bcb2"/>
 {(['bed','desk','plant'] as Furniture[]).map(k=><group key={k} position={positions[k][layout[k]]} onClick={e=>{if(e.delta>8)return;e.stopPropagation();onSelect(k)}}>
 {selected===k&&<mesh position={[0,-positions[k][layout[k]][1]+.055,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.36,.41,32]}/><meshBasicMaterial color="#36b78d" side={DoubleSide}/></mesh>}
 {k==='bed'?<><RoomBox p={[0,0,0]} s={[.69,.26,.91]} c="#a46b45"/><RoomBox p={[0,.17,0]} s={[.64,.13,.85]} c="#fff4d8"/><RoomBox p={[0,.25,.14]} s={[.62,.07,.49]} c="#789fe7"/><RoomBox p={[0,.25,-.27]} s={[.45,.1,.23]} c="#fdf0d0"/></>:k==='desk'?<><RoomBox p={[0,.14,0]} s={[.64,.1,.46]} c="#ac744b"/>{[-.23,.23].map(x=><RoomBox key={x} p={[x,-.09,0]} s={[.09,.44,.34]} c="#93613c"/>)}<RoomBox p={[.08,.22,0]} s={[.26,.06,.23]} c="#6895ce"/><RoomBox p={[-.2,.31,-.1]} s={[.09,.25,.09]} c="#f0b251"/></>:<><mesh><cylinderGeometry args={[.15,.11,.24,12]}/><meshStandardMaterial color="#c47856"/></mesh>{[-1,0,1].map((v,i)=><mesh key={i} position={[v*.09,.22+i*.04,0]} scale={[.7,1.5,.6]}><sphereGeometry args={[.16,10,7]}/><meshStandardMaterial color={i===1?'#50a05d':'#79bd71'}/></mesh>)}</>}
 </group>)}
 {lights&&<pointLight position={[.2,1.6,.2]} intensity={2.1} distance={4} color="#ffdf9a"/>}</group>
}
export function RoomControls({room,lights,onLight,onClose,space=false}:{room:ReturnType<typeof useRoom>;lights:boolean;onLight:()=>void;onClose:()=>void;space?:boolean}){return <div className="living-controls"><strong>{space?"🚀 Жилой модуль":"🏡 Моя комната"}</strong><div className="living-control-row">{(['bed','desk','plant'] as Furniture[]).map((v,i)=><button key={v} aria-pressed={room.selected===v} onClick={()=>room.setSelected(v)}>{['🛏 Кровать','📚 Стол','🪴 Растение'][i]}</button>)}</div><div className="living-control-row"><button onClick={room.move}>↔ Переставить</button><button onClick={room.reset}>↺ Вернуть мебель</button><button onClick={onLight}>{lights?'💡 Погасить':'💡 Зажечь'}</button><button onClick={onClose}>Выйти из комнаты</button></div><small>Расстановка мебели сохраняется на этом телефоне.</small></div>}
export function PetActions({name,children}:{name:string;children:ReactNode}){return <section className="living-pet"><strong>{name}</strong><div className="living-control-row">{children}</div><small>Забота о питомце не требует монет и не начисляет очки.</small></section>}
