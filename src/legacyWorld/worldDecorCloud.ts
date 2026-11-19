import {supabase} from '../lib/supabase'
import {readDecorLayout,saveDecorLayout} from './worldDecor'
import type {DecorLayout} from './worldDecor'
const TABLE='moymir_world_decor_layouts'
const pendingKey=(key:string)=>key+':pending-sync'
const syncedKey=(key:string)=>key+':cloud-established'
export function markDecorSynced(key:string){try{localStorage.setItem(syncedKey(key),'yes')}catch{}}
const hasDecorSynced=(key:string)=>{try{return localStorage.getItem(syncedKey(key))==='yes'}catch{return false}}
export function markDecorPending(key:string){try{localStorage.setItem(pendingKey(key),'yes')}catch{}}
export function hasDecorPending(key:string){try{return localStorage.getItem(pendingKey(key))==='yes'}catch{return false}}
function clearPendingIfCurrent(key:string,sent:DecorLayout){try{if(JSON.stringify(readDecorLayout(key))===JSON.stringify(sent))localStorage.removeItem(pendingKey(key))}catch{}}
export function sanitizedCloudLayout(input:unknown):DecorLayout{
 if(!input||typeof input!=='object'||Array.isArray(input))return {}
 const safe:DecorLayout={}
 for(const id of ['flowerpot','lamp','bench','flowerbed','mailbox'] as const){
  const value=(input as Record<string,unknown>)[id]
  if(!value||typeof value!=='object'||Array.isArray(value))continue
  const item=value as {x?:unknown;z?:unknown;rotation?:unknown}
  if(typeof item.x!=='number'||typeof item.z!=='number'||!Number.isFinite(item.x)||!Number.isFinite(item.z)||Math.abs(item.x)>2.9||Math.abs(item.z)>2.3)continue
  const rotation=typeof item.rotation==='number'&&Number.isFinite(item.rotation)?Math.round(item.rotation/15)*15:0
  safe[id]={x:item.x,z:item.z,...(rotation?{rotation:((rotation%360)+360)%360}:{})}
 }
 return safe
}
export type DecorSyncScope={familyId:string;childId:string;world:1|2;userId:string;key:string}
export async function putDecorCloud(scope:DecorSyncScope,layout:DecorLayout):Promise<void>{
 if(!scope.familyId||!scope.childId||!scope.userId)throw Error('Семейная учётная запись не подключена')
 const {error}=await supabase.from(TABLE).upsert({family_id:scope.familyId,child_id:scope.childId,world_number:scope.world,layout,updated_by:scope.userId,updated_at:new Date().toISOString()},{onConflict:'family_id,child_id,world_number'})
 if(error)throw error
 clearPendingIfCurrent(scope.key,layout)
 markDecorSynced(scope.key)
}
export async function pullDecorCloud(scope:DecorSyncScope):Promise<{layout:DecorLayout;origin:'cloud'|'local'|'conflict';cloud?:DecorLayout}>{
 if(!scope.familyId||!scope.childId||!scope.userId)return {layout:readDecorLayout(scope.key),origin:'local'}
 const {data,error}=await supabase.from(TABLE).select('layout').eq('family_id',scope.familyId).eq('child_id',scope.childId).eq('world_number',scope.world).maybeSingle()
 if(error)throw error
 const local=readDecorLayout(scope.key)
 if(hasDecorPending(scope.key)||(!data&&Object.keys(local).length>0)){
  markDecorPending(scope.key)
  await putDecorCloud(scope,local)
  return {layout:local,origin:'local'}
 }
 const cloud=sanitizedCloudLayout(data?.layout)
 if(data){
  // Migrating two independent 3.8.17 local islands must not silently destroy either.
  if(Object.keys(local).length&&!hasDecorSynced(scope.key)&&JSON.stringify(sanitizedCloudLayout(local))!==JSON.stringify(cloud))return {layout:local,origin:'conflict',cloud}
  markDecorSynced(scope.key)
  return {layout:cloud,origin:'cloud'}
 }
 return {layout:local,origin:'local'}
}
export async function saveDecorWithCloud(scope:DecorSyncScope,layout:DecorLayout):Promise<boolean>{
 const localSaved=saveDecorLayout(scope.key,layout)
 markDecorPending(scope.key)
 if(scope.familyId&&scope.childId&&scope.userId)await putDecorCloud(scope,layout)
 else throw Error(localSaved?'Сохранено на телефоне; синхронизация появится после подключения семьи':'Не получилось сохранить на телефоне')
 return localSaved
}
