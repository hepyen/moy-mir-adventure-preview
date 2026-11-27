import {useEffect,useMemo,useRef} from 'react'
import {useFrame,useLoader} from '@react-three/fiber'
import {AnimationMixer,Box3,Color,Group,Mesh,MeshStandardMaterial,Vector3,SkinnedMesh,Quaternion,PropertyBinding} from 'three'
import {RobotHeadphones,RobotWings} from './MiroAccessories'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js'
import {PAINTS,type Wardrobe} from './miroWardrobe'
export const MECH_MODELS:Record<string,string>={'skin-atlas':'George','skin-vector':'Leela','skin-titan':'Mike','skin-sentinel':'Stan'}
const optic:Record<string,string>={'optics-cyan':'#39eaff','optics-amber':'#ffc153','optics-red':'#ff473d','optics-green':'#61ff72','optics-white':'#e8faff'}
const trim:Record<string,string>={'trim-black':'#20242a','trim-steel':'#8396a5','trim-orange':'#eb7824','trim-cyan':'#1bbbd0','trim-gold':'#d8ad45'}
function Panel({p,s,c,rotation=0}:{p:[number,number,number];s:[number,number,number];c:string;rotation?:number}){const geom=useMemo(()=>new RoundedBoxGeometry(s[0],s[1],s[2],2,Math.min(...s)*.24),[s[0],s[1],s[2]]);useEffect(()=>()=>geom.dispose(),[geom]);return <mesh position={p} rotation={[0,0,rotation]} geometry={geom}><meshStandardMaterial color={c} metalness={.42} roughness={.36}/></mesh>}
function Lens({x=0,y=0,z=0,r=.055,c='#47eaff'}:{x?:number;y?:number;z?:number;r?:number;c?:string}){return <group position={[x,y,z]}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[r*1.32,r*1.32,.035,16]}/><meshStandardMaterial color="#202b35" metalness={.8} roughness={.3}/></mesh><mesh position={[0,0,.023]}><sphereGeometry args={[r,16,10]}/><meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.6} roughness={.15}/></mesh></group>}
export function MiroMech({look,rotation=0,animate=true,walking=false}:{look:Wardrobe;rotation?:number;animate?:boolean;walking?:boolean}){
 const model=MECH_MODELS[look.skin]||'George',gltf=useLoader(GLTFLoader,import.meta.env.BASE_URL+'miro/mechs/'+model+'.glb')
 const rig=useMemo(()=>clone(gltf.scene),[gltf]),root=useRef<Group>(null)
 const setup=useMemo(()=>{const materials:MeshStandardMaterial[]=[];let eye=new Vector3(0,1.5,.25);rig.updateMatrixWorld(true);const box=new Box3().setFromObject(rig),size=box.getSize(new Vector3()),center=box.getCenter(new Vector3()),scale=2.04/Math.max(size.y,size.x*.83)
 rig.traverse(o=>{if(o instanceof Mesh){const map=(m:any)=>{const copy=m.clone() as MeshStandardMaterial;copy.userData.originalColor=copy.color.clone();materials.push(copy);return copy};o.material=Array.isArray(o.material)?o.material.map(map):map(o.material);const m=Array.isArray(o.material)?o.material: [o.material];for(let i=0;i<m.length;i++){if(m[i].name==='Eye'){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;if(b)eye=b.getCenter(new Vector3()).applyMatrix4(o.matrixWorld)}}}})
 // Use known eye center from the source geometry; masks sit on the head bone, not on the static ground.
 const raw:Record<string,number[]>={George:[0,5.246,.386],Leela:[0,3.755,.837],Mike:[0,4.938,.532],Stan:[0,6.19,.164]}
 eye.set(raw[model][0],raw[model][1],raw[model][2])
 const head=rig.getObjectByName('Head');const headLocal=head?head.worldToLocal(eye.clone()):eye.clone()
 const headBox=new Box3(),vertex=new Vector3()
 rig.traverse(o=>{if(!(o instanceof SkinnedMesh)||!head)return;const index=o.skeleton.bones.findIndex(b=>b===head),si=o.geometry.getAttribute('skinIndex'),sw=o.geometry.getAttribute('skinWeight');if(index<0||!si||!sw)return;for(let i=0;i<si.count;i++){let weight=0;for(let j=0;j<4;j++)if(si.getComponent(i,j)===index)weight+=sw.getComponent(i,j);if(weight>.6)headBox.expandByPoint(o.getVertexPosition(i,vertex).applyMatrix4(o.matrixWorld))}})
 const hs=headBox.isEmpty()?new Vector3(.38/scale,.34/scale,.28/scale):headBox.getSize(new Vector3())
 const hc=headBox.isEmpty()?eye.clone().add(new Vector3(0,.03/scale,-.12/scale)):headBox.getCenter(new Vector3())
 const chest=rig.getObjectByName('Chest'),chestPoint=chest?.getWorldPosition(new Vector3())||new Vector3(0,box.min.y+size.y*.60,center.z)
 chestPoint.z-=.26/scale
 const limbs=['UpperLeg.L','UpperLeg.R','MidLeg.L','MidLeg.R','LowerLeg.L','LowerLeg.R','UpperArm.L','UpperArm.R','Foot.L','Foot.R'].flatMap(name=>{const bone=rig.getObjectByName(PropertyBinding.sanitizeNodeName(name));return bone?[{name,bone,rest:bone.quaternion.clone(),position:bone.position.clone()}]:[]})
 return {materials,scale,offset:new Vector3(-center.x,-box.min.y,-center.z),head,headLocal,headCenter:head?head.worldToLocal(hc):hc,headSize:hs.multiplyScalar(scale*.5),chest,chestLocal:chest?chest.worldToLocal(chestPoint):chestPoint,limbs}
 },[rig,model])
 useEffect(()=>()=>{setup.materials.forEach(m=>m.dispose())},[setup])
 const mixer=useMemo(()=>new AnimationMixer(rig),[rig])
 useEffect(()=>{const idle=gltf.animations.find(a=>a.name==='Idle');if(idle)mixer.clipAction(idle).play();return()=>{mixer.stopAllAction()}},[mixer,gltf])
 useEffect(()=>{for(const m of setup.materials){if(m.name==='Main'&&PAINTS[look.paint])m.color.set(PAINTS[look.paint]);else if(m.name==='Main')m.color.copy(m.userData.originalColor);if(m.name==='Accent'){if(trim[look.trim||''])m.color.set(trim[look.trim||'']);else m.color.copy(m.userData.originalColor)}if(m.name==='Eye'){const c=optic[look.optics||'']||'#58eaff';m.color.set(c);m.emissive=new Color(c);m.emissiveIntensity=1.2}m.metalness=m.name==='Eye'?.1:.24;m.roughness=.44}},[setup,look.paint,look.trim,look.optics,gltf])
 useFrame(({clock},dt)=>{if(root.current)root.current.rotation.y=rotation;if(animate)mixer.update(Math.min(dt,.06));if(walking){const phase=clock.elapsedTime*5.4;for(const l of setup.limbs){const wave=Math.sin(phase+(l.name.endsWith('.R')?Math.PI:0));if(l.name.startsWith('Foot.')){l.bone.position.copy(l.position);l.bone.position.z+=wave*.16/setup.scale;l.bone.position.y+=Math.max(0,Math.cos(phase+(l.name.endsWith('.R')?Math.PI:0)))*.055/setup.scale}else{l.bone.quaternion.copy(l.rest).multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),wave*(l.name.startsWith('UpperLeg')?.23:l.name.startsWith('UpperArm')?-.16:.10)))}}}})
 const c=trim[look.trim||'']||'#748b9a',e=optic[look.optics||'']||'#56eaff',v=look.visor||'visor-none',o=look.optics||'optics-default',a=look.armor||'armor-none',acc=look.accessory
 // Normalized accessory geometry; face attachment follows the animated head.
 const face=useRef<Group>(null),headset=useRef<Group>(null),wings=useRef<Group>(null)
 useFrame(()=>{const attach=(target:Group|null,bone:typeof setup.head,point:Vector3)=>{if(!target||!bone||!root.current)return;target.position.copy(root.current.worldToLocal(bone.localToWorld(point.clone())))};attach(face.current,setup.head,setup.headLocal);attach(headset.current,setup.head,setup.headCenter);attach(wings.current,setup.chest,setup.chestLocal)})
 return <group ref={root}><group scale={setup.scale}><group position={setup.offset}><primitive object={rig}/></group></group><group ref={face} position={[0,1.65,.35]}>
 {v!=='visor-none'&&<group position={[0,0,.035]}>{v==='visor-hex'?<mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.19,.22,.065,6]}/><meshStandardMaterial color="#283845" metalness={.7} roughness={.35}/></mesh>:<Panel p={[0,0,0]} s={[v==='visor-pilot'?.39:.32,v==='visor-stealth'?.20:.13,.065]} c={v==='visor-stealth'?'#141b22':c}/>}
 {v==='visor-guard'&&[-2,-1,0,1,2].map(i=><Panel key={i} p={[i*.055,-.075,.05]} s={[.021,.14,.035]} c="#202b35"/>)}{v==='visor-scanner'&&<Panel p={[0,0,.047]} s={[.29,.025,.02]} c="#22dcff"/>}</group>}
 {v!=='visor-none'&&!['optics-dual','optics-mono','optics-tri'].includes(o)&&<Lens z={.085} r={.047} c={e}/>}
 {o==='optics-dual'&&<><Lens x={-.10} z={.095} c={e}/><Lens x={.10} z={.095} c={e}/></>}{o==='optics-mono'&&<Lens z={.105} r={.095} c={e}/>}
 {o==='optics-tri'&&[-1,0,1].map(i=><Lens key={i} x={i*.10} y={i===0?.055:0} z={.1} r={.045} c={e}/>)}
 </group>
 {a!=='armor-none'&&<group>{a==='armor-shield'?<><Panel p={[0,.99,.36]} s={[.47,.41,.095]} c="#283745"/><Panel p={[0,1.035,.42]} s={[.38,.20,.07]} c={c}/><Panel p={[0,.86,.415]} s={[.25,.045,.04]} c="#a3b9c8"/></>:<>{[-1,1].map(d=><group key={d}>
 <Panel p={[d*.42,1.15,.11]} s={[a==='armor-heavy'?.32:.24,.18,.29]} c="#25323b" rotation={d*.19}/>
 <Panel p={[d*.42,1.19,.13]} s={[a==='armor-heavy'?.28:.21,.12,.26]} c={c} rotation={d*.19}/>
 {a==='armor-heavy'&&<><Panel p={[d*.47,1.08,.20]} s={[.18,.08,.16]} c="#8598a5" rotation={d*.19}/><Panel p={[d*.22,.82,.29]} s={[.19,.27,.095]} c="#25323b" rotation={d*.16}/><Panel p={[d*.22,.85,.35]} s={[.14,.20,.055]} c={c} rotation={d*.16}/></>}
 {a==='armor-tech'&&[0,1,2].map(i=><Panel key={i} p={[d*.22,.93-i*.065,.32]} s={[.16,.038,.055]} c={i===0?'#79d5ed':c} rotation={d*.16}/>)}
 {a==='armor-ranger'&&<><Panel p={[d*.24,.80,.28]} s={[.13,.19,.055]} c={c} rotation={d*.26}/><Panel p={[d*.24,.81,.325]} s={[.055,.10,.03]} c="#c5d4da" rotation={d*.26}/></>}
 </group>)}</>}</group>}
 {acc==='acc-headphones'&&<group ref={headset}><RobotHeadphones width={setup.headSize.x} height={setup.headSize.y} depth={setup.headSize.z}/></group>}
 {acc==='acc-wings'&&<group ref={wings}><RobotWings/></group>}
 {acc!=='acc-none'&&acc!=='acc-headphones'&&acc!=='acc-wings'&&<group>{acc==='acc-radar'?<><Panel p={[0,1.92,-.20]} s={[.07,.29,.07]} c={c}/><mesh position={[0,2.08,-.22]} rotation={[0,0,.35]}><sphereGeometry args={[.18,16,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={c} side={2}/></mesh></>:acc==='acc-solar'?[-1,1].map(d=><Panel key={d} p={[d*.53,1.02,-.32]} s={[.34,.45,.055]} c={acc==='acc-solar'?'#214a7a':c} rotation={d*.28}/>):acc==='acc-beacon'||acc==='acc-antenna'?<Lens y={2.06} z={-.13} r={.06} c="#ffb243"/>:<><Panel p={[0,.91,-.36]} s={[.40,.40,.20]} c={c}/>{acc==='acc-jet'&&[-1,1].map(d=><Lens key={d} x={d*.18} y={.72} z={-.49} r={.075} c="#36ddff"/>)}</>}</group>}
 </group>
}
