import {Suspense} from 'react'
import {MECH_MODELS,MiroMech} from './MiroMech'
import {useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import type {Group} from 'three'
import {PAINTS,useMiroWardrobe,type Wardrobe} from './miroWardrobe'
type V=[number,number,number]
function Ball({p,s,c,metal=0}:{p:V;s:V;c:string;metal?:number}){return <mesh position={p} scale={s}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={c} roughness={.48} metalness={metal}/></mesh>}
function Box({p,s,c,r=[0,0,0]}:{p:V;s:V;c:string;r?:V}){return <mesh position={p} rotation={r}><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.55}/></mesh>}
function Tube({p,r=[0,0,0],radius=.12,height=.6,c}:{p:V;r?:V;radius?:number;height?:number;c:string}){return <mesh position={p} rotation={r}><cylinderGeometry args={[radius,radius,height,16]}/><meshStandardMaterial color={c} roughness={.5}/></mesh>}
function Glow({p,s,c='#6cfff4'}:{p:V;s:V;c?:string}){return <mesh position={p} scale={s}><sphereGeometry args={[1,16,12]}/><meshBasicMaterial color={c}/></mesh>}
function LegacyMiroModel({look,rotation=0,animate=true}:{look:Wardrobe;rotation?:number;animate?:boolean}){
 const root=useRef<Group>(null),k=look.skin,a=look.accessory
 const original:Record<string,string>={'skin-classic':'#effaff','skin-spider':'#d42c47','skin-rabbit':'#eac8e1','skin-astro':'#f3f5f9','skin-diver':'#269bba','skin-explorer':'#b39358','skin-dragon':'#79be78'}
 const c=PAINTS[look.paint]||original[k]||original['skin-classic'],secondary=k==='skin-spider'?'#2855b3':k==='skin-explorer'?'#536749':'#bdddea'
 useFrame(({clock})=>{if(root.current){root.current.rotation.y=rotation+(animate?Math.sin(clock.elapsedTime*.8)*.12:0);root.current.position.y=animate?Math.sin(clock.elapsedTime*1.8)*.045:0}})
 return <group ref={root}>
 <Ball p={[0,.57,0]} s={[.45,.49,.34]} c={c} metal={k==='skin-rabbit'?0:.15}/>
 <Ball p={[0,1.28,0]} s={[.59,.48,.42]} c={c} metal={.12}/>
 <Ball p={[0,1.28,.28]} s={[.48,.33,.20]} c={k==='skin-spider'?'#222c48':'#102e48'}/>
 {[-1,1].map(d=><group key={d}>{k!=='skin-spider'&&<><Ball p={[d*.21,1.32,.451]} s={[.104,.13,.035]} c="#c3fff5"/><Glow p={[d*.21,1.33,.48]} s={[.045,.061,.015]}/></>}<Ball p={[d*.54,.66,0]} s={[.15,.29,.15]} c={secondary}/><Ball p={[d*.55,.43,.04]} s={[.14,.14,.14]} c={c}/><Ball p={[d*.21,.12,.01]} s={[.18,.12,.23]} c={secondary}/></group>)}
 <Glow p={[0,1.13,.445]} s={[.074,.027,.014]}/><Glow p={[0,.66,.34]} s={[.095,.065,.025]}/>
 {k==='skin-spider'&&<><Ball p={[0,.66,.36]} s={[.045,.11,.025]} c="#192139"/>{[-1,1].flatMap(d=>[0,1,2,3].map(i=><Box key={d+':'+i} p={[d*.105,.6+i*.045,.385]} s={[.18,.025,.025]} r={[0,0,d*(i-1.5)*.45]} c="#192139"/>))}{[-1,1].map(d=><group key={d}><Ball p={[d*.24,1.33,.433]} s={[.19,.13,.06]} c="#17213c"/><Ball p={[d*.24,1.34,.485]} s={[.14,.09,.035]} c="#fff"/></group>)}<Box p={[0,.29,.01]} s={[.63,.15,.57]} c="#2855b3"/></>}
 {k==='skin-rabbit'&&<>{[-1,1].map(d=><group key={d} rotation={[0,0,d*-.14]}><Ball p={[d*.23,1.93,0]} s={[.17,.43,.13]} c={c}/><Ball p={[d*.23,1.96,.085]} s={[.09,.30,.065]} c="#ec8fb6"/><Ball p={[d*.33,1.13,.37]} s={[.13,.08,.07]} c="#ffe3e6"/></group>)}<Ball p={[0,.55,-.36]} s={[.21,.21,.21]} c="#fff3fb"/><Ball p={[0,1.14,.48]} s={[.065,.05,.037]} c="#e58bab"/></>}
 {k==='skin-astro'&&<><mesh position={[0,1.3,0]}><sphereGeometry args={[.66,32,24]}/><meshStandardMaterial color="#bbecff" transparent opacity={.16} roughness={.1} depthWrite={false}/></mesh><Tube p={[0,.96,0]} radius={.49} height={.10} c="#d5e4ed"/><Box p={[0,.57,-.34]} s={[.45,.57,.25]} c="#d9ebfa"/>{[-1,1].map(d=><Tube key={d} p={[d*.23,.55,-.47]} radius={.12} height={.62} c="#ef8b53"/>)}</>}
 {k==='skin-diver'&&<><Box p={[0,1.28,.38]} s={[.88,.37,.18]} c="#223951"/><Ball p={[0,1.28,.49]} s={[.39,.155,.055]} c="#83dbe9"/><Tube p={[.61,1.44,.02]} height={.72} c="#edb54c"/><Tube p={[0,.63,-.40]} radius={.21} height={.71} c="#e4b445"/>{[-1,1].map(d=><Ball key={d} p={[d*.23,.09,.2]} s={[.21,.06,.37]} c="#eeb34c"/>)}</>}
 {k==='skin-explorer'&&<><Tube p={[0,1.62,0]} radius={.73} height={.07} c="#92734b"/><Ball p={[0,1.75,0]} s={[.44,.27,.4]} c={c}/><Tube p={[0,1.62,0]} radius={.46} height={.10} c="#483b33"/><Box p={[0,.43,.32]} s={[.68,.13,.055]} c="#503b2e"/><Box p={[0,.43,.36]} s={[.15,.12,.055]} c="#e5c26d"/><Box p={[-.17,.7,.31]} s={[.18,.16,.09]} c="#d3ba83"/></>}
 {k==='skin-dragon'&&<>{[-1,1].map(d=><group key={d}><mesh position={[d*.31,1.79,0]} rotation={[0,0,d*-.3]}><coneGeometry args={[.15,.39,12]}/><meshStandardMaterial color="#e6c989"/></mesh><Ball p={[d*.55,.83,-.24]} s={[.38,.28,.10]} c="#438f79"/></group>)}{[0,1,2,3].map(i=><mesh key={i} position={[0,1.65-i*.21,-.35]} rotation={[-.65,0,0]}><coneGeometry args={[.12,.23,8]}/><meshStandardMaterial color="#edbe63"/></mesh>)}{[0,1,2,3].map(i=><Ball key={i} p={[i*.13,.33+i*.035,-.38-i*.16]} s={[.18-i*.027,.13-i*.018,.20]} c={c}/>)}</>}
 {a==='acc-wings'&&[-1,1].map(d=><group key={d}><Box p={[d*.63,.69,-.37]} s={[.38,.13,.37]} r={[0,0,d*.35]} c="#c6d8ec"/><Tube p={[d*.77,.59,-.38]} radius={.09} height={.30} c="#43618a"/><Glow p={[d*.77,.40,-.38]} s={[.08,.12,.08]}/></group>)}
 {a==='acc-headphones'&&<>{[-1,1].map(d=><Ball key={d} p={[d*.58,1.29,0]} s={[.14,.24,.21]} c="#344e70"/>)}<mesh position={[0,1.27,0]} rotation={[0,0,0]}><torusGeometry args={[.59,.045,10,32,Math.PI]}/><meshStandardMaterial color="#344e70"/></mesh></>}
 {a==='acc-antenna'&&<><Tube p={[0,1.79,0]} radius={.035} height={.26} c="#354f70"/><Glow p={[0,1.96,0]} s={[.10,.10,.10]} c="#ffc96d"/></>}
 {a==='acc-pack'&&<><Box p={[0,.58,-.39]} s={[.49,.55,.28]} c="#c57d48"/><Box p={[0,.72,-.55]} s={[.43,.16,.07]} c="#e8b36d"/></>}
 </group>
}
export function MiroModel(props:{look:Wardrobe;rotation?:number;animate?:boolean}){return MECH_MODELS[props.look.skin]?<Suspense fallback={null}><MiroMech {...props}/></Suspense>:<LegacyMiroModel {...props}/>}
export function MiroWorldActor({position=[-1.7,.65,1.1],scale=.42}:{position?:V;scale?:number}){
 const {wardrobe,ready}=useMiroWardrobe()
 if(!ready||wardrobe.skin==='skin-classic'&&wardrobe.accessory==='acc-none'&&wardrobe.paint==='paint-original')return null
 return <group position={position} scale={scale} rotation={[0,.25,0]} onClick={e=>{if(e.delta>8)return;e.stopPropagation();window.dispatchEvent(new Event('moymir-open-robot'))}}><MiroModel look={wardrobe}/></group>
}
