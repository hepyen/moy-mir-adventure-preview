import {useEffect,useMemo,useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type {Group} from 'three'
import {DECOR_SPECS,decorPosition} from './worldDecor'
import type {DecorId,DecorLayout} from './worldDecor'

type Coord=[number,number,number]
function Timber({at,dim,color,rot=[0,0,0]}:{at:Coord;dim:Coord;color:string;rot?:Coord}){
 const geometry=useMemo(()=>new RoundedBoxGeometry(...dim,3,.035),[dim[0],dim[1],dim[2]])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 return <mesh geometry={geometry} position={at} rotation={rot} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.79}/></mesh>
}
function Orb({at,r,color}:{at:Coord;r:number;color:string}){
 return <mesh position={at} castShadow><sphereGeometry args={[r,12,10]}/><meshStandardMaterial color={color} roughness={.75}/></mesh>
}
function Blossom({x,z,color}:{x:number;z:number;color:string}){
 return <group position={[x,0,z]}>
  <mesh position={[0,.16,0]}><cylinderGeometry args={[.017,.025,.27,7]}/><meshStandardMaterial color="#438e51"/></mesh>
  {Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return <Orb key={i} at={[Math.cos(a)*.08,.31,Math.sin(a)*.08]} r={.073} color={color}/>})}
  <Orb at={[0,.32,0]} r={.055} color="#ffe7a0"/>
 </group>
}
function DecorationModel({id,lightOn}:{id:DecorId;lightOn:boolean}){
 switch(id){
  case 'flowerpot':return <group>
   <mesh position={[0,.14,0]} castShadow><cylinderGeometry args={[.17,.12,.28,10]}/><meshStandardMaterial color="#d87955" roughness={.9}/></mesh>
   <mesh position={[0,.29,0]}><cylinderGeometry args={[.16,.16,.04,10]}/><meshStandardMaterial color="#684735"/></mesh>
   {[[0,0],[-.09,.03],[.09,-.04]].map(([x,z],i)=><Blossom key={i} x={x} z={z} color={['#f78fad','#ffdb73','#d39cf5'][i]}/>)}
  </group>
  case 'bench':return <group>
   {[-.46,.46].flatMap(x=>[-.23,.23].map(z=><Timber key={x+','+z} at={[x,.26,z]} dim={[.12,.48,.13]} color="#65452f"/>))}
   <Timber at={[0,.52,0]} dim={[1.22,.15,.56]} color="#ae764a"/>
   {[-.46,.46].map(x=><Timber key={x} at={[x,.79,-.24]} dim={[.11,.49,.13]} color="#795037"/>)}
   <Timber at={[0,.85,-.25]} dim={[1.21,.29,.12]} color="#c38a59"/>
   <Timber at={[0,1.05,-.25]} dim={[1.21,.10,.12]} color="#a36b43"/>
  </group>
  case 'lamp':return <group>
   <Timber at={[0,.80,0]} dim={[.085,1.56,.085]} color="#765842"/>
   <Timber at={[0,1.55,0]} dim={[.39,.07,.39]} color="#caa571"/>
   <Orb at={[0,1.73,0]} r={.17} color={lightOn?'#fff1a4':'#c5a47a'}/>
   {lightOn&&<pointLight position={[0,1.72,0]} intensity={1.15} color="#ffe3a0" distance={3.2}/>}
  </group>
  case 'mailbox':return <group>
   <Timber at={[0,.53,0]} dim={[.1,1.06,.12]} color="#85674a"/>
   <Timber at={[0,1.12,0]} dim={[.46,.36,.36]} color="#d76a64"/>
   <Timber at={[0,1.13,.195]} dim={[.28,.035,.03]} color="#fff3de"/>
  </group>
  case 'flowerbed':return <group>
   <Timber at={[0,.09,0]} dim={[.84,.16,.48]} color="#a27249"/>
   {[[-.25,-.06],[.04,.09],[.29,-.04]].map(([x,z],i)=><Blossom key={i} x={x} z={z} color={['#f15aa8','#ffbd48','#fa83ae'][i]}/>)}
  </group>
 }
}
function Decoration({id,at,selected,lightsOn,onSelect}:{id:DecorId;at:{x:number;z:number};selected:boolean;lightsOn:boolean;onSelect:()=>void}){
 const ref=useRef<Group>(null)
 useFrame(({clock})=>{if(ref.current&&selected)ref.current.rotation.y=Math.sin(clock.elapsedTime*1.6)*.08})
 return <group ref={ref} position={[at.x,0,at.z]} onClick={e=>{if(e.delta>9)return;e.stopPropagation();onSelect()}}>
  <DecorationModel id={id} lightOn={lightsOn}/>
  {selected&&<mesh position={[0,.10,0]} rotation={[-Math.PI/2,0,0]} raycast={()=>null}>
   <ringGeometry args={[.57,.64,34]}/><meshBasicMaterial color="#f8ed70" transparent opacity={.82} depthWrite={false}/>
  </mesh>}
 </group>
}
export function WorldDecorations({world,points,layout,selected,lightsOn,onSelect}:{world:1|2;points:number;layout:DecorLayout;selected:DecorId|null;lightsOn:boolean;onSelect:(id:DecorId)=>void}){
 return <group name="Moveable island decorations">
  {DECOR_SPECS[world].filter(x=>points>=x.unlock).map(spec=><Decoration key={spec.id} id={spec.id} at={decorPosition(world,layout,spec.id)} selected={selected===spec.id} lightsOn={lightsOn} onSelect={()=>onSelect(spec.id)}/>)}
 </group>
}
