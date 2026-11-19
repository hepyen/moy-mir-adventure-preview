import {miroRoute} from './miroRoute'

export type DecorId='flowerpot'|'lamp'|'bench'|'flowerbed'|'mailbox'
export type DecorPosition={x:number;z:number}
export type DecorLayout=Partial<Record<DecorId,DecorPosition>>
export type DecorSpec={id:DecorId;title:string;unlock:number;radius:number;default:DecorPosition}
export const DECOR_SPECS:Record<1|2,DecorSpec[]>={
 1:[
  {id:'flowerpot',title:'🪴 Горшок с цветами',unlock:80,radius:.25,default:{x:.9,z:-1.45}},
  {id:'lamp',title:'🏮 Фонарь',unlock:900,radius:.19,default:{x:-1.2,z:.3}},
  {id:'bench',title:'🪑 Скамейка',unlock:1100,radius:.43,default:{x:-1.4,z:1.1}},
  {id:'flowerbed',title:'🌼 Клумба',unlock:1200,radius:.43,default:{x:2.18,z:-.87}},
  {id:'mailbox',title:'📮 Почтовый ящик',unlock:1300,radius:.24,default:{x:-.9,z:-1.25}}
 ],
 2:[
  {id:'flowerpot',title:'🪴 Горшок с цветами',unlock:480,radius:.25,default:{x:1.6,z:.75}},
  {id:'lamp',title:'🏮 Фонарь',unlock:900,radius:.19,default:{x:-1.85,z:-.8}},
  {id:'bench',title:'🪑 Скамейка',unlock:1200,radius:.43,default:{x:-1.4,z:.7}}
 ]
}
export const specFor=(world:1|2,id:DecorId)=>DECOR_SPECS[world].find(s=>s.id===id)
export const decorPosition=(world:1|2,layout:DecorLayout,id:DecorId):DecorPosition=>layout[id]??specFor(world,id)?.default??{x:0,z:0}
export const layoutStorageKey=(childId:string,world:1|2)=>`moymir-world-decor-v1:${encodeURIComponent(childId)}:w${world}`
export function readDecorLayout(storageKey:string):DecorLayout{
 try{
  const parsed=JSON.parse(localStorage.getItem(storageKey)||'{}') as Record<string,unknown>
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {}
  const output:DecorLayout={}
  for(const id of ['flowerpot','lamp','bench','flowerbed','mailbox'] as DecorId[]){
   const position=parsed[id]
   if(!position||typeof position!=='object')continue
   const {x,z}=position as {x:unknown;z:unknown}
   if(typeof x==='number'&&Number.isFinite(x)&&typeof z==='number'&&Number.isFinite(z)&&Math.abs(x)<=2.9&&Math.abs(z)<=2.3)output[id]={x,z}
  }
  return output
 }catch{return {}}
}
export function saveDecorLayout(storageKey:string,layout:DecorLayout):boolean{
 try{localStorage.setItem(storageKey,JSON.stringify(layout));return true}catch{return false}
}
function distToSegment(px:number,pz:number,ax:number,az:number,bx:number,bz:number){
 const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1)))
 return Math.hypot(px-(ax+dx*t),pz-(az+dz*t))
}
/** Validate prospective locations; never touch account balance or unlock records. */
export function validateDecorSpot(world:1|2,points:number,layout:DecorLayout,id:DecorId,x:number,z:number):string|null{
 const spec=specFor(world,id)
 if(!spec||points<spec.unlock)return 'Предмет ещё не открыт.'
 if(!Number.isFinite(x)||!Number.isFinite(z))return 'Не удалось определить место.'
 const r=spec.radius
 if(Math.abs(x)+r>2.63||Math.abs(z)+r>1.93)return 'Слишком близко к краю острова.'
 if(world===1){
  if(points>=360&&Math.abs(x-.65)<1.04+r&&Math.abs(z+.12)<.98+r)return 'Домик должен остаться свободным.'
  if(points>=200&&Math.hypot(x+1.35,z+.54)<.46+r)return 'Нельзя ставить предмет внутри дерева.'
  if(points>=1450&&Math.hypot(x-1.6,z-1.35)<.71+r)return 'Не закрывай пруд.'
  if(points>=1400&&Math.abs(x+2.05)<.56+r&&Math.abs(z+1.48)<.34+r)return 'Здесь растёт огород.'
 }else{
  if(Math.hypot(x+.12,z+.25)<.70+r)return 'Не загромождай ствол дерева.'
  // The treehouse platform is elevated; do not exclude all the lawn below it.
  if(points>=650&&Math.abs(x-.35)<.55+r&&z>.6&&z<1.4+r)return 'Здесь начинается лестница к домику.'
 }
 const route=miroRoute(world)
 for(let i=1;i<route.length;i++){
  if(distToSegment(x,z,route[i-1].x,route[i-1].z,route[i].x,route[i].z)<r+.24)return 'Оставь проход по острову свободным.'
 }
 for(const other of DECOR_SPECS[world]){
  if(other.id===id||points<other.unlock)continue
  const at=decorPosition(world,layout,other.id)
  if(Math.hypot(x-at.x,z-at.z)<r+other.radius+.14)return 'Слишком близко к другому украшению.'
 }
 return null
}
