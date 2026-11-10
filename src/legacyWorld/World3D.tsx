import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Group } from 'three'
import { WORLD_01_OBJECTS, nextWorldObject, unlockedWorldObjects, WORLD_01_END } from './world01'
import './World3D.css'
import { MiroRobot } from './MiroRobot'
import { AnimatedTreehousePiece } from './TreehouseWorld'
import { TREEHOUSE_STAGES } from './treehouseStages'
import { DogActor } from './DogActor'

function Block({position=[0,0,0],size=[1,1,1],color='#ffffff',round=0.07,rotation=[0,0,0]}:{position?:[number,number,number];size?:[number,number,number];color?:string;round?:number;rotation?:[number,number,number]}) {
 // Stable geometry per mesh: previous code created a new, undisposed primitive on each render.
 const [w,h,d]=size;
 const geometry=useMemo(()=>new RoundedBoxGeometry(w,h,d,3,Math.min(round,w/3,h/3,d/3)),[w,h,d,round]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh position={position} rotation={rotation} geometry={geometry} castShadow receiveShadow>
   <meshStandardMaterial color={color} roughness={0.72}/>
 </mesh>
}
function Ball({position,size,color}:{position:[number,number,number];size:number;color:string}) {
 return <mesh position={position} castShadow><sphereGeometry args={[size,18,12]}/><meshStandardMaterial color={color} roughness={0.75}/></mesh>
}
function Flower({x,z,tint='#ff69a2'}:{x:number;z:number;tint?:string}) {
 return <group position={[x,0,z]}><mesh position={[0,.12,0]}><cylinderGeometry args={[.025,.035,.24,7]}/><meshStandardMaterial color="#4c9469"/></mesh>{Array.from({length:5},(_,i)=>{
 const a=i*Math.PI*2/5
 return <Ball key={i} position={[Math.cos(a)*.09,.28,Math.sin(a)*.09]} size={.095} color={tint}/>
 })}<Ball position={[0,.29,0]} size={.08} color="#ffe39a"/></group>
}
function Tree({part}:{part:string}) {
 const x=-1.35,z=-.54
 return <group position={[x,0,z]}>
 {part==='sprout'&&<><Block position={[0,.14,0]} size={[.06,.28,.07]} color="#589e4e"/><Ball position={[-.11,.29,0]} size={.14} color="#7dc06b"/></>}
 {part==='trunk'&&<><mesh position={[0,.92,0]} castShadow><cylinderGeometry args={[.18,.3,1.85,10]}/><meshStandardMaterial color="#a96b42"/></mesh><Block position={[.3,1.25,0]} size={[.6,.18,.2]} rotation={[0,0,-.48]} color="#a96b42"/></>}
 {part==='crown'&&[[-.52,2.1,0,.62],[0,2.55,0,.76],[.55,2.17,0,.63],[0,1.95,.4,.55]].map(([a,b,c,r],i)=><Ball key={i} position={[a,b,c]} size={r} color={['#289f49','#39bc55','#218c42','#5fcf62'][i]}/>)}
 {part==='apples'&&[
 [-.70,2.08,.58],[.29,2.59,.79],[.78,2.16,.53],
 [-.12,1.78,.88],[-.37,2.84,.63],[.58,2.40,.75],
 ].map(([a,b,c],i)=><group key={i}>
  <Ball position={[a,b,c]} size={.165} color={i%2?'#f73c31':'#e82325'}/>
  <Block position={[a+.018,b+.175,c]} size={[.035,.08,.035]} color="#73512d" round={.01}/>
  <Ball position={[a+.075,b+.183,c]} size={.055} color="#4ba947"/>
 </group>)}
 </group>
}
function House({part}:{part:string}) {
 const x=.65,z=-.12
 return <group position={[x,0,z]}>
 {part==='blueprint'&&<Block position={[0,.025,0]} size={[2.05,.05,1.72]} color="#e2c99a"/>}
 {part==='foundation'&&<Block position={[0,.18,0]} size={[2.08,.36,1.76]} color="#aaa49a"/>}
 {part==='wallfront'&&<Block position={[0,1.07,.81]} size={[1.82,1.55,.16]} color="#ffd083"/>}
 {part==='wallback'&&<Block position={[0,1.07,-.81]} size={[1.82,1.55,.16]} color="#f4b15d"/>}
 {part==='wallleft'&&<Block position={[-.89,1.07,0]} size={[.16,1.55,1.55]} color="#e9a359"/>}
 {part==='wallright'&&<Block position={[.89,1.07,0]} size={[.16,1.55,1.55]} color="#ffe0a0"/>}
 {part==='door'&&<><Block position={[-.39,.84,.922]} size={[.58,1.08,.08]} color="#986148"/><Ball position={[-.17,.87,1]} size={.045} color="#ffe0a5"/></>}
 {part==='window'&&<><Block position={[.35,1.2,.93]} size={[.57,.55,.1]} color="#fff6d1"/><Block position={[.35,1.2,.992]} size={[.44,.43,.04]} color="#8fd5fa"/><Block position={[.35,1.2,1.021]} size={[.055,.48,.06]} color="#fffbec"/><Block position={[.35,1.2,1.021]} size={[.47,.05,.06]} color="#fffbec"/></>}
 {part==='roofleft'&&<Block position={[-.49,2.16,0]} size={[1.38,.18,2.1]} color="#ee4934" rotation={[0,0,.58]}/>}
 {part==='roofright'&&<Block position={[.49,2.16,0]} size={[1.38,.18,2.1]} color="#d93428" rotation={[0,0,-.58]}/>}
 {part==='chimney'&&<><Block position={[.58,2.57,-.48]} size={[.34,.83,.34]} color="#d48357"/><Block position={[.58,2.98,-.48]} size={[.44,.12,.44]} color="#a8553b"/></>}
 {part==='smoke'&&<Smoke/>}
 {part==='lamp'&&<><Block position={[-1.2,.9,1]} size={[.07,1.8,.07]} color="#765842"/><Ball position={[-1.2,1.7,1]} size={.16} color="#ffdda2"/></>}
 {part==='steps'&&<><Block position={[-.39,.21,1.13]} size={[.81,.22,.46]} color="#cfaa83"/><Block position={[-.39,.13,1.5]} size={[.93,.12,.42]} color="#dbb78d"/></>}
 </group>
}
function Smoke() {
 const ref=useRef<Group>(null)
 useFrame(({clock})=>{if(ref.current)ref.current.position.y=Math.sin(clock.elapsedTime*.8)*.16})
 return <group ref={ref}>{[0,1,2].map(i=><Ball key={i} position={[1.25+i*.08,3.2+i*.34,-.6]} size={.14+i*.055} color="#f5f8f4"/>)}</group>
}
function Pond(){
 const ref=useRef<Group>(null)
 useFrame(({clock})=>{if(ref.current)ref.current.scale.setScalar(1+Math.sin(clock.elapsedTime*1.7)*.025)})
 return <group position={[1.6,.04,1.35]}><mesh rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[.74,34]}/><meshStandardMaterial color="#32b6e3"/></mesh><group ref={ref}><mesh position={[0,.014,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.64,34]}/><meshStandardMaterial color="#22a6e7" transparent opacity={.88}/></mesh></group></group>
}
function HappyDog({points}:{points:number}) {
 return <DogActor points={points}/>
}
function Extras({part,points}:{part:string;points:number}){
 switch(part){
 case 'grass':return <group>{[[-2,0,-1],[2,0,-1],[-2,0,.8],[.2,0,1.9],[-.7,0,1.2]].map(([x,y,z],i)=><Ball key={i} position={[x,y+.08,z]} size={.13} color="#38b94b"/>)}</group>
 case 'flowers':return <group>{[[-2.2,-.5],[-2.1,.35],[-.85,1.4],[-1.9,1.4]].map(([x,z],i)=><Flower key={i} x={x} z={z} tint={i%2?'#fff0b5':'#ff65a6'}/>)}</group>
 case 'pebbles':return <group>{Array.from({length:5},(_,i)=><Ball key={i} position={[.2+i*.18,.07,1.12+i*.14]} size={.13} color="#e4d3ae"/>)}</group>
 case 'sprout':case 'trunk':case 'crown':case 'apples':return <Tree part={part}/>
 case 'blueprint':case 'foundation':case 'wallfront':case 'wallback':case 'wallleft':case 'wallright':case 'door':case 'window':case 'roofleft':case 'roofright':case 'chimney':case 'smoke':case 'lamp':case 'steps':return <House part={part}/>
 case 'fence':return <group>{Array.from({length:5},(_,i)=><group key={i} position={[1.46+i*.29,0,-1.6]}><Block position={[0,.42,0]} size={[.11,.83,.11]} color="#fff3d8"/><Block position={[0,.62,.03]} size={[.19,.15,.12]} color="#fff9e9"/></group>)}<Block position={[2.06,.48,-1.6]} size={[1.5,.08,.08]} color="#fff3d8"/></group>
 case 'bench':return <group position={[-1.95,0,1.07]}>
  {[-.46,.46].flatMap(x=>[-.23,.23].map(z=><Block key={x+'-'+z} position={[x,.26,z]} size={[.12,.48,.13]} color="#65452f"/>))}
  <Block position={[0,.52,0]} size={[1.22,.15,.56]} color="#a66b3f"/>
  {[-.46,.46].map(x=><Block key={x} position={[x,.79,-.24]} size={[.11,.49,.13]} color="#765037"/>)}
  <Block position={[0,.85,-.25]} size={[1.21,.29,.12]} color="#bf804c"/>
  <Block position={[0,1.05,-.25]} size={[1.21,.10,.12]} color="#a36b43"/>
 </group>
 case 'flowerbed':return <group>{[[1.95,-.88],[2.27,-.99],[2.51,-.73]].map(([x,z],i)=><Flower key={i} x={x} z={z} tint={i%2?'#f15aa8':'#ffbd48'}/>)}</group>
 case 'mailbox':return <group position={[-2.1,0,.1]}><Block position={[0,.53,0]} size={[.1,1.06,.12]} color="#85674a"/><Block position={[0,1.12,0]} size={[.43,.35,.35]} color="#d76a64"/></group>
 case 'garden':return <group position={[-2.05,0,-1.48]}>
  <Block position={[0,.10,0]} size={[1.08,.18,.56]} color="#75503b" round={.03}/>
  {[-.35,0,.35].map((x,i)=><group key={i}>
    <Ball position={[x,.22,-.04]} size={.145} color={i===1?'#f4a44f':'#55ad4a'}/>
    <Ball position={[x-.06,.38,-.06]} size={.085} color="#3e9f4d"/>
    <Ball position={[x+.06,.39,-.03]} size={.085} color="#58b74e"/>
  </group>)}
 </group>
 case 'pond':return <Pond/>
 case 'lily':return <group position={[1.6,.08,1.35]}><Ball position={[.13,.02,0]} size={.17} color="#6db56c"/><Flower x={.13} z={0} tint="#f9c6e4"/></group>
 case 'dog':return <HappyDog points={points}/>
 case 'celebration':return <group>{Array.from({length:8},(_,i)=><Ball key={i} position={[Math.sin(i*2.5)*2,1.9+i*.12,Math.cos(i*2.1)*1.7]} size={.045} color="#ffe2a1"/>)}</group>
 default:return null
 }
}
function Appearing({id,at,points}:{id:string;at:number;points:number}) {
 const ref=useRef<Group>(null)
 // Keep the initial scale stable across React rerenders. A dynamic JSX scale
 // used to set it straight to 1, skipping the entire appearance animation.
 const [initialScale]=useState(()=>points>=at?1:.001)
 useFrame((_,dt)=>{
  const group=ref.current
  if(!group)return
  const target=points>=at?1:.001
  const factor=1-Math.exp(-Math.min(dt,.05)*3.1)
  const current=group.scale.y
  const next=current+(target-current)*factor
  group.scale.set(next,next,next)
  group.visible=target===1 || next>.015
 })
 return <group ref={ref} scale={initialScale} visible={initialScale>.015}><Extras part={id} points={points}/></group>
}
function FocusCamera({worldNumber}:{worldNumber:number}){
 const {camera}=useThree()
 useEffect(()=>{camera.lookAt(0,worldNumber===2?2.8:.55,0);camera.updateProjectionMatrix()},[camera,worldNumber])
 return null
}
const TREEHOUSE_BUILD_ORDER=[0,27,...Array.from({length:26},(_,i)=>i+1),28,29]
// Story chapters unlock *visible and clickable* objects on the actual island.
function AdventureDecor({count,onDiscover}:{count:number;onDiscover:(label:string)=>void}){
 return <group>
  {count>=1&&<group position={[-2.42,0,1.45]} onClick={e=>{e.stopPropagation();onDiscover('🌻 Цветник дружбы вырос после первой главы белочки!')}}>
   <Block position={[0,.09,0]} size={[.64,.18,.62]} color="#936343" round={.04}/>
   {[[0,0],[-.19,-.16],[.19,.15]].map(([x,z],i)=><Flower key={i} x={x} z={z} tint={['#f89dc3','#ffe47e','#a78dec'][i]}/>)}
  </group>}
  {count>=4&&<group position={[2.34,0,-1.45]} onClick={e=>{e.stopPropagation();onDiscover('📚 Читальный уголок: истории и знания делают наш остров уютнее.')}}>
   <Block position={[0,.34,0]} size={[.75,.12,.5]} color="#d4a47b"/>
   {[-.28,.28].map(x=><Block key={x} position={[x,.16,0]} size={[.08,.34,.09]} color="#866143"/>)}
   {['#e9b965','#76b4e0','#c891cb'].map((c,i)=><Block key={i} position={[-.24+i*.23,.43,0]} size={[.19,.08,.3]} color={c} round={.018}/>)}
  </group>}
  {count>=10&&<group position={[2.35,0,.33]} onClick={e=>{e.stopPropagation();onDiscover('🏮 Фонарик друзей освещает дорогу домой.')}}>
   <Block position={[0,.74,0]} size={[.09,1.48,.09]} color="#87613f"/>
   <Block position={[0,1.39,0]} size={[.36,.43,.36]} color="#d2a05b"/>
   <Ball position={[0,1.39,.23]} size={.14} color="#ffe6a1"/>
  </group>}
 </group>
}
function WorldScene({points,worldNumber,adventureCount,onDiscover,theme='day'}:{points:number;worldNumber:number;adventureCount:number;onDiscover:(label:string)=>void;theme?:'day'|'night'}) {
 const island=useRef<Group>(null)
 useFrame(({clock})=>{if(island.current)island.current.position.y=Math.sin(clock.elapsedTime*.7)*.045})
 return <><color attach="background" args={[theme==='night'?'#11294c':'#87ddf4']}/><ambientLight intensity={theme==='night'?0.6:0.72}/><hemisphereLight args={[theme==='night'?'#839ccf':'#e6f8ff',theme==='night'?'#335d64':'#75b86e',theme==='night'?0.68:0.95]}/><directionalLight position={[-4,9,6]} color={theme==='night'?'#c6daff':'#ffffff'} intensity={theme==='night'?1.2:2.15} castShadow shadow-mapSize={[512,512]}/>
 <group ref={island}>
  <Block position={[0,-.34,0]} size={[5.8,.67,4.5]} color="#9d623f" round={.39}/>
  <Block position={[0,-.04,0]} size={[5.83,.23,4.54]} color="#53bc54" round={.26}/>
  {worldNumber===1? WORLD_01_OBJECTS.map(o=><Appearing key={o.id} id={o.id} points={points} at={o.at}/>):WORLD_01_OBJECTS.map((o,i)=><AnimatedTreehousePiece key={i} index={TREEHOUSE_BUILD_ORDER[i]} at={o.at} points={points}/>)}
  {worldNumber===1&&<AdventureDecor count={adventureCount} onDiscover={onDiscover}/>}
 </group>
 </>
}
export function World3D({points,worldNumber=1,spiritualPoints=0,soundEnabled=true,userId='guest',adventureCount=0,theme='day'}:{points:number;worldNumber?:number;spiritualPoints?:number;soundEnabled?:boolean;userId?:string;adventureCount?:number;theme?:'day'|'night'}) {
 const panelRef=useRef<HTMLDivElement>(null)
 const[storyMessage,setStoryMessage]=useState('')
 async function toggleFullscreen() {
  const element=panelRef.current
  if(!element)return
  if(document.fullscreenElement) await document.exitFullscreen()
  else if(element.requestFullscreen) await element.requestFullscreen()
 }
 const unlocked=unlockedWorldObjects(points)
 const next=nextWorldObject(points)
 return <div ref={panelRef} className="world3d-panel"><div className="world3d-toolbar"><span>{worldNumber===1?'3D-поляна':'3D-домик на дереве'}</span><button type="button" onClick={()=>void toggleFullscreen()} aria-label="Развернуть 3D-мир на весь экран">⛶ На весь экран</button></div><div className="world3d-viewport"><Suspense fallback={<div className="world3d-loading">Создаём поляну…</div>}><Canvas shadows camera={{position:worldNumber===2?[7.1,7.9,10.4]:[6.3,7.2,9],fov:worldNumber===2?35:37,near:.1,far:100}} dpr={[1,1.25]} gl={{alpha:false,antialias:true}}><FocusCamera worldNumber={worldNumber}/><WorldScene points={points} worldNumber={worldNumber} adventureCount={adventureCount} onDiscover={setStoryMessage} theme={theme}/></Canvas></Suspense><MiroRobot worldPoints={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}/></div>
 {worldNumber===1&&adventureCount>0&&<div className="world3d-adventures"><strong>🌱 Постройки истории</strong><span>{adventureCount>=1?'🌻 Цветник':null}{adventureCount>=4?' · 📚 Читальный уголок':null}{adventureCount>=10?' · 🏮 Фонарик друзей':null}</span><button type="button" onClick={()=>setStoryMessage('За прохождение истории на полянке появились новые предметы. Нажми на них в 3D-мире!')}>Исследовать</button></div>}
 {storyMessage&&<div className="world3d-story-message" role="status">{storyMessage}<button onClick={()=>setStoryMessage('')} aria-label="Закрыть подсказку">×</button></div>}
 <div className="world3d-bottom"><span>{worldNumber===1?'🏡 Домик на поляне':'🌳 Домик на дереве'} · {unlocked.length}/30 открыто</span><strong>{Math.min(points,WORLD_01_END)} / {WORLD_01_END} ✨</strong></div>
 <div className="world3d-track"><div style={{width:Math.min(100,points/WORLD_01_END*100)+'%'}}/></div>
 <p className="world3d-next">{next ? 'Следующее открытие: '+(worldNumber===1?next.title:TREEHOUSE_STAGES[unlocked.length])+' · '+next.at+' баллов' : '🎉 Мир завершён! Все элементы открыты.'}</p>
 </div>
}
