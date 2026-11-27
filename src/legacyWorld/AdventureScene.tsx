import {useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import type {Group} from 'three'
import {ADVENTURES} from './adventureGame'
import type {V} from './adventureGame'
import type {AdventureView} from './AdventureHub'
function Findable({position,color,focused,onCollect}:{position:V;color:string;focused:boolean;onCollect:()=>void}){
 const ref=useRef<Group>(null)
 useFrame(({clock})=>{if(ref.current){ref.current.position.y=.12+Math.sin(clock.elapsedTime*2.1)*.055;ref.current.rotation.y=clock.elapsedTime*.8}})
 return <group position={position} onClick={e=>{if(e.delta>9)return;e.stopPropagation();onCollect()}}>
  <mesh position={[0,.17,0]}><sphereGeometry args={[.29,10,8]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
  <group ref={ref}><mesh><octahedronGeometry args={[focused?.19:.13,0]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={focused?.85:.28} roughness={.35}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.12,0]}><torusGeometry args={[.21,.017,6,24]}/><meshBasicMaterial color={color} transparent opacity={focused?1:.45}/></mesh></group>
 </group>
}
function Box({p,s,c}:{p:V;s:V;c:string}){return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={c}/></mesh>}
function Orb({p,r,c,glow=false}:{p:V;r:number;c:string;glow?:boolean}){return <mesh position={p}><sphereGeometry args={[r,12,8]}/><meshStandardMaterial color={c} emissive={glow?c:'#000000'} emissiveIntensity={glow?.65:0}/></mesh>}
function Crafted({id,position}:{id:string;position:V}){
 return <group position={position} raycast={()=>null}>
 {id==='m-lantern'||id==='t-star-lamp'?<><Box p={[0,.055,0]} s={[.29,.11,.29]} c="#937d58"/><Box p={[0,.33,0]} s={[.07,.55,.07]} c="#8e6b45"/><Box p={[0,.66,0]} s={[.3,.06,.3]} c="#70523c"/><Orb p={[0,.51,0]} r={.15} c={id==='m-lantern'?'#ffe29b':'#b9d9ff'} glow/><pointLight position={[0,.55,0]} intensity={.55} distance={1.7} color="#ffdfa1"/></>:id==='m-flower'?<><Box p={[0,.07,0]} s={[.34,.14,.34]} c="#be8057"/><Box p={[0,.28,0]} s={[.05,.42,.05]} c="#4ba66d"/>{Array.from({length:7},(_,i)=><Orb key={i} p={[Math.cos(i*6.283/7)*.14,.54+Math.sin(i*6.283/7)*.14,0]} r={.09} c="#ffd067"/>)}<Orb p={[0,.54,.035]} r={.1} c="#dd9356"/></>:id==='t-feeder'?<><Box p={[0,.05,0]} s={[.34,.1,.34]} c="#946844"/><Box p={[0,.28,0]} s={[.08,.5,.08]} c="#916344"/><Box p={[0,.54,0]} s={[.48,.11,.36]} c="#d6a36b"/><Box p={[0,.78,0]} s={[.54,.1,.45]} c="#b96944"/>{[-.13,0,.13].map(x=><Orb key={x} p={[x,.64,0]} r={.065} c="#a16a3b"/>)}</>:id==='s-beacon'?<><Box p={[0,.11,0]} s={[.42,.22,.42]} c="#8ba9c5"/><Box p={[0,.38,0]} s={[.065,.55,.065]} c="#b4cfdf"/><Orb p={[0,.68,0]} r={.13} c="#6dffcf" glow/><mesh position={[0,.61,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.23,.025,7,24]}/><meshBasicMaterial color="#81ebff"/></mesh></>:<><Box p={[0,.12,0]} s={[.46,.24,.42]} c="#9cb4d4"/><mesh position={[0,.43,0]}><cylinderGeometry args={[.17,.17,.45,16]}/><meshStandardMaterial color="#78caff" transparent opacity={.68}/></mesh><Orb p={[0,.43,0]} r={.12} c="#dcb1ff" glow/><Box p={[0,.67,0]} s={[.32,.08,.32]} c="#aac0db"/></>}
 </group>
}
export function AdventureScene({view}:{view?:AdventureView}){
 if(!view)return null
 return <group>{ADVENTURES[view.world].map(m=><group key={m.id}>{view.active&&m.treasures.filter(t=>view.points>=t.at&&!view.state.found.includes(t.id)).map(t=><Findable key={t.id} position={t.position} color={t.color} focused={view.focus?.id===t.id} onCollect={()=>view.collect(t.id)}/>)}{view.state.crafted.includes(m.recipe.id)&&<Crafted id={m.recipe.id} position={m.recipe.position}/>}</group>)}</group>
}
export function AdventureFocus({view}:{view?:AdventureView}){const t=view?.focus&&ADVENTURES[view.world].flatMap(m=>m.treasures).find(t=>t.id===view.focus?.id);return view?.active&&t&&!view.state.found.includes(t.id)&&view.points>=t.at?<div className="adventure-focus" role="status"><span>🔎 {t.clue} Нажми на светящийся предмет в мире.</span><button onClick={()=>view.collect(t.id)}>Подобрать находку</button></div>:null}
