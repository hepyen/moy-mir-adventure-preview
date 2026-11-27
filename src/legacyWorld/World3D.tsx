import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Vector3 } from 'three'
import type { Group } from 'three'
import { WORLD_01_OBJECTS, nextWorldObject, unlockedWorldObjects, WORLD_01_END } from './world01'
import './World3D.css'
import { MiroRobot } from './MiroRobot'
import { AnimatedTreehousePiece } from './TreehouseWorld'
import { TREEHOUSE_STAGES } from './treehouseStages'
import { DogActor } from './DogActor'
import {playDogBark} from './dogSound'
import {WorldDecorations,PreviewDecoration} from './WorldDecorations'
import {pullDecorCloud,saveDecorWithCloud,hasDecorPending,markDecorPending,markDecorSynced} from './worldDecorCloud'
import {DECOR_SPECS,decorPosition,layoutStorageKey,readDecorLayout,saveDecorLayout,validateDecorSpot} from './worldDecor'
import type {DecorId,DecorLayout} from './worldDecor'
import {meadowSpot,treehouseSpot,TREEHOUSE_BUILD_ORDER} from './worldSpots'
import type {WorldSpot} from './worldSpots'
import {LivingAtmosphere,SkyControls,useLivingSettings,RoomScene,RoomControls,useRoom,PetActions} from './LivingWorld'
import type {Weather} from './LivingWorld'

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
function Tree({part,shake=0}:{part:string;shake?:number}) {
 const crown=useRef<Group>(null)
 const shaking=useRef(0)
 useEffect(()=>{if(shake>0&&part==='crown')shaking.current=2},[shake,part])
 useFrame(({clock},dt)=>{
  if(!crown.current)return
  shaking.current=Math.max(0,shaking.current-dt)
  crown.current.rotation.z=shaking.current>0?Math.sin(clock.elapsedTime*11)*.09*(shaking.current/2):0
 })
 const x=-1.35,z=-.54
 return <group position={[x,0,z]}>
 {part==='sprout'&&<><Block position={[0,.14,0]} size={[.06,.28,.07]} color="#589e4e"/><Ball position={[-.11,.29,0]} size={.14} color="#7dc06b"/></>}
 {part==='trunk'&&<><mesh position={[0,.92,0]} castShadow><cylinderGeometry args={[.18,.3,1.85,10]}/><meshStandardMaterial color="#a96b42"/></mesh><Block position={[.3,1.25,0]} size={[.6,.18,.2]} rotation={[0,0,-.48]} color="#a96b42"/></>}
 {part==='crown'&&<group ref={crown}>{[[-.52,2.1,0,.62],[0,2.55,0,.76],[.55,2.17,0,.63],[0,1.95,.4,.55]].map(([a,b,c,r],i)=><Ball key={i} position={[a,b,c]} size={r} color={['#289f49','#39bc55','#218c42','#5fcf62'][i]}/>)}</group>}
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
function HingedDoor({opened}:{opened:boolean}){
 const hinge=useRef<Group>(null)
 useFrame((_,dt)=>{if(hinge.current)hinge.current.rotation.y+=((opened?-1.12:0)-hinge.current.rotation.y)*(1-Math.exp(-dt*7))})
 return <group ref={hinge} position={[-.68,.84,.922]}><Block position={[.29,0,0]} size={[.58,1.08,.08]} color="#986148"/><Ball position={[.51,.03,.08]} size={.045} color="#ffe0a5"/></group>
}
function House({part,doorOpen=false,lightsOn=false}:{part:string;doorOpen?:boolean;lightsOn?:boolean}) {
 const x=.65,z=-.12
 return <group position={[x,0,z]}>
 {part==='blueprint'&&<Block position={[0,.025,0]} size={[2.05,.05,1.72]} color="#e2c99a"/>}
 {part==='foundation'&&<Block position={[0,.18,0]} size={[2.08,.36,1.76]} color="#aaa49a"/>}
 {part==='wallfront'&&<>
  {/* Real 0.58m-wide doorway at local X=-.39: keep the middle empty. */}
  <Block position={[-.795,1.07,.81]} size={[.23,1.55,.16]} color="#ffd083"/>
  <Block position={[.405,1.07,.81]} size={[1.01,1.55,.16]} color="#ffd083"/>
  <Block position={[-.39,1.612,.81]} size={[.58,.465,.16]} color="#ffd083"/>
  <Block position={[-.69,.85,.90]} size={[.075,1.19,.10]} color="#a6754b"/>
  <Block position={[-.09,.85,.90]} size={[.075,1.19,.10]} color="#a6754b"/>
  <Block position={[-.39,1.42,.90]} size={[.67,.09,.10]} color="#a6754b"/>
  {/* Interior visible through the open door: real depth instead of a fake wall. */}
  <Block position={[0,.405,0]} size={[1.66,.085,1.48]} color="#a97546"/>
  <Block position={[-.38,.46,.18]} size={[.52,.025,.62]} color="#b8d9b3"/>
  <Block position={[.44,.7,-.30]} size={[.65,.12,.39]} color="#b58256"/>
  {[-.01,.88].map((x,i)=><Block key={i} position={[x,.53,-.30]} size={[.085,.24,.085]} color="#785539"/>)}
  <Block position={[.48,.88,-.55]} size={[.55,.28,.12]} color="#dfbe8f"/>
  <Block position={[.48,.96,-.47]} size={[.45,.12,.09]} color="#f3e0b2"/>
  <Ball position={[.1,.58,-.61]} size={.12} color="#85b9dd"/>
  <Block position={[-.39,1.21,-.68]} size={[.46,.38,.045]} color="#a67852"/>
  <Block position={[-.39,1.21,-.64]} size={[.37,.29,.025]} color="#8ac2ad"/>
  <Ball position={[-.39,1.29,-.615]} size={.065} color="#ffe69b"/>
  {lightsOn&&<pointLight position={[0,1.43,.16]} color="#ffdea0" intensity={1.05} distance={3.2}/>}
 </>}
 {part==='wallback'&&<Block position={[0,1.07,-.81]} size={[1.82,1.55,.16]} color="#f4b15d"/>}
 {part==='wallleft'&&<Block position={[-.89,1.07,0]} size={[.16,1.55,1.55]} color="#e9a359"/>}
 {part==='wallright'&&<Block position={[.89,1.07,0]} size={[.16,1.55,1.55]} color="#ffe0a0"/>}
 {part==='door'&&<HingedDoor opened={doorOpen}/>}
 {part==='window'&&<><Block position={[.35,1.2,.93]} size={[.57,.55,.1]} color="#fff6d1"/><Block position={[.35,1.2,.992]} size={[.44,.43,.04]} color={lightsOn?'#ffd77d':'#8fd5fa'}/>{lightsOn&&<pointLight position={[.35,1.2,1.1]} color="#ffdc8a" intensity={.85} distance={3.5}/>}<Block position={[.35,1.2,1.021]} size={[.055,.48,.06]} color="#fffbec"/><Block position={[.35,1.2,1.021]} size={[.47,.05,.06]} color="#fffbec"/></>}
 {part==='roofleft'&&<Block position={[-.49,2.16,0]} size={[1.38,.18,2.1]} color="#ee4934" rotation={[0,0,.58]}/>}
 {part==='roofright'&&<Block position={[.49,2.16,0]} size={[1.38,.18,2.1]} color="#d93428" rotation={[0,0,-.58]}/>}
 {part==='chimney'&&<><Block position={[.58,2.57,-.48]} size={[.34,.83,.34]} color="#d48357"/><Block position={[.58,2.98,-.48]} size={[.44,.12,.44]} color="#a8553b"/></>}
 {part==='smoke'&&<Smoke/>}
 {part==='lamp'&&<><Block position={[-1.2,.9,1]} size={[.07,1.8,.07]} color="#765842"/><Ball position={[-1.2,1.7,1]} size={.16} color={lightsOn?'#fff0a4':'#be9c68'}/>{lightsOn&&<pointLight position={[-1.2,1.7,1]} intensity={1.5} distance={4.2} color="#ffe3a0"/>}</>}
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
function HappyDog({points,barkTick,dogPlayTick,dogRestTick,dogFeedTick}:{points:number;barkTick:number;dogPlayTick:number;dogRestTick:number;dogFeedTick:number}) {
 return <DogActor points={points} reactTick={barkTick} playTick={dogPlayTick} restTick={dogRestTick} feedTick={dogFeedTick}/>
}
function Extras({part,points,doorOpen,lightsOn,treeShake,barkTick,dogPlayTick,dogRestTick,dogFeedTick}:{dogFeedTick:number;part:string;points:number;doorOpen:boolean;lightsOn:boolean;treeShake:number;barkTick:number;dogPlayTick:number;dogRestTick:number}){
 // Moveable objects are drawn by WorldDecorations so they have one physical location.
 if(['lamp','bench','flowerbed','mailbox'].includes(part))return null
 switch(part){
 case 'grass':return <group>{[[-2,0,-1],[2,0,-1],[-2,0,.8],[.2,0,1.9],[-.7,0,1.2]].map(([x,y,z],i)=><Ball key={i} position={[x,y+.08,z]} size={.13} color="#38b94b"/>)}</group>
 case 'flowers':return <group>{[[-2.2,-.5],[-2.1,.35],[-.85,1.4],[-1.9,1.4]].map(([x,z],i)=><Flower key={i} x={x} z={z} tint={i%2?'#fff0b5':'#ff65a6'}/>)}</group>
 case 'pebbles':return <group>{Array.from({length:5},(_,i)=><Ball key={i} position={[.2+i*.18,.07,1.12+i*.14]} size={.13} color="#e4d3ae"/>)}</group>
 case 'sprout':case 'trunk':case 'crown':case 'apples':return <Tree part={part} shake={treeShake}/>
 case 'blueprint':case 'foundation':case 'wallfront':case 'wallback':case 'wallleft':case 'wallright':case 'door':case 'window':case 'roofleft':case 'roofright':case 'chimney':case 'smoke':case 'lamp':case 'steps':return <House part={part} doorOpen={doorOpen} lightsOn={lightsOn}/>
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
 case 'dog':return <HappyDog points={points} barkTick={barkTick} dogPlayTick={dogPlayTick} dogRestTick={dogRestTick} dogFeedTick={dogFeedTick}/>
 case 'celebration':return <group>{Array.from({length:8},(_,i)=><Ball key={i} position={[Math.sin(i*2.5)*2,1.9+i*.12,Math.cos(i*2.1)*1.7]} size={.045} color="#ffe2a1"/>)}</group>
 default:return null
 }
}
function Appearing({id,at,points,doorOpen,lightsOn,treeShake,barkTick,dogPlayTick,dogRestTick,dogFeedTick,onInspect}:{dogFeedTick:number;id:string;at:number;points:number;doorOpen:boolean;lightsOn:boolean;treeShake:number;barkTick:number;dogPlayTick:number;dogRestTick:number;onInspect:(part:string)=>void}) {
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
 return <group ref={ref} scale={initialScale} visible={initialScale>.015} onClick={e=>{if(points<at||e.delta>9)return;e.stopPropagation();onInspect(id)}}><Extras part={id} points={points} doorOpen={doorOpen} lightsOn={lightsOn} treeShake={treeShake} barkTick={barkTick} dogPlayTick={dogPlayTick} dogRestTick={dogRestTick} dogFeedTick={dogFeedTick}/></group>
}
type CameraAction={id:number;type:'reset'|'closer'|'farther'|'focus';target?:[number,number,number];distance?:number;position?:[number,number,number]}
const cameraStart=(worldNumber:number)=>worldNumber===0?new Vector3(3.5,3.2,4.5):worldNumber===2?new Vector3(7.1,7.9,10.4):new Vector3(6.3,7.2,9)
const cameraTarget=(worldNumber:number)=>new Vector3(0,worldNumber===2?2.8:worldNumber===0?.55:.55,0)
function WorldCameraControls({worldNumber,action}:{worldNumber:number;action:CameraAction}){
 const {camera,gl}=useThree()
 const controls=useRef<OrbitControls|null>(null)
 const transition=useRef<{position:Vector3;target:Vector3}|null>(null)
 useFrame((_,delta)=>{
  const orbit=controls.current
  if(!orbit)return
  const move=transition.current
  if(move){
   const t=1-Math.exp(-Math.min(delta,.05)*5.4)
   orbit.target.lerp(move.target,t)
   camera.position.lerp(move.position,t)
   if(camera.position.distanceToSquared(move.position)<.0002 && orbit.target.distanceToSquared(move.target)<.0002){
    camera.position.copy(move.position);orbit.target.copy(move.target);transition.current=null
   }
  }
  orbit.update()
 })
 useEffect(()=>{
  const orbit=new OrbitControls(camera,gl.domElement)
  controls.current=orbit
  const touchAction=gl.domElement.style.touchAction
  gl.domElement.style.touchAction='none'
  orbit.enableRotate=true
  orbit.enableZoom=true
  orbit.enablePan=false  // Keep the island centered and never lose the build area.
  orbit.enableDamping=true
  orbit.dampingFactor=.085
  orbit.rotateSpeed=.62
  orbit.zoomSpeed=.75
  orbit.minDistance=worldNumber===2?2.8:2.2
  orbit.maxDistance=worldNumber===2?19:17
  orbit.minPolarAngle=.28
  orbit.maxPolarAngle=1.42
  camera.position.copy(cameraStart(worldNumber))
  orbit.target.copy(cameraTarget(worldNumber))
  orbit.update()
  orbit.saveState()
  const cancelTransition=()=>{transition.current=null}
  orbit.addEventListener('start',cancelTransition)
  // Double-click on desktop or double-tap on mobile returns to the saved view.
  let firstTap:{at:number;x:number;y:number}|null=null
  let pointerStart:{id:number;at:number;x:number;y:number;multitouch:boolean}|null=null
  const pointerDown=(e:PointerEvent)=>{
   if(e.pointerType!=='touch')return
   if(pointerStart)pointerStart.multitouch=true
   else pointerStart={id:e.pointerId,at:performance.now(),x:e.clientX,y:e.clientY,multitouch:false}
  }
  const pointerUp=(e:PointerEvent)=>{
   const down=pointerStart
   if(!down||down.id!==e.pointerId)return
   pointerStart=null
   const now=performance.now()
   if(down.multitouch||now-down.at>300||Math.hypot(e.clientX-down.x,e.clientY-down.y)>17){firstTap=null;return}
   if(firstTap&&now-firstTap.at<350&&Math.hypot(e.clientX-firstTap.x,e.clientY-firstTap.y)<32){orbit.reset();firstTap=null}
   else firstTap={at:now,x:e.clientX,y:e.clientY}
  }
  const doubleClick=()=>orbit.reset()
  gl.domElement.addEventListener('pointerdown',pointerDown)
  gl.domElement.addEventListener('pointerup',pointerUp)
  gl.domElement.addEventListener('dblclick',doubleClick)
  return()=>{
   controls.current=null
   gl.domElement.removeEventListener('pointerdown',pointerDown)
   gl.domElement.removeEventListener('pointerup',pointerUp)
   gl.domElement.removeEventListener('dblclick',doubleClick)
   orbit.removeEventListener('start',cancelTransition)
   transition.current=null
   orbit.dispose()
   gl.domElement.style.touchAction=touchAction
  }
 },[camera,gl,worldNumber])
 useEffect(()=>{
  if(action.id===0||!controls.current)return
  const orbit=controls.current
  if(action.type==='focus'&&action.target){
   const target=new Vector3(...action.target)
   const heading=camera.position.clone().sub(orbit.target).normalize()
   const distance=Math.max(orbit.minDistance,Math.min(orbit.maxDistance,action.distance??7))
   transition.current={position:action.position?new Vector3(...action.position):target.clone().addScaledVector(heading,distance),target}
  }else if(action.type==='reset'){
   transition.current={position:cameraStart(worldNumber),target:cameraTarget(worldNumber)}
  }else{
   transition.current=null
   const offset=camera.position.clone().sub(orbit.target)
   const distance=offset.length()
   const factor=action.type==='closer'?.79:1.26
   const next=Math.max(orbit.minDistance,Math.min(orbit.maxDistance,distance*factor))
   if(distance>0)camera.position.copy(orbit.target).addScaledVector(offset,next/distance)
   orbit.update()
  }
 },[action,camera,worldNumber])
 return null
}
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
function WorldScene({points,worldNumber,adventureCount,onDiscover,onInspect,doorOpen,lightsOn,treeShake,barkTick,dogPlayTick,dogRestTick,decorLayout,decorSelected,decorPreview,onDecorSelect,onDecorPlace,theme='day',weather='sun',squirrelAction='',squirrelTick=0,dogFeedTick=0}:{weather?:Weather;squirrelAction?:string;squirrelTick?:number;dogFeedTick?:number;points:number;worldNumber:1|2;adventureCount:number;onDiscover:(label:string)=>void;onInspect:(part:string)=>void;doorOpen:boolean;lightsOn:boolean;treeShake:number;barkTick:number;dogPlayTick:number;dogRestTick:number;decorLayout:DecorLayout;decorSelected:DecorId|null;decorPreview:{x:number;z:number;rotation:number;valid:boolean}|null;onDecorSelect:(id:DecorId)=>void;onDecorPlace:(x:number,z:number)=>void;theme?:'day'|'night'}) {
 const island=useRef<Group>(null)
 useFrame(({clock})=>{if(island.current)island.current.position.y=Math.sin(clock.elapsedTime*.7)*.045})
 return <><color attach="background" args={[theme==='night'?'#11294c':weather==='rain'?'#849bad':'#87ddf4']}/><ambientLight intensity={theme==='night'?0.6:0.72}/><hemisphereLight args={[theme==='night'?'#839ccf':'#e6f8ff',theme==='night'?'#335d64':'#75b86e',theme==='night'?0.68:0.95]}/><directionalLight position={[-4,9,6]} color={theme==='night'?'#c6daff':'#ffffff'} intensity={theme==='night'?1.2:weather==='rain'?.95:2.15} castShadow shadow-mapSize={[512,512]}/>
 <group ref={island}>
  <Block position={[0,-.34,0]} size={[5.8,.67,4.5]} color="#9d623f" round={.39}/>
  <Block position={[0,-.04,0]} size={[5.83,.23,4.54]} color="#53bc54" round={.26}/>
  {worldNumber===1? WORLD_01_OBJECTS.map(o=><Appearing key={o.id} id={o.id} points={points} at={o.at} doorOpen={doorOpen} lightsOn={lightsOn} treeShake={treeShake} barkTick={barkTick} dogPlayTick={dogPlayTick} dogRestTick={dogRestTick} dogFeedTick={dogFeedTick} onInspect={onInspect}/>):WORLD_01_OBJECTS.map((o,i)=><AnimatedTreehousePiece key={i} index={TREEHOUSE_BUILD_ORDER[i]} at={o.at} points={points} doorOpen={doorOpen} lightsOn={lightsOn} petAction={squirrelAction} petTick={squirrelTick} onInspect={index=>onInspect('treehouse-'+index)}/>)}
  <LivingAtmosphere weather={weather} sky={theme} world={worldNumber} points={points}/>
  {worldNumber===1&&<AdventureDecor count={adventureCount} onDiscover={onDiscover}/>}
  <WorldDecorations world={worldNumber} points={points} layout={decorLayout} selected={decorSelected} lightsOn={lightsOn} onSelect={onDecorSelect}/>
  {decorSelected&&<>
   <mesh position={[0,.105,0]} rotation={[-Math.PI/2,0,0]} onPointerMove={e=>{e.stopPropagation();onDecorPlace(e.point.x,e.point.z)}} onClick={e=>{if(e.delta>9)return;e.stopPropagation();onDecorPlace(e.point.x,e.point.z)}}>
    <planeGeometry args={[5.78,4.48]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/>
   </mesh>
   {decorPreview&&<PreviewDecoration id={decorSelected} at={decorPreview} valid={decorPreview.valid} lightsOn={lightsOn}/>}
  </>}
 </group>
 </>
}
export function World3D({points,earnedPoints=points,worldNumber=1,spiritualPoints=0,soundEnabled=true,userId='guest',decorOwnerId=userId,decorFamilyId='',decorChildId='',adventureCount=0,theme='day',preview=false}:{preview?:boolean;points:number;earnedPoints?:number;worldNumber?:number;spiritualPoints?:number;soundEnabled?:boolean;userId?:string;decorOwnerId?:string;decorFamilyId?:string;decorChildId?:string;adventureCount?:number;theme?:'day'|'night'}) {
 const panelRef=useRef<HTMLDivElement>(null)
 const[storyMessage,setStoryMessage]=useState('')
 const[selected,setSelected]=useState<WorldSpot|null>(null)
 const decorWorld=(worldNumber===2?2:1) as 1|2
 const decorKey=layoutStorageKey(decorOwnerId,decorWorld)
 const[decorState,setDecorState]=useState<{key:string;layout:DecorLayout}>(()=>({key:decorKey,layout:readDecorLayout(decorKey)}))
 const decorLayout=decorState.key===decorKey?decorState.layout:readDecorLayout(decorKey)
 const[decorSelected,setDecorSelected]=useState<DecorId|null>(null)
 const[decorPreview,setDecorPreview]=useState<{x:number;z:number;rotation:number;valid:boolean}|null>(null)
 const[decorMessage,setDecorMessage]=useState('')
 const[decorSyncStatus,setDecorSyncStatus]=useState('')
 const[decorCloudConflict,setDecorCloudConflict]=useState<DecorLayout|null>(null)
 const decorEditVersion=useRef(0)
 const decorScope=useMemo(()=>({familyId:decorFamilyId,childId:decorChildId,world:decorWorld,userId,key:decorKey}),[decorFamilyId,decorChildId,decorWorld,userId,decorKey])
 useEffect(()=>{
  let active=true, busy=false
  setDecorState({key:decorKey,layout:readDecorLayout(decorKey)});setDecorSelected(null);setDecorPreview(null);setDecorMessage('');setDecorCloudConflict(null)
  const refresh=async()=>{
   if(preview||busy||!decorScope.familyId||!decorScope.childId)return
   busy=true;const startedAtEdit=decorEditVersion.current;if(active)setDecorSyncStatus('☁️ Проверяем сохранение острова…')
   try{
    const result=await pullDecorCloud(decorScope)
    if(active&&result.origin==='conflict'&&result.cloud){setDecorCloudConflict(result.cloud);setDecorSyncStatus('⚠️ На телефоне и в облаке разные варианты острова. Выбери, какой сохранить.')}
    else if(active&&!hasDecorPending(decorKey)&&startedAtEdit===decorEditVersion.current){saveDecorLayout(decorKey,result.layout);setDecorState({key:decorKey,layout:result.layout});setDecorSyncStatus('☁️ Украшения синхронизированы')}
    else if(active)setDecorSyncStatus('📱 Есть изменения для синхронизации')
   }catch{if(active)setDecorSyncStatus('📱 Остров сохранён на телефоне. Сеть недоступна.')}finally{busy=false}
  }
  void refresh()
  const onResume=()=>{if(document.visibilityState==='visible')void refresh()}
  window.addEventListener('online',refresh);document.addEventListener('visibilitychange',onResume)
  return()=>{active=false;window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',onResume)}
 },[decorScope,decorKey])
 const persistDecor=(layout:DecorLayout)=>{
  decorEditVersion.current++
  setDecorCloudConflict(null)
  setDecorState({key:decorKey,layout})
  void saveDecorWithCloud(decorScope,layout).then(()=>setDecorSyncStatus('☁️ Украшения синхронизированы')).catch(()=>setDecorSyncStatus('📱 Сохранено локально. Синхронизация при подключении.'))
 }
 const acceptCloudDecor=()=>{
  if(!decorCloudConflict)return
  decorEditVersion.current++
  saveDecorLayout(decorKey,decorCloudConflict)
  markDecorSynced(decorKey)
  setDecorState({key:decorKey,layout:decorCloudConflict})
  setDecorCloudConflict(null)
  setDecorSyncStatus('☁️ Восстановлена расстановка из семейной базы')
 }
 const keepLocalDecor=()=>{
  markDecorPending(decorKey)
  persistDecor(decorLayout)
  setDecorSyncStatus('☁️ Отправляем расстановку с этого телефона…')
 }
 const chooseDecoration=(id:DecorId)=>{
  if(!DECOR_SPECS[decorWorld].some(s=>s.id===id&&points>=s.unlock))return
  setDecorSelected(id)
  setSelected(null)
  const item=DECOR_SPECS[decorWorld].find(s=>s.id===id)
  const start=decorPosition(decorWorld,decorLayout,id)
  setDecorPreview({x:start.x,z:start.z,rotation:start.rotation??0,valid:true})
  setDecorMessage(`Выбран предмет «${item?.title||id}». Коснись травы для примерки, поверни и подтверди.`)
 }
 const placeDecoration=(x:number,z:number)=>{
  if(!decorSelected)return
  const roundedX=Math.round(x*20)/20,roundedZ=Math.round(z*20)/20
  setDecorPreview(previous=>{
   const rotation=previous?.rotation??0
   if(previous?.x===roundedX&&previous.z===roundedZ)return previous
   const valid=!validateDecorSpot(decorWorld,points,decorLayout,decorSelected,roundedX,roundedZ)
   return {x:roundedX,z:roundedZ,rotation,valid}
  })
 }
 const rotateDecoration=()=>setDecorPreview(previous=>previous?{...previous,rotation:(previous.rotation+45)%360}:previous)
 const confirmDecoration=()=>{
  if(!decorSelected||!decorPreview)return
  const {x,z,rotation}=decorPreview
  const reason=validateDecorSpot(decorWorld,points,decorLayout,decorSelected,x,z)
  if(reason){setDecorMessage(`⛔ ${reason} Выбери другое место.`);return}
  const next={...decorLayout,[decorSelected]:{x,z,rotation}}
  persistDecor(next)
  setDecorSelected(null);setDecorPreview(null)
  setDecorMessage('✅ Украшение установлено. Место сохранено на телефоне; облачная синхронизация выполняется отдельно.')
  onMiroGreet('🤖 Отличный выбор! Мне нравится, как ты украшаешь остров!')
 }
 const resetDecoration=(id:DecorId)=>{
  const next={...decorLayout};delete next[id]
  persistDecor(next)
  setDecorSelected(null);setDecorPreview(null)
  setDecorMessage('↺ Предмет возвращён на первоначальное место.')
 }
 const living=useLivingSettings('moymir-living:'+decorOwnerId+':'+worldNumber,theme)
 const room=useRoom('moymir-room:'+decorOwnerId+':'+worldNumber)
 const [roomOpen,setRoomOpen]=useState(false)
 const [squirrelAction,setSquirrelAction]=useState('')
 const [squirrelTick,setSquirrelTick]=useState(0)
 const [dogFeedTick,setDogFeedTick]=useState(0)
 const[doorOpen,setDoorOpen]=useState(false)
 const[lightsOn,setLightsOn]=useState(false)
 const[treeShake,setTreeShake]=useState(0)
 const[barkTick,setBarkTick]=useState(0)
 const[dogPlayTick,setDogPlayTick]=useState(0)
 const[dogRestTick,setDogRestTick]=useState(0)
 const[dogActivity,setDogActivity]=useState('')
 const[dogSpeech,setDogSpeech]=useState(false)
 const[announcementId,setAnnouncementId]=useState(0)
 const[miroGreeting,setMiroGreeting]=useState('')
 const greetingTimer=useRef<number|null>(null)
 const onMiroGreet=useCallback((text:string)=>{setMiroGreeting(text);setAnnouncementId(n=>n+1);if(greetingTimer.current!==null)window.clearTimeout(greetingTimer.current);greetingTimer.current=window.setTimeout(()=>setMiroGreeting(''),4800)},[])
 useEffect(()=>()=>{if(greetingTimer.current!==null)window.clearTimeout(greetingTimer.current)},[])
 const reactToAction=(message:string)=>onMiroGreet(message)
 const toggleDoor=()=>{setDoorOpen(open=>!open);reactToAction('🤖 Миро заметил, что ты открыл или закрыл дверь!')}
 const toggleLights=()=>{setLightsOn(on=>!on);reactToAction('🤖 Теперь в нашем домике ещё уютнее!')}
 useEffect(()=>{if(!dogActivity)return;setDogSpeech(true);const hide=window.setTimeout(()=>setDogSpeech(false),3700);return()=>window.clearTimeout(hide)},[dogActivity,barkTick,dogPlayTick,dogRestTick])
 const greetDog=()=>{setBarkTick(i=>i+1);setDogActivity('Гав-гав! Собачка рада тебя видеть!');playDogBark(soundEnabled);reactToAction('🤖 Наш пёс радуется, когда ты его гладишь!')}
 const playDog=()=>{setDogPlayTick(i=>i+1);setDogActivity('Собачка догоняет мячик и радостно виляет хвостом!');reactToAction('🤖 Смотри, как наш пёс играет с мячиком!')}
 const restDog=()=>{setDogRestTick(i=>i+1);setDogActivity('Собачка прилегла отдохнуть. Тсс, не мешаем!');reactToAction('🤖 Наш дружок устал. Пусть немного отдохнёт!')}
 const feedDog=()=>{setDogFeedTick(i=>i+1);reactToAction('🐶 Собачка с удовольствием ест корм!')}
 const actSquirrel=(action:string)=>{setSquirrelAction(action);setSquirrelTick(i=>i+1);reactToAction(action==='feed'?'🐿️ Белочка грызёт орешек!':action==='play'?'🐿️ Белочка радостно прыгает!':'🐿️ Белочка остановилась и машет хвостиком.')}
 const[cameraAction,setCameraAction]=useState<CameraAction>({id:0,type:'reset'})
 const doCamera=(type:CameraAction['type'],target?:[number,number,number],distance?:number,position?:[number,number,number])=>setCameraAction(prev=>({id:prev.id+1,type,target,distance,position}))
 const peekInside=()=>{if(!doorOpen){setDoorOpen(true);reactToAction('🤖 За дверью настоящая комната. Посмотри внутрь!')}const tree=worldNumber===2;doCamera('focus',tree?[.70,3.51,-.24]:[.38,.97,-.35],tree?3.55:3.45,tree?[.75,3.82,3.48]:[.40,1.20,3.08])}
 const doorUnlocked=points>=(worldNumber===1?600:700)
 const lightsUnlocked=points>=(worldNumber===1?650:750)
 const openRoom=()=>{setRoomOpen(true);setSelected(null);setDecorSelected(null);setDecorPreview(null);setLightsOn(true);setCameraAction(prev=>({id:prev.id+1,type:'reset'}))}
 const inspect=(part:string)=>{
  const movable=DECOR_SPECS[decorWorld].find(spec=>spec.id===part)
  const at=movable?decorPosition(decorWorld,decorLayout,movable.id):null
  const spot:WorldSpot=movable&&at?{
   id:movable.id,title:movable.title,subtitle:'Украшение острова',kind:movable.id==='lamp'?'light':'decoration',
   target:[at.x,.7,at.z],distance:5.4,
   description:'В разделе «Украсить мой остров» можно переставить предмет. Место синхронизируется с семейной базой.'
  }:(worldNumber===1?meadowSpot(part):treehouseSpot(Number(part.replace('treehouse-',''))))
  setSelected(spot)
  doCamera('focus',spot.target,spot.distance)
  if(spot.kind==='dog')greetDog()
  if(spot.kind==='home'&&doorUnlocked){setDoorOpen(open=>!open);if(lightsUnlocked)setLightsOn(on=>!on);reactToAction('🤖 Посмотри, как ожил наш домик!')}
  else if(spot.kind==='door'&&doorUnlocked)toggleDoor()
  else if(spot.kind==='light'&&lightsUnlocked)toggleLights()
  else if(spot.kind==='tree'&&worldNumber===1){setTreeShake(i=>i+1);reactToAction('🤖 Смотри, как шевелятся ветки!')}
 }
 const spotlightParts=worldNumber===1?['dog','crown','roofleft','door','window','garden','pond','bench']:['treehouse-0','treehouse-12','treehouse-15','treehouse-16','treehouse-20','treehouse-21','treehouse-22','treehouse-27','treehouse-23','treehouse-25']
 const spotlightAvailable=spotlightParts.filter(part=>{
  const index=worldNumber===1?WORLD_01_OBJECTS.findIndex(o=>o.id===part):TREEHOUSE_BUILD_ORDER.indexOf(Number(part.replace('treehouse-','')))
  return index>=0&&points>=WORLD_01_OBJECTS[index].at
 })
 async function toggleFullscreen() {
  const element=panelRef.current
  if(!element)return
  if(document.fullscreenElement) await document.exitFullscreen()
  else if(element.requestFullscreen) await element.requestFullscreen()
 }
 const unlocked=unlockedWorldObjects(points)
 const next=nextWorldObject(points)
 return <div ref={panelRef} className="world3d-panel"><div className="world3d-toolbar"><span>{worldNumber===1?'3D-поляна':'3D-домик на дереве'}</span><div className="world3d-camera-buttons" role="group" aria-label="Управление камерой 3D-мира"><button type="button" onClick={()=>doCamera('farther')} aria-label="Отдалить 3D-мир" title="Отдалить">−</button><button type="button" onClick={()=>doCamera('closer')} aria-label="Приблизить 3D-мир" title="Приблизить">+</button><button type="button" onClick={()=>doCamera('reset')} aria-label="Вернуть первоначальный вид 3D-мира" title="Вернуть вид">↺</button><button type="button" onClick={()=>void toggleFullscreen()} aria-label="Развернуть 3D-мир на весь экран" title="На весь экран">⛶</button></div></div><p className="world3d-gesture-hint">Проведи пальцем, чтобы повернуть · два пальца для масштаба · двойное касание для сброса</p>{!preview&&<SkyControls mode={living.mode} setMode={living.setMode} weather={living.weather} setWeather={living.setWeather}/>}
 {roomOpen?<><div className="world3d-viewport living-room-viewport"><Canvas camera={{position:[3.5,3.2,4.5],fov:42}} dpr={[1,1.25]}><color attach="background" args={[living.sky==='night'?'#20354f':'#d1e9dc']}/><ambientLight intensity={lightsOn?1.2:.45}/><directionalLight position={[3,5,3]} intensity={lightsOn?2:.65}/><WorldCameraControls worldNumber={0} action={cameraAction}/><RoomScene layout={room.layout} selected={room.selected} onSelect={room.setSelected} lights={lightsOn} world={decorWorld}/></Canvas><MiroRobot worldPoints={earnedPoints} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}/></div><RoomControls room={room} lights={lightsOn} onLight={toggleLights} onClose={()=>{setRoomOpen(false);doCamera('reset')}}/></>:<><div className="world3d-viewport"><Suspense fallback={<div className="world3d-loading">Создаём поляну…</div>}><Canvas shadows camera={{position:worldNumber===2?[7.1,7.9,10.4]:[6.3,7.2,9],fov:worldNumber===2?35:37,near:.1,far:100}} dpr={[1,1.25]} gl={{alpha:false,antialias:true}}><WorldCameraControls worldNumber={worldNumber} action={cameraAction}/><WorldScene points={points} worldNumber={decorWorld} adventureCount={adventureCount} onDiscover={setStoryMessage} onInspect={inspect} doorOpen={doorOpen} lightsOn={lightsOn} treeShake={treeShake} barkTick={barkTick} dogPlayTick={dogPlayTick} dogRestTick={dogRestTick} decorLayout={decorLayout} decorSelected={decorSelected} decorPreview={decorPreview} onDecorSelect={id=>decorSelected?chooseDecoration(id):inspect(id)} onDecorPlace={placeDecoration} theme={living.sky} weather={living.weather} squirrelAction={squirrelAction} squirrelTick={squirrelTick} dogFeedTick={dogFeedTick}/></Canvas></Suspense><MiroRobot worldPoints={earnedPoints} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId} announcement={miroGreeting} announcementId={announcementId}/></div>
 {!preview&&doorUnlocked&&<div className="living-controls"><button type="button" onClick={openRoom}>🏡 Войти в комнату</button></div>}
 {!preview&&worldNumber===1&&points>=120&&<PetActions name="🐶 Моя собачка"><button onClick={greetDog}>Погладить</button><button onClick={feedDog}>🍖 Покормить</button><button onClick={playDog}>🎾 Играть</button><button onClick={restDog}>Отдохнуть</button></PetActions>}
 {!preview&&worldNumber===2&&points>=80&&<PetActions name="🐿️ Моя белочка"><button onClick={()=>actSquirrel('pet')}>Погладить</button><button onClick={()=>actSquirrel('feed')}>🌰 Покормить</button><button onClick={()=>actSquirrel('play')}>Играть</button></PetActions>}
 {dogSpeech&&<p className="world3d-dog-speech" role="status">{dogActivity||'Собачка рада тебя видеть!'}</p>}
 {!preview&&<details className="world3d-decoration-editor" aria-label="Украсить 3D-остров"><summary>🎨 Украсить мой остров</summary>
  <p>Выбери предмет, коснись травы для примерки и нажми «Подтвердить место». Оставь свободными проходы, домик и пруд. Перестановка бесплатная.</p>
  <div className="world3d-decor-items">{DECOR_SPECS[decorWorld].map(spec=><div key={spec.id} className={'world3d-decor-item '+(decorSelected===spec.id?'selected':'')}>
   <span>{spec.title}</span>
   {points>=spec.unlock?<><button type="button" onClick={()=>chooseDecoration(spec.id)} aria-pressed={decorSelected===spec.id}>Переставить</button><button type="button" onClick={()=>resetDecoration(spec.id)} aria-label={'Вернуть '+spec.title+' на прежнее место'}>↺</button></>:<small>🔒 {spec.unlock} баллов</small>}
  </div>)}</div>
  {decorSelected&&decorPreview&&<p className="world3d-preview-hint" role="status">{decorPreview.valid?'🟢 Здесь можно поставить предмет':'🔴 '+(validateDecorSpot(decorWorld,points,decorLayout,decorSelected,decorPreview.x,decorPreview.z)||'Место недоступно')}. Координаты {decorPreview.x.toFixed(2)} / {decorPreview.z.toFixed(2)}, поворот {decorPreview.rotation}°.</p>}
  {decorSelected&&<div className="world3d-decor-preview-controls" role="group" aria-label="Предварительная установка украшения"><button type="button" onClick={rotateDecoration}>↻ Повернуть 45°</button><button type="button" disabled={!decorPreview?.valid} onClick={confirmDecoration}>✓ Подтвердить место</button><button type="button" className="world3d-decor-cancel" onClick={()=>{setDecorSelected(null);setDecorPreview(null);setDecorMessage('Редактирование отменено.')}}>Отменить перестановку</button></div>}
  {decorMessage&&<p role="status" className="world3d-decor-status">{decorMessage}</p>}
  {decorCloudConflict&&<div className="world3d-cloud-conflict" role="alert"><strong>Найдены два варианта острова</strong><p>На этом телефоне и в семейной базе разные расстановки. Выбери, какой вариант оставить для всех устройств.</p><button type="button" onClick={keepLocalDecor}>📱 Оставить этот телефон</button><button type="button" onClick={acceptCloudDecor}>☁️ Взять из облака</button></div>}
  <small>{decorSyncStatus||'Положение сохраняется отдельно для каждого острова.'}</small>
 </details>}
 <details className="world3d-object-picker"><summary>🔎 Рассмотреть постройки</summary><div className="world3d-object-picker-list">{spotlightAvailable.map(part=>{const spot=worldNumber===1?meadowSpot(part):treehouseSpot(Number(part.replace('treehouse-','')));return <button type="button" key={part} onClick={()=>inspect(part)}>{spot.title}</button>})}</div></details>
 {selected&&<section className="world3d-inspect" aria-label="Осмотр постройки"><div className="world3d-inspect-head"><div><strong>{selected.title}</strong><span>{selected.subtitle}</span></div><button type="button" onClick={()=>{setSelected(null);doCamera('reset')}} aria-label="Закрыть осмотр и вернуться к общему виду">×</button></div><p>{selected.description}</p><div className="world3d-inspect-actions"><button type="button" onClick={()=>doCamera('focus',selected.target,selected.distance)}>🔎 Приблизить</button>{doorUnlocked&&['home','door','light'].includes(selected.kind)&&<button type="button" onClick={toggleDoor}>{doorOpen?'🚪 Закрыть дверь':'🚪 Открыть дверь'}</button>}{lightsUnlocked&&['home','door','light'].includes(selected.kind)&&<button type="button" onClick={toggleLights}>{lightsOn?'💡 Выключить свет':'💡 Включить свет'}</button>}{selected.kind==='dog'&&<><button type="button" onClick={greetDog}>🐾 Погладить собачку</button><button type="button" onClick={playDog}>🎾 Играть с мячиком</button><button type="button" onClick={restDog}>😴 Дать отдохнуть</button></>}{doorUnlocked&&['home','door'].includes(selected.kind)&&<button type="button" onClick={peekInside}>👀 Заглянуть внутрь</button>}<button type="button" onClick={()=>doCamera('reset')}>↺ Общий вид</button></div></section>}
 {worldNumber===1&&adventureCount>0&&<div className="world3d-adventures"><strong>🌱 Постройки истории</strong><span>{adventureCount>=1?'🌻 Цветник':null}{adventureCount>=4?' · 📚 Читальный уголок':null}{adventureCount>=10?' · 🏮 Фонарик друзей':null}</span><button type="button" onClick={()=>setStoryMessage('За прохождение истории на полянке появились новые предметы. Нажми на них в 3D-мире!')}>Исследовать</button></div>}
 {storyMessage&&<div className="world3d-story-message" role="status">{storyMessage}<button onClick={()=>setStoryMessage('')} aria-label="Закрыть подсказку">×</button></div>}
 </>}
 {preview?<p className="world3d-next">🔒 Осмотр будущего мира. Строительство откроется после перехода.</p>:<><div className="world3d-bottom"><span>{worldNumber===1?'🏡 Домик на поляне':'🌳 Домик на дереве'} · {unlocked.length}/30 открыто</span><strong>{Math.min(points,WORLD_01_END)} / {WORLD_01_END} ✨</strong></div>
 <div className="world3d-track"><div style={{width:Math.min(100,points/WORLD_01_END*100)+'%'}}/></div>
 <p className="world3d-next">{next ? 'Следующее открытие: '+(worldNumber===1?next.title:TREEHOUSE_STAGES[unlocked.length])+' · '+next.at+' баллов' : '🎉 Мир завершён! Все элементы открыты.'}</p></>}
 </div>
}
