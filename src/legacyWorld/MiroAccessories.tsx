import {useMemo,useEffect} from 'react'
import {Shape,ExtrudeGeometry} from 'three'
type V=[number,number,number]
export function RobotHeadphones({width=.5,height=.3,depth=.2}:{width?:number;height?:number;depth?:number}){
 const w=Math.max(.13,width),h=Math.max(.12,height)
 return <group name="robot-headphones">
  <mesh scale={[w+.055,h+.075,1]} position={[0,.025,0]}><torusGeometry args={[1,.075,12,40,Math.PI]}/><meshStandardMaterial color="#23374c" metalness={.45} roughness={.32}/></mesh>
  {[-1,1].map(d=><group key={d} position={[d*(w+.025),0,0]}><mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[h*.58,h*.58,.12,24]}/><meshStandardMaterial color="#24384d" metalness={.35}/></mesh><mesh position={[d*.065,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[h*.43,h*.43,.045,24]}/><meshStandardMaterial color="#49a8ca" metalness={.45}/></mesh><mesh position={[-d*.06,0,0]} scale={[.045,h*.59,Math.max(.09,depth*.65)]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#111e2c"/></mesh></group>)}
 </group>
}
export function RobotWings({span=.82}:{span?:number}){
 const geometry=useMemo(()=>{const s=new Shape();s.moveTo(0,.12);s.lineTo(span*.38,.34);s.lineTo(span,.63);s.lineTo(span*.85,.08);s.lineTo(span*.72,-.18);s.lineTo(span*.48,-.12);s.lineTo(span*.27,-.26);s.lineTo(0,-.16);s.closePath();return new ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:1,steps:1})},[span]);useEffect(()=>()=>geometry.dispose(),[geometry])
 return <group name="robot-wings"><mesh><boxGeometry args={[.29,.33,.16]}/><meshStandardMaterial color="#354f64" metalness={.45}/></mesh>{[-1,1].map(d=><group key={d} position={[d*.12,0,0]} scale={[d,1,1]}><mesh geometry={geometry}><meshStandardMaterial color="#d0e5f1" metalness={.55} roughness={.33}/></mesh>{[0,1,2].map(i=><mesh key={i} position={[span*(.32+i*.18),.1+i*.105,.052]} rotation={[0,0,-.48]}><boxGeometry args={[.035,.34,.018]}/><meshStandardMaterial color="#367d9c" emissive="#46d8ff" emissiveIntensity={.65}/></mesh>)}<mesh position={[span*.20,-.11,.02]}><cylinderGeometry args={[.065,.085,.28,16]}/><meshStandardMaterial color="#324d65" metalness={.5}/></mesh></group>)}</group>
}
