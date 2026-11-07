import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as cloneModel} from 'three/examples/jsm/utils/SkeletonUtils.js';
import './Island3D.css';
type Id='dog'|'robot'|'squirrel';
type Actor={root:THREE.Group;mixer?:THREE.AnimationMixer;clips:THREE.AnimationClip[];action?:THREE.AnimationAction};
const base='https://ueqtitxbvsnqmbudwxwu.supabase.co/storage/v1/object/public/moymir2-models/';
const nature='https://hidencod.github.io/tge-assets/packs/nature-kit/';
const labels:Record<Id,string>={dog:'Тобик',robot:'Миро',squirrel:'Искорка'};
const info:{id:Id;file:string;pos:[number,number,number];height:number}[]=[
{id:'dog',file:base+'dog.glb',pos:[-1.8,0,1.1],height:.95},
{id:'robot',file:base+'robot.glb',pos:[1.7,.18,1.2],height:1.22},
{id:'squirrel',file:base+'squirrel.glb',pos:[2.8,0,-1.3],height:.65}];
export default function Island3D({built=[],bridgeOpen=false}:{built?:string[];bridgeOpen?:boolean}){
const host=useRef<HTMLDivElement>(null);
const command=useRef<(id:Id,action:string)=>void>(()=>{});
const setLighting=useRef<(night:boolean)=>void>(()=>{});
const setVisible=useRef<(built:string[],open:boolean)=>void>(()=>{});
const [selected,setSelected]=useState<Id|null>(null);
const [status,setStatus]=useState('Нажми на любого жителя острова');
const [night,setNight]=useState(false);
const [loaded,setLoaded]=useState(0);
useEffect(()=>{setVisible.current(built,bridgeOpen)},[built,bridgeOpen]);
useEffect(()=>{
if(!host.current)return;
const element=host.current;let dead=false;
const scene=new THREE.Scene();scene.background=new THREE.Color('#b4e7ee');
const camera=new THREE.PerspectiveCamera(42,1,.1,100);
camera.position.set(9.8,9.2,13.6);camera.lookAt(0,.25,0);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;
renderer.shadowMap.enabled=true;renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none';
element.appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xffffff,0xb0bc92,2.6);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1c6,3.2);sun.position.set(-3,10,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const earth=new THREE.Mesh(new THREE.CylinderGeometry(4.9,4.5,.85,64),new THREE.MeshStandardMaterial({color:'#68bb55',roughness:.98}));earth.position.y=-.47;earth.receiveShadow=true;scene.add(earth);
const soil=new THREE.Mesh(new THREE.CylinderGeometry(4.48,4.12,.58,64),new THREE.MeshStandardMaterial({color:'#98754c'}));soil.position.y=-1.13;scene.add(soil);
const lake=new THREE.Mesh(new THREE.CircleGeometry(.87,48),new THREE.MeshStandardMaterial({color:'#52c8e3',metalness:.13,roughness:.3,side:THREE.DoubleSide}));lake.rotation.x=-Math.PI/2;lake.position.set(1.5,.035,-2.2);scene.add(lake);
const loader=new GLTFLoader();const actors={} as Record<Id,Actor>;const mixers:THREE.AnimationMixer[]=[];
const stage:Record<string,THREE.Group[]>={bridge:[],flowers:[],doghouse:[]};
let currentBuilt=built,currentBridge=bridgeOpen;
const visible=(tag:string)=>tag==='bridge'?currentBridge||currentBuilt.includes('Мостик'):tag==='flowers'?currentBuilt.includes('Цветник'):tag==='doghouse'?currentBuilt.includes('Домик собаки'):true;
setVisible.current=(b,open)=>{currentBuilt=b;currentBridge=open;for(const [tag,groups] of Object.entries(stage))groups.forEach(g=>g.visible=visible(tag))};
function add(url:string,position:[number,number,number],height:number,id?:Id,tag?:string){
loader.load(url,gltf=>{
if(dead)return;
const m=cloneModel(gltf.scene);const bb=new THREE.Box3().setFromObject(m),c=bb.getCenter(new THREE.Vector3());
const scale=height/Math.max(.0001,bb.max.y-bb.min.y);m.scale.setScalar(scale);
m.position.set(-c.x*scale,-bb.min.y*scale,-c.z*scale);
m.traverse(o=>{if((o as THREE.Mesh).isMesh){(o as THREE.Mesh).castShadow=true;(o as THREE.Mesh).receiveShadow=true}});
const root=new THREE.Group();root.position.set(...position);root.add(m);scene.add(root);
if(tag){root.visible=visible(tag);stage[tag].push(root)}
if(id){root.userData.id=id;const mixer=gltf.animations.length?new THREE.AnimationMixer(m):undefined;
const actor:Actor={root,mixer,clips:gltf.animations};actors[id]=actor;
if(mixer){mixers.push(mixer);play(id,'Idle')}setLoaded(x=>x+1)}
},undefined,()=>id&&setStatus('Загрузка '+labels[id]+' не удалась'));
}
function play(id:Id,name:string){const a=actors[id];if(!a?.mixer)return;const clip=a.clips.find(c=>c.name.toLowerCase().endsWith(name.toLowerCase()))||a.clips.find(c=>c.name.toLowerCase().includes(name.toLowerCase()));if(!clip)return;
const next=a.mixer.clipAction(clip);if(next!==a.action){a.action?.fadeOut(.18);next.reset().fadeIn(.18).play();a.action=next}}
add('https://static.poly.pizza/8ab3d7cd-dcce-4535-8c64-a22aa0487050.glb',[-.45,0,-1.62],2.4);
[[-3.65,0,-1.4],[3.48,0,-1.0],[-3.6,0,1.85],[3.5,0,2.1]].forEach((p,i)=>add(nature+(i%2?'tree-oak.glb':'tree-default.glb'),p as [number,number,number],2.6));
[[-2.6,0,2.65],[-1.2,0,3.3],[.3,0,3.25],[2.4,0,2.5],[-3.25,0,.3]].forEach((p,i)=>add(nature+(i%2?'flower-reda.glb':'flower-yellowb.glb'),p as [number,number,number],.35));
add(nature+'bridge-wood.glb',[1.4,0,-2.2],.36,undefined,'bridge');
add('https://static.poly.pizza/8ab3d7cd-dcce-4535-8c64-a22aa0487050.glb',[-2.0,0,2.2],.72,undefined,'doghouse');
[[-2.1,0,3.4],[-.5,0,3.65],[1.0,0,3.55]].forEach((p,i)=>add(nature+(i%2?'flower-reda.glb':'flower-yellowb.glb'),p as [number,number,number],.6,undefined,'flowers'));
info.forEach(a=>add(a.file,a.pos,a.height,a.id));
const goals:Partial<Record<Id,THREE.Vector3>>={};
const effects:Partial<Record<Id,{time:number;mode:string}>>={};
const clock=new THREE.Clock();
command.current=(id,action)=>{
if(!actors[id]){setStatus('Персонаж загружается');return}
if(id==='dog'&&action==='come'){goals.dog=new THREE.Vector3(-.55,0,1.8);play('dog','Run');setStatus('Тобик бежит к тебе!')}
else if(id==='dog'){play('dog','Headbutt');effects.dog={time:clock.elapsedTime,mode:action};setStatus('Тобик играет с тобой!')}
else if(id==='robot'){play('robot',action==='dance'?'Dance':'Wave');effects.robot={time:clock.elapsedTime,mode:action};setStatus(action==='dance'?'Миро танцует!':'Миро приветствует тебя!')}
else{effects.squirrel={time:clock.elapsedTime,mode:action};setStatus(action==='jump'?'Искорка прыгает!':'Искорка получила орех!')}
};
setLighting.current=v=>{scene.background=new THREE.Color(v?'#25395e':'#b4e7ee');hemi.intensity=v?1.3:2.6;sun.intensity=v?1.2:3.2};
let down:PointerEvent|null=null;
const onDown=(e:PointerEvent)=>{down=e};
const onUp=(e:PointerEvent)=>{
if(!down||Math.hypot(e.clientX-down.clientX,e.clientY-down.clientY)>10)return;
const b=renderer.domElement.getBoundingClientRect(),v=new THREE.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);
const ray=new THREE.Raycaster();ray.setFromCamera(v,camera);const objects=Object.values(actors).map(a=>a.root);
const hit=ray.intersectObjects(objects,true)[0];if(!hit)return;let node:THREE.Object3D|null=hit.object;while(node&&!node.userData.id)node=node.parent;if(node?.userData.id){setSelected(node.userData.id as Id);setStatus('Выбран '+labels[node.userData.id as Id])}
};
renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
const resize=()=>{if(!element.clientWidth||!element.clientHeight)return;camera.aspect=element.clientWidth/element.clientHeight;camera.updateProjectionMatrix();renderer.setSize(element.clientWidth,element.clientHeight,false)};
const observer=new ResizeObserver(resize);observer.observe(element);resize();
let frame=0;function animate(){if(dead)return;frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;mixers.forEach(m=>m.update(dt));
if(actors.robot)actors.robot.root.position.y=.19+Math.sin(t*2.0)*.13;
if(actors.squirrel){const e=effects.squirrel;actors.squirrel.root.position.y=e&&t-e.time<2?Math.abs(Math.sin((t-e.time)*5))*1.08:Math.sin(t*3)*.025;if(e&&t-e.time>=2)delete effects.squirrel}
const dog=actors.dog;if(dog){const goal=goals.dog;if(goal){const step=goal.clone().sub(dog.root.position);step.y=0;if(step.length()>.05){dog.root.position.addScaledVector(step.normalize(),dt*.95);dog.root.rotation.y=Math.atan2(step.x,step.z)}else{delete goals.dog;play('dog','Idle');setStatus('Тобик рядом!')}}}
for(const k of ['dog','robot'] as Id[]){const e=effects[k];if(e&&t-e.time>3.5){delete effects[k];play(k,'Idle')}}
renderer.render(scene,camera)}
animate();
return()=>{dead=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);mixers.forEach(m=>m.stopAllAction());renderer.dispose();renderer.domElement.remove()};
},[]);
return <div className="real-island"><div ref={host} className="real-island-stage"/><div className="real-island-top"><span>🌿 НАСТОЯЩИЙ 3D-МИР</span><button onClick={()=>{setNight(!night);setLighting.current(!night)}}>{night?'☀️':'🌙'}</button></div><div className="real-island-panel"><strong>{status}</strong><div className="real-island-buttons">{selected?(selected==='dog'?<><button onClick={()=>command.current('dog','come')}>🐕 Позвать Тобика</button><button onClick={()=>command.current('dog','play')}>🦴 Поиграть</button></>:selected==='robot'?<><button onClick={()=>command.current('robot','hello')}>👋 Привет</button><button onClick={()=>command.current('robot','dance')}>🎵 Танец</button></>:<><button onClick={()=>command.current('squirrel','nut')}>🌰 Орех</button><button onClick={()=>command.current('squirrel','jump')}>🌳 Прыжок</button></>):info.map(x=><button key={x.id} onClick={()=>setSelected(x.id)}>{x.id==='dog'?'🐕 Тобик':x.id==='robot'?'🤖 Миро':'🐿️ Искорка'}</button>)}</div><small>Загружено: {loaded}/3 персонажей · нажимай на модели</small></div></div>;
}
