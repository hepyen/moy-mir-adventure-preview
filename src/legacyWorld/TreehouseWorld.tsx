import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3 } from 'three'
import type { Group } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { squirrelPathPosition } from './squirrelRoute'

type Coord=[number,number,number]
function Timber({at,dim,color='#bd8654',turn=[0,0,0]}:{at:Coord;dim:Coord;color?:string;turn?:Coord}){
 const [dx,dy,dz]=dim
 const geometry=useMemo(()=>new RoundedBoxGeometry(dx,dy,dz,3,Math.min(.065,dx/4,dy/4,dz/4)),[dx,dy,dz])
 return <mesh position={at} rotation={turn} castShadow receiveShadow geometry={geometry}><meshStandardMaterial color={color} roughness={.77}/></mesh>
}
function Orb({at,r,color,scale=[1,1,1]}:{at:Coord;r:number;color:string;scale?:Coord}){
 return <mesh position={at} scale={scale} castShadow><sphereGeometry args={[r,16,12]}/><meshStandardMaterial color={color} roughness={.87}/></mesh>
}
function Limb({a,b,r=0.2,color='#8d5835'}:{a:Coord;b:Coord;r?:number;color?:string}){
 const [ax,ay,az]=a,[bx,by,bz]=b
 const {at,rotation,length}=useMemo(()=>{
  const from=new Vector3(ax,ay,az),to=new Vector3(bx,by,bz),d=to.clone().sub(from)
  return {at:from.clone().add(to).multiplyScalar(.5),rotation:new Quaternion().setFromUnitVectors(new Vector3(0,1,0),d.clone().normalize()),length:d.length()}
 },[ax,ay,az,bx,by,bz])
 return <mesh position={at} quaternion={rotation} castShadow receiveShadow>
  <cylinderGeometry args={[r*.67,r,length,12]}/><meshStandardMaterial color={color} roughness={.96}/>
 </mesh>
}
function LeafCloud({at,r=1,color='#46aa53'}:{at:Coord;r?:number;color?:string}){
 const canopyRef=useRef<Group>(null)
 useFrame(({clock})=>{
  if(!canopyRef.current)return
  canopyRef.current.rotation.z=Math.sin(clock.elapsedTime*.56+at[0]*.8)*.032
  canopyRef.current.rotation.x=Math.sin(clock.elapsedTime*.4+at[1])*.018
 })
 return <group ref={canopyRef} position={at}>
  <Orb at={[0,0,0]} r={r*.7} color={color} scale={[1.3,.82,1]}/>
  {Array.from({length:8},(_,i)=>{
   const a=i*Math.PI/4
   return <Orb key={i} at={[Math.cos(a)*r*.55,Math.sin(a)*r*.35,Math.sin(a*2)*.19]} r={r*.43} color={['#41a94c','#62c65b','#74d36a','#32984d'][i%4]}/>
  })}
 </group>
}
function Blossom({x,z,y=0,color='#fb8fbc'}:{x:number;z:number;y?:number;color?:string}){
 return <group position={[x,y,z]}>
  <Limb a={[0,0,0]} b={[0,.22,0]} r={.022} color="#428c48"/>
  {Array.from({length:5},(_,i)=><Orb key={i} at={[Math.cos(i*6.283/5)*.1,.29,Math.sin(i*6.283/5)*.1]} r={.082} color={color}/>)}
  <Orb at={[0,.3,0]} r={.052} color="#fbd957"/>
 </group>
}
const branchPairs: [Coord,Coord,number][]=[
 [[-.22,2.8,-.1],[-1.45,3.85,-.2],.28],
 [[-.3,3.45,-.2],[-2.4,4.55,-.67],.19],
 [[.12,3.25,-.2],[1.7,4.15,-.6],.28],
 [[1.55,4.12,-.6],[2.55,4.85,-.87],.16],
 [[-.25,4,-.45],[-.55,5.3,-.65],.24],
 [[-.8,4.1,-.2],[-1.8,5.05,-.65],.13],
 [[.45,4.05,-.4],[.75,5.15,-1.0],.19],
 [[-1.45,3.85,-.2],[-2.3,3.95,.28],.1],
]
const canopy: [Coord,number][]=[
 [[-2.42,4.52,-.9],.85],[[-1.9,5.17,-1.05],.94],
 [[-1.15,5.53,-1.2],.9],[[.06,5.7,-1.22],1.08],
 [[1.15,5.55,-1.35],.98],[[2.28,4.86,-1.23],.9],
 [[-2.6,3.99,-.52],.65],[[2.75,4.36,-.72],.67],
]
const railPosts=[-1.15,-.73,-.31,.11,.53,.95,1.37]
function Staircase({top=false}:{top?:boolean}){
 // Stair flights curl around the trunk and meet the entrance deck
 const steps=Array.from({length:8},(_,i)=>{
  const t=(i+(top?8:0))/15
  const angle=.15+t*1.75
  return {pos:[Math.sin(angle)*1.16-.25,.23+t*2.48,Math.cos(angle)*1.06+.45] as Coord,rot:-angle*.42}
 })
 return <group>
  {steps.map(({pos,rot},i)=><group key={i}>
   <Timber at={pos} dim={[.72,.13,.34]} color={i%2?'#d49d62':'#e7b875'} turn={[0,rot,0]}/>
   <Timber at={[pos[0]-.28,pos[1]-.16,pos[2]-.1]} dim={[.085,.35,.085]} color="#9a663d"/>
  </group>)}
  <Limb a={[steps[0].pos[0]-.3,steps[0].pos[1]+.2,steps[0].pos[2]+.08]} b={[steps[7].pos[0]-.3,steps[7].pos[1]+.24,steps[7].pos[2]+.08]} r={.064} color="#a47142"/>
 </group>
}
function HouseShell({part}:{part:'back'|'sides'|'front'}){
 const y=3.65
 if(part==='back')return <Timber at={[.6,y,-.65]} dim={[2.24,1.42,.17]} color="#ecba7e"/>
 if(part==='sides')return <group>
  <Timber at={[-.53,y,.13]} dim={[.18,1.44,1.52]} color="#df9c5a"/>
  <Timber at={[1.73,y,.13]} dim={[.18,1.44,1.52]} color="#edba77"/>
  {[-.39,1.6].map(x=><Timber key={x} at={[x,3.68,.93]} dim={[.13,1.47,.12]} color="#975a36"/>)}
 </group>
 return <group>
  <Timber at={[.6,4.14,.88]} dim={[2.25,.42,.18]} color="#f3ca8c"/>
  <Timber at={[-.12,3.54,.88]} dim={[.76,.82,.18]} color="#f3c486"/>
  <Timber at={[1.32,3.54,.88]} dim={[.76,.82,.18]} color="#f3c486"/>
  <Timber at={[.6,3.04,.88]} dim={[2.25,.14,.19]} color="#ab7449"/>
 </group>
}
function Window({at}:{at:Coord}){
 return <group position={at}>
  <Timber at={[0,0,0]} dim={[.72,.64,.11]} color="#fff0c9"/>
  <Timber at={[0,0,.065]} dim={[.57,.49,.045]} color="#78cce5"/>
  <Timber at={[0,0,.1]} dim={[.065,.56,.07]} color="#fff6da"/>
  <Timber at={[0,0,.1]} dim={[.63,.055,.07]} color="#fff6da"/>
  <Orb at={[.18,.12,.125]} r={.045} color="#f7f5db"/>
 </group>
}
function LivelySquirrel({points}:{points:number}){
 const root=useRef<Group>(null)
 const jump=useRef<Group>(null)
 const leftFoot=useRef<Group>(null)
 const rightFoot=useRef<Group>(null)
 const tail=useRef<Group>(null)
 const head=useRef<Group>(null)
 const eyelids=useRef<Group>(null)
 const paw=useRef<Group>(null)
 useFrame(({clock})=>{
  const t=clock.elapsedTime
  const progress=(t%35)/35
  const location=squirrelPathPosition(progress,points)
  const nextLocation=squirrelPathPosition((progress+.001)%1,points)
  const strolling=progress>.41&&progress<.6
  if(root.current){
   root.current.position.set(...location)
   if(Math.abs(nextLocation[0]-location[0])+Math.abs(nextLocation[2]-location[2])>.001){
    const facing=Math.atan2(nextLocation[0]-location[0],nextLocation[2]-location[2])
    root.current.rotation.y=facing
   }
  }
  if(jump.current){jump.current.position.y=.025+Math.abs(Math.sin(t*10))*(strolling?.01:.045);jump.current.rotation.y=Math.sin(t*.7)*.035}
  if(leftFoot.current)leftFoot.current.rotation.x=Math.sin(t*13)*.38
  if(rightFoot.current)rightFoot.current.rotation.x=-Math.sin(t*13)*.38
  if(tail.current)tail.current.rotation.z=Math.sin(t*2.9)*.22
  if(head.current)head.current.rotation.z=Math.sin(t*1.7)*.12
  if(paw.current)paw.current.rotation.z=Math.sin(t*3.7)*.27
  if(eyelids.current){const blink=Math.pow(Math.max(0,Math.cos(t*1.33)),48);eyelids.current.scale.y=1-blink*.93}
 })
 return <group ref={root} position={[2.17,0,1.35]} scale={.61}>
  <group ref={jump}>
   {/* Curling tail behind the body, clear from front camera angle */}
   <group ref={tail} position={[-.25,.31,-.22]}>
    <Orb at={[-.31,.29,-.05]} r={.31} color="#cb6d31" scale={[.7,1.25,.75]}/>
    <Orb at={[-.38,.53,.01]} r={.27} color="#df843b" scale={[.88,1.14,.83]}/>
    <Orb at={[-.28,.74,.06]} r={.21} color="#e69855"/>
    <Orb at={[-.19,.71,.18]} r={.14} color="#ffe1ab"/>
   </group>
   <Orb at={[0,.37,0]} r={.33} color="#e78c43" scale={[.85,1.16,.82]}/>
   <Orb at={[0,.34,.23]} r={.215} color="#ffdb9d" scale={[.8,1.03,.45]}/>
   <group ref={leftFoot} position={[-.15,.13,.17]}><Orb at={[0,0,0]} r={.15} color="#cc6a32" scale={[.85,.55,1]}/></group>
   <group ref={rightFoot} position={[.15,.13,.17]}><Orb at={[0,0,0]} r={.15} color="#cc6a32" scale={[.85,.55,1]}/></group>
   <group ref={head} position={[0,.66,.17]}>
    <Orb at={[0,.11,.08]} r={.31} color="#ee994c" scale={[1.06,.88,.93]}/>
    {[-.21,.21].map((x,i)=><group key={i}>
      <Orb at={[x,.35,-.005]} r={.14} color="#c87439" scale={[.75,1.15,.65]}/>
      <Orb at={[x,.35,.085]} r={.072} color="#ffb8b2"/>
    </group>)}
    <Orb at={[0,-.035,.32]} r={.19} color="#ffe2b5" scale={[1.2,.65,.6]}/>
    <group ref={eyelids}>
      {[-.135,.135].map(x=><group key={x}>
       <Orb at={[x,.17,.318]} r={.073} color="#fffaf0" scale={[.9,1.08,.5]}/>
       <Orb at={[x+.011,.171,.358]} r={.045} color="#292e35" scale={[.75,1.05,.55]}/>
       <Orb at={[x+.018,.19,.385]} r={.019} color="#ffffff"/>
      </group>)}
    </group>
    <Orb at={[0,.005,.444]} r={.064} color="#422d2a" scale={[1.1,.6,.65]}/>
    <Timber at={[0,-.09,.435]} dim={[.088,.022,.025]} color="#854b38"/>
    {[-.15,.15].map(x=><Orb key={x} at={[x,-.05,.366]} r={.065} color="#f4a1a3" scale={[1.0,.44,.42]}/>)}
   </group>
   <Orb at={[-.17,.45,.29]} r={.107} color="#e8a05c" scale={[.75,1.18,.7]}/>
   <group ref={paw} position={[.16,.48,.31]}><Orb at={[0,0,0]} r={.107} color="#e8a05c" scale={[.75,1.18,.7]}/></group>
   <Orb at={[.03,.48,.43]} r={.092} color="#ac6f40" scale={[.75,1.1,.7]}/>
  </group>
 </group>
}
export function TreehousePiece({index,points}:{index:number;points:number}){
 switch(index){
 case 0:return <group>
  <Limb a={[0,0,0]} b={[-.15,4.1,-.25]} r={.54}/>
  <Limb a={[-.15,3.55,-.25]} b={[-.53,4.85,-.5]} r={.3}/>
  {[-1,1].map(i=><Limb key={i} a={[-.04,.55,-.13]} b={[i*.98,.02,i*.4]} r={.19}/>)}
  {Array.from({length:7},(_,i)=><Timber key={i} at={[.3+.02*Math.sin(i),.5+i*.44,.29]} dim={[.09,.11,.1]} color="#70432c"/>)}
 </group>
 case 1:return <group>{branchPairs.slice(0,4).map(([a,b,r],i)=><Limb key={i} a={a} b={b} r={r}/>)}</group>
 case 2:return <group>{branchPairs.slice(4).map(([a,b,r],i)=><Limb key={i} a={a} b={b} r={r}/>)}</group>
 case 3:return <group>{canopy.slice(0,3).map(([at,r],i)=><LeafCloud key={i} at={at} r={r}/>)}</group>
 case 4:return <group>{canopy.slice(3,6).map(([at,r],i)=><LeafCloud key={i} at={at} r={r}/>)}</group>
 case 5:return <group>{canopy.slice(6).map(([at,r],i)=><LeafCloud key={i} at={at} r={r}/>)}{[[-1.65,5.43,-.53],[1.8,5.15,-.67]].map(([x,y,z],i)=><Orb key={i} at={[x,y,z]} r={.15} color="#f29ec3"/>)}</group>
 case 6:return <group>
  <Timber at={[-.05,.88,.5]} dim={[.73,1.2,.12]} color="#b87945"/>
  <Timber at={[-.05,1.39,.59]} dim={[.67,.19,.13]} color="#f7d391"/>
  <Orb at={[.14,.86,.59]} r={.045} color="#f5db95"/>
  <Orb at={[-.05,1.08,.6]} r={.13} color="#ffdd76"/>
 </group>
 case 7:return <group>{[-2,-1,0,1,2].map((i)=><Orb key={i} at={[Math.sin(i)*.7,.12,Math.cos(i)*.7]} r={.24} color="#438f44"/>)}</group>
 case 8:return <group><Timber at={[.59,2.92,.12]} dim={[3.1,.2,2.15]} color="#ae7549"/>{Array.from({length:12},(_,i)=><Timber key={i} at={[-.8+i*.25,3.045,.13]} dim={[.20,.07,2.04]} color={i%2?'#d6a16d':'#e0ae76'}/>)}</group>
 case 9:return <group>{[-1.1,1.4].map(x=><Limb key={x} a={[x,2.85,.9]} b={[x*.52,.5,.3]} r={.13} color="#8b5a38"/>)}</group>
 case 10:return <Staircase/>
 case 11:return <Staircase top/>
 case 12:return <HouseShell part="back"/>
 case 13:return <HouseShell part="sides"/>
 case 14:return <HouseShell part="front"/>
 case 15:return <group>
  <Timber at={[.57,3.44,.99]} dim={[.59,.97,.095]} color="#9a5b38"/>
  <Timber at={[.57,3.9,1.06]} dim={[.46,.13,.085]} color="#b97749"/>
  <Orb at={[.76,3.42,1.064]} r={.048} color="#ffdc82"/>
 </group>
 case 16:return <group><Window at={[-.17,3.72,1]}/><Window at={[1.38,3.72,1]}/></group>
 case 17:return <Timber at={[-.07,4.64,.12]} dim={[1.65,.17,2.15]} color="#dc6646" turn={[0,0,.57]}/>
 case 18:return <Timber at={[1.3,4.64,.12]} dim={[1.65,.17,2.15]} color="#cf4a3a" turn={[0,0,-.57]}/>
 case 19:return <group>
  <Timber at={[.61,5.07,.12]} dim={[.16,.18,2.32]} color="#f08e57"/>
  <Timber at={[.6,4.68,1.21]} dim={[2.63,.10,.13]} color="#f8ad6b"/>
  <Orb at={[.6,4.91,1.16]} r={.14} color="#ffcf6d"/>
 </group>
 case 20:return <group>
  <Timber at={[.6,3.02,1.39]} dim={[2.9,.15,.69]} color="#b57b4a"/>
  {railPosts.map(x=><Timber key={x} at={[x+.6,3.42,1.7]} dim={[.075,.73,.07]} color="#e1ac72"/>)}
  <Timber at={[.6,3.79,1.7]} dim={[2.8,.11,.12]} color="#98613c"/>
 </group>
 case 21:return <group>
  <Timber at={[-2.25,3.02,.1]} dim={[1.4,.14,1.42]} color="#b68050"/>
  {[-2.82,-1.66].map(x=><Timber key={x} at={[x,3.39,.74]} dim={[.09,.72,.09]} color="#e9ba83"/>)}
  <Timber at={[-2.25,3.76,.74]} dim={[1.37,.10,.10]} color="#d6a276"/>
  <Orb at={[-2.31,3.2,.05]} r={.27} color="#edc695"/>
 </group>
 case 22:return <group>
  {/* Flower beds and flowering bushes frame the lawn without blocking stairs */}
  {[
   [-2.43,-1.6],[-1.88,-1.8],[-1.24,-1.83],[-2.52,.65],
   [-2.28,1.5],[-1.82,1.86],[.12,-1.86],[.78,-1.77],
   [1.4,-1.73],[2.22,-1.14],[2.45,-.48],[2.5,.77],
   [2.42,1.55],[-.77,1.82]
  ].map(([x,z],i)=><group key={i}>
   <Orb at={[x,.14,z]} r={.23} color={i%2?'#42a34e':'#56ba56'} scale={[1.4,.64,1.1]}/>
   <Blossom x={x-.10} z={z} color={i%3===0?'#fff2b4':i%3===1?'#f58fbc':'#f7b76d'}/>
   <Blossom x={x+.12} z={z+.04} color={i%2?'#ff87a8':'#f4dd91'}/>
  </group>)}
  {[-1.9,1.93].map((x,i)=><group key={'bush'+i}>
   <Orb at={[x,.23,-.96]} r={.35} color="#388f46"/>
   <Orb at={[x+.19,.28,-.92]} r={.27} color="#62bf57"/>
   <Blossom x={x} z={-1.05} y={.19} color="#fa9cbe"/>
  </group>)}

  {[-.32,.32].map(x=><Limb key={x} a={[-2.37+x,4.17,.2]} b={[-2.37+x,2.72,.65]} r={.025} color="#e1bb81"/>)}
  <Timber at={[-2.37,2.7,.65]} dim={[.82,.11,.44]} color="#ca8d57"/>
  <Orb at={[-2.36,2.83,.56]} r={.21} color="#ffcc69"/>
 </group>
 case 23:return <group>{[[-1.7,4.2,.17],[2.07,4.23,.23],[.42,3.83,1.71]].map(([x,y,z],i)=><group key={i}>
  <Limb a={[x,y+.4,z]} b={[x,y+.1,z]} r={.019} color="#766047"/>
  <Orb at={[x,y,z]} r={.15} color="#ffdc7a"/>
  <Orb at={[x,y,z+.055]} r={.09} color="#fff1ab"/>
 </group>)}</group>
 case 24:return <group>{[-.65,1.42].map((x,i)=><group key={i}>{Array.from({length:5},(_,n)=><Orb key={n} at={[x+.04*Math.sin(n),4.06-n*.25,1.18]} r={.115} color={n%2?'#48a65d':'#66c961'}/>)}</group>)}</group>
 case 25:return <group>{[-.57,.1,.8,1.36].map((x,i)=><group key={i}><Timber at={[x,3.62,1.77]} dim={[.4,.19,.22]} color="#b07746"/><Blossom x={x} y={3.73} z={1.85} color={i%2?'#ffb665':'#ff85ac'}/></group>)}</group>
 case 26:return <group>{Array.from({length:6},(_,i)=><Timber key={i} at={[-1.7+i*.39,.085,1.43+i*.14]} dim={[.34,.10,.27]} color="#e4c29b"/>)}</group>
 case 27:return <LivelySquirrel points={points}/>
 case 28:return <group>{Array.from({length:13},(_,i)=><Orb key={i} at={[Math.sin(i*1.9)*2.65,1.3+(i%5)*.67,Math.cos(i*1.4)*1.35]} r={.038} color="#ffe78d"/>)}</group>
 default:return <group>{Array.from({length:17},(_,i)=><Orb key={i} at={[Math.sin(i*1.13)*2.35,2.5+(i%6)*.44,Math.cos(i*1.87)*1.32]} r={.05} color={i%2?'#ffdf7d':'#f6a0c3'}/>)}</group>
 }
}
export function AnimatedTreehousePiece({index,at,points}:{index:number;at:number;points:number}){
 const ref=useRef<Group>(null)
 const [start]=useState(()=>points>=at?1:.001)
 useFrame((_,dt)=>{if(!ref.current)return;const target=points>=at?1:.001;const value=ref.current.scale.y+(target-ref.current.scale.y)*(1-Math.exp(-Math.min(dt,.05)*3));ref.current.scale.set(value,value,value);ref.current.visible=value>.015})
 return <group ref={ref} scale={start} visible={start>.015}><TreehousePiece index={index} points={points}/></group>
}
