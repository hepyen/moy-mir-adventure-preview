import {useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import type {Group} from 'three'
import {dogPathPosition} from './dogRoute'
function Ellipsoid({at,radius,scale=[1,1,1],color}:{at:[number,number,number];radius:number;scale?:[number,number,number];color:string}){
 return <mesh position={at} scale={scale} castShadow><sphereGeometry args={[radius,20,16]}/><meshStandardMaterial color={color} roughness={.79}/></mesh>
}
function Ear({x}:{x:number}){
 return <group position={[x,.28,-.02]} rotation={[0,0,x<0?.30:-.30]}>
  <Ellipsoid at={[0,-.14,0]} radius={.17} scale={[.65,1.5,.45]} color="#a86a43"/>
  <Ellipsoid at={[0,-.15,.075]} radius={.10} scale={[.56,1.35,.3]} color="#cb8c64"/>
 </group>
}
export function DogActor({points}:{points:number}){
 const root=useRef<Group>(null),body=useRef<Group>(null)
 const face=useRef<Group>(null),tail=useRef<Group>(null)
 const frontLeft=useRef<Group>(null),frontRight=useRef<Group>(null)
 const backLeft=useRef<Group>(null),backRight=useRef<Group>(null)
 const eyes=useRef<Group>(null)
 useFrame(({clock})=>{
  const t=clock.elapsedTime
  const progress=(t%29)/29
  const [x,y,z]=dogPathPosition(progress,points)
  const [nx,,nz]=dogPathPosition((progress+.001)%1,points)
  const isBench=y>.30
  if(root.current){
   root.current.position.set(x,y,z)
   const dx=nx-x,dz=nz-z
   if(Math.hypot(dx,dz)>.0003)root.current.rotation.y=Math.atan2(dx,dz)
  }
  if(body.current)body.current.position.y=.015+Math.abs(Math.sin(t*11))*(isBench?.009:.033)
  if(face.current)face.current.rotation.z=Math.sin(t*1.7)*.09
  if(tail.current)tail.current.rotation.y=Math.sin(t*10)*.65
  const stride=isBench?.11:.44
  if(frontLeft.current)frontLeft.current.rotation.x=Math.sin(t*13)*stride
  if(frontRight.current)frontRight.current.rotation.x=-Math.sin(t*13)*stride
  if(backLeft.current)backLeft.current.rotation.x=-Math.sin(t*13)*stride
  if(backRight.current)backRight.current.rotation.x=Math.sin(t*13)*stride
  if(eyes.current)eyes.current.scale.y=1-.85*Math.pow(Math.max(0,Math.cos(t*1.42)),48)
 })
 return <group ref={root} position={[2.25,0,.37]} scale={.56}>
  <group ref={body}>
   <Ellipsoid at={[0,.45,-.12]} radius={.38} scale={[.73,.78,1.18]} color="#d99a5f"/>
   <Ellipsoid at={[0,.43,.23]} radius={.28} scale={[.72,.88,.56]} color="#f7d1a0"/>
   {[-.22,.22].map((x,i)=><group key={i} position={[x,.36,.18]}>
    <group ref={i===0?frontLeft:frontRight}>
     <Ellipsoid at={[0,-.19,.05]} radius={.135} scale={[.8,1.3,.85]} color="#ca8551"/>
     <Ellipsoid at={[0,-.32,.1]} radius={.13} scale={[.9,.45,1.2]} color="#efc190"/>
    </group>
   </group>)}
   {[-.23,.23].map((x,i)=><group key={i} position={[x,.34,-.4]}>
    <group ref={i===0?backLeft:backRight}>
     <Ellipsoid at={[0,-.17,.03]} radius={.14} scale={[.82,1.3,.95]} color="#c58551"/>
     <Ellipsoid at={[0,-.30,.11]} radius={.13} scale={[.88,.45,1.05]} color="#eabb87"/>
    </group>
   </group>)}
   <group ref={tail} position={[0,.62,-.47]} rotation={[.7,0,0]}>
    <Ellipsoid at={[0,.24,-.06]} radius={.14} scale={[.65,1.9,.65]} color="#c98351"/>
    <Ellipsoid at={[0,.44,-.10]} radius={.13} scale={[.9,.7,.72]} color="#f2b779"/>
   </group>
   <group ref={face} position={[0,.83,.30]}>
    <Ellipsoid at={[0,.07,0]} radius={.36} scale={[.98,.89,.85]} color="#e5a86b"/>
    <Ear x={-.29}/><Ear x={.29}/>
    <Ellipsoid at={[0,-.13,.27]} radius={.22} scale={[.95,.61,.82]} color="#ffe1b9"/>
    <Ellipsoid at={[0,-.06,.44]} radius={.083} scale={[1.1,.72,.65]} color="#33333d"/>
    <group ref={eyes}>
     {[-.155,.155].map(x=><group key={x}>
      <Ellipsoid at={[x,.13,.305]} radius={.082} scale={[.8,1.14,.55]} color="#fffaf3"/>
      <Ellipsoid at={[x+.012,.13,.35]} radius={.048} scale={[.82,1.1,.48]} color="#273344"/>
      <Ellipsoid at={[x+.022,.151,.371]} radius={.017} color="#fff"/>
     </group>)}
    </group>
    <Ellipsoid at={[0,-.22,.35]} radius={.064} scale={[.6,1.12,.31]} color="#df667b"/>
    {[-.21,.21].map(x=><Ellipsoid key={x} at={[x,-.12,.30]} radius={.069} scale={[.9,.43,.37]} color="#f0b292"/>)}
   </group>
  </group>
 </group>
}
