import {useEffect,useMemo,useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type {Group} from 'three'
import {miroRoute,routeStones} from './miroRoute'

type Props={worldNumber:1|2;points:number;earnedPoints:number;spiritualPoints:number;reactionTick:number;onTalk:()=>void;onGreeting:(message:string)=>void}
const WALK_SPEED=.60

function Shell({size,position,color='#ecf8ff'}:{size:[number,number,number];position:[number,number,number];color?:string}){
 const geometry=useMemo(()=>new RoundedBoxGeometry(...size,3,.07),[size[0],size[1],size[2]])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh position={position} geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={.37} metalness={.13}/></mesh>
}
function RobotPath({worldNumber}:{worldNumber:number}){
 const tiles=useMemo(()=>routeStones(worldNumber),[worldNumber])
 return <group name="Miro walking path" raycast={()=>null}>
  {tiles.map((tile,i)=><mesh key={i} position={[tile.x,.095,tile.z]} rotation={[0,tile.angle,0]} receiveShadow>
   <boxGeometry args={[.30,.028,.31]}/><meshStandardMaterial color={i%3?'#e7d7a8':'#efdeb5'} roughness={.98}/>
  </mesh>)}
 </group>
}
/** Small robot in the real Three.js scene, not the former CSS sprite orbit. */
export function MiroWalker3D({worldNumber,points,earnedPoints,spiritualPoints,reactionTick,onTalk,onGreeting}:Props){
 const path=miroRoute(worldNumber)
 const robot=useRef<Group>(null),body=useRef<Group>(null),head=useRef<Group>(null)
 const leftArm=useRef<Group>(null),rightArm=useRef<Group>(null)
 const leftLeg=useRef<Group>(null),rightLeg=useRef<Group>(null)
 const eyes=useRef<Group>(null)
 const state=useRef({next:1,hold:1.4,step:0,celebrate:0,wave:0,greeted:false})
 const previous=useRef({earnedPoints,spiritualPoints})
 useEffect(()=>{
  const old=previous.current
  if(earnedPoints>old.earnedPoints){
   state.current.celebrate=3;state.current.wave=3
   onGreeting('✨ Ура, Илья! Наш остров стал ещё красивее!')
  }else if(spiritualPoints>old.spiritualPoints){
   state.current.celebrate=2.5;state.current.wave=2.5
   onGreeting('🌱 Отлично, Илья! Ещё один хороший шаг!')
  }
  previous.current={earnedPoints,spiritualPoints}
 },[earnedPoints,spiritualPoints,onGreeting])
 useEffect(()=>{if(reactionTick>0){state.current.wave=2;state.current.hold=Math.max(state.current.hold,.65)}},[reactionTick])
 useFrame(({clock},delta)=>{
  const root=robot.current
  if(!root)return
  const dt=Math.min(delta,.05),s=state.current,t=clock.elapsedTime
  s.celebrate=Math.max(0,s.celebrate-dt)
  s.wave=Math.max(0,s.wave-dt)
  let walking=false
  if(s.hold>0)s.hold=Math.max(0,s.hold-dt)
  else{
   const target=path[s.next]
   const dx=target.x-root.position.x,dz=target.z-root.position.z
   const length=Math.hypot(dx,dz)
   if(length<=.035){
    root.position.x=target.x;root.position.z=target.z
    s.hold=target.hold??.2
    s.next=(s.next+1)%path.length
    if(target.home&&!s.greeted){
     s.greeted=true;s.wave=3
     onGreeting(points>=(worldNumber===1?360:650)?'🤖 Привет, Илья! Я пришёл к нашему домику. Давай посмотрим, что мы построили!':'🤖 Привет, Илья! Я уже гуляю по дорожкам. Скоро здесь появится домик!')
    }
   }else{
    const advance=Math.min(length,WALK_SPEED*dt)
    root.position.x+=dx/length*advance
    root.position.z+=dz/length*advance
    const turn=Math.atan2(dx,dz)
    root.rotation.y+=Math.atan2(Math.sin(turn-root.rotation.y),Math.cos(turn-root.rotation.y))*(1-Math.exp(-dt*5))
    s.step+=advance*13
    walking=true
   }
  }
  const stride=walking?Math.sin(s.step)*.40:0
  if(leftLeg.current)leftLeg.current.rotation.x=stride
  if(rightLeg.current)rightLeg.current.rotation.x=-stride
  if(leftArm.current)leftArm.current.rotation.x=-stride*.65
  if(rightArm.current){
   rightArm.current.rotation.x=stride*.65
   rightArm.current.rotation.z=s.wave>0?-.65-.42*Math.sin(t*12):.12
  }
  if(body.current)body.current.position.y=.66+(walking?Math.abs(Math.sin(s.step))*.03:Math.sin(t*2.1)*.014)+(s.celebrate>0?Math.abs(Math.sin(t*12))*.09:0)
  if(head.current)head.current.rotation.z=s.wave>0?.08*Math.sin(t*7):Math.sin(t*1.4)*.04
  if(eyes.current)eyes.current.scale.y=1-.88*Math.pow(Math.max(0,Math.cos(t*1.1)),90)
 })
 return <>
  {points>=40&&<RobotPath worldNumber={worldNumber}/>}
  <group ref={robot} position={[path[0].x,0,path[0].z]} name="Miro 3D walking companion" onClick={e=>{if(e.delta>9)return;e.stopPropagation();state.current.wave=3;onTalk()}}>
   <mesh position={[0,.105,0]} rotation={[-Math.PI/2,0,0]} raycast={()=>null}>
    <circleGeometry args={[.28,18]}/><meshBasicMaterial color="#264c6a" transparent opacity={.14} depthWrite={false}/>
   </mesh>
   <group ref={leftLeg} position={[-.13,.35,0]}>
    <mesh position={[0,-.17,0]} castShadow><capsuleGeometry args={[.08,.17,4,8]}/><meshStandardMaterial color="#cee7f5"/></mesh>
    <Shell size={[.19,.13,.24]} position={[0,-.29,.07]} color="#8abedd"/>
   </group>
   <group ref={rightLeg} position={[.13,.35,0]}>
    <mesh position={[0,-.17,0]} castShadow><capsuleGeometry args={[.08,.17,4,8]}/><meshStandardMaterial color="#cee7f5"/></mesh>
    <Shell size={[.19,.13,.24]} position={[0,-.29,.07]} color="#8abedd"/>
   </group>
   <group ref={body} position={[0,.66,0]}>
    <mesh castShadow><sphereGeometry args={[.30,20,16]}/><meshStandardMaterial color="#e9f6ff" roughness={.36} metalness={.15}/></mesh>
    <mesh position={[0,-.02,.259]}><sphereGeometry args={[.145,14,12]}/><meshBasicMaterial color="#7beee5"/></mesh>
    <mesh position={[0,-.02,.271]}><sphereGeometry args={[.072,12,10]}/><meshBasicMaterial color="#e3fffc"/></mesh>
    <group ref={leftArm} position={[-.305,.10,0]} rotation={[0,0,-.12]}>
     <mesh position={[-.09,-.14,0]} castShadow><capsuleGeometry args={[.095,.17,4,8]}/><meshStandardMaterial color="#e0f2fd" roughness={.4}/></mesh>
     <mesh position={[-.09,-.31,.02]}><sphereGeometry args={[.095,12,10]}/><meshStandardMaterial color="#7bc5e2"/></mesh>
    </group>
    <group ref={rightArm} position={[.305,.10,0]} rotation={[0,0,.12]}>
     <mesh position={[.09,-.14,0]} castShadow><capsuleGeometry args={[.095,.17,4,8]}/><meshStandardMaterial color="#e0f2fd" roughness={.4}/></mesh>
     <mesh position={[.09,-.31,.02]}><sphereGeometry args={[.095,12,10]}/><meshStandardMaterial color="#7bc5e2"/></mesh>
    </group>
    <group ref={head} position={[0,.48,0]}>
     <mesh castShadow><sphereGeometry args={[.345,22,16]}/><meshStandardMaterial color="#edfaff" roughness={.27} metalness={.10}/></mesh>
     <mesh position={[0,.005,.287]} scale={[1.07,.75,.32]}><sphereGeometry args={[.265,20,14]}/><meshStandardMaterial color="#102d4b" roughness={.3}/></mesh>
     <group ref={eyes}>
      <mesh position={[-.116,.055,.369]}><sphereGeometry args={[.054,12,10]}/><meshBasicMaterial color="#64f3e8"/></mesh>
      <mesh position={[.116,.055,.369]}><sphereGeometry args={[.054,12,10]}/><meshBasicMaterial color="#64f3e8"/></mesh>
     </group>
     <mesh position={[0,-.076,.369]} scale={[1,.32,.5]}><sphereGeometry args={[.059,12,10]}/><meshBasicMaterial color="#6bf7ee"/></mesh>
     <mesh position={[0,.35,0]}><cylinderGeometry args={[.025,.035,.18,10]}/><meshStandardMaterial color="#b8dded"/></mesh>
     <mesh position={[0,.46,0]}><sphereGeometry args={[.072,12,10]}/><meshBasicMaterial color="#8afcf0"/></mesh>
    </group>
   </group>
  </group>
 </>
}
