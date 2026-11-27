import {useEffect,useRef,useState} from 'react'
import {ADVENTURES,EMPTY_ADVENTURE,normalizeAdventure,collectTreasure,craftTreasure,adventureInventory,adventureKey} from './adventureGame'
import type {AdventureState,WorldId,V} from './adventureGame'
import {playSound} from '../features/sounds'
import './AdventureHub.css'
export type AdventureView={state:AdventureState;active:boolean;focus:{id:string;position:V;serial:number}|null;collect:(id:string)=>void;world:WorldId;points:number}
export function useAdventureGame(family:string,child:string,role:string|null|undefined,world:WorldId,points:number){
 const key=adventureKey(family,child)
 const read=()=>{try{return family&&child?normalizeAdventure(JSON.parse(localStorage.getItem(key)||'null')):EMPTY_ADVENTURE}catch{return EMPTY_ADVENTURE}}
 const [record,setRecord]=useState(()=>({key,state:read()})),[focus,setFocus]=useState<AdventureView['focus']>(null),[notice,setNotice]=useState('')
 const state=record.key===key?record.state:read()
 const stateRef=useRef(state)
 useEffect(()=>{stateRef.current=state},[state])
 useEffect(()=>{const next=read();stateRef.current=next;setRecord({key,state:next});setFocus(null);setNotice('')},[key])
 useEffect(()=>{setFocus(null);setNotice('')},[world])
 const active=!!family&&!!child&&role==='child'
 function commit(next:AdventureState){if(next===stateRef.current)return false;try{localStorage.setItem(key,JSON.stringify(next))}catch{setNotice('Не удалось сохранить находку. Освободи место на устройстве.');return false}stateRef.current=next;setRecord({key,state:next});return true}
 function collect(id:string){if(!active)return;const next=collectTreasure(stateRef.current,world,points,id);if(commit(next)){setFocus(null);setNotice('✨ Находка в рюкзаке!');playSound('coin')}}
 function craft(id:string){if(!active)return;const next=craftTreasure(stateRef.current,world,points,id);if(commit(next)){setNotice('🎉 Предмет создан и появился в твоём мире!');playSound('build')}}
 function inspect(id:string,position:V){if(active)setFocus({id,position,serial:Date.now()})}
 return {view:{state,active,focus,collect,world,points} as AdventureView,craft,inspect,notice,clearNotice:()=>setNotice('')}
}
export function AdventureHub({game}:{game:ReturnType<typeof useAdventureGame>}){
 const {view,inspect,craft,notice,clearNotice}=game
 const [tab,setTab]=useState<'missions'|'inventory'|'workshop'>('missions')
 const missions=ADVENTURES[view.world],items=adventureInventory(view.state,view.world)
 const completed=missions.filter(m=>view.state.crafted.includes(m.recipe.id)).length
 return <section className="mw-panel adventure-hub" aria-label="Игровые приключения">
  <header><div><small>ЭКСПЕДИЦИЯ · {completed}/{missions.length}</small><h3>🧭 Приключения</h3><p>Найди материалы, собери предметы и укрась свой мир.</p></div><span className="adventure-compass">✦</span></header>
  <div className="adventure-tabs" role="group" aria-label="Разделы приключений">{(['missions','inventory','workshop'] as const).map((v,i)=><button key={v} aria-pressed={tab===v} onClick={()=>setTab(v)}>{['🗺 Миссии','🎒 Рюкзак','🛠 Мастерская'][i]}</button>)}</div>
  {tab==='missions'&&missions.map(m=>{const found=m.treasures.filter(t=>view.state.found.includes(t.id)).length;const done=view.state.crafted.includes(m.recipe.id);return <article className="adventure-mission" key={m.id}><h4>{done?'🏅 ':''}{m.title}</h4><p>{m.story}</p><div className="adventure-progress"><span style={{width:found/3*100+'%'}}/></div><small>Найдено {found}/3 {done?'· Миссия завершена':found===3?'· Можно создать предмет':''}</small>{m.treasures.map(t=>{const got=view.state.found.includes(t.id),locked=view.points<t.at;return <div className="adventure-clue" key={t.id}><span>{got?'✅':locked?'🔒':'❔'}</span><div><strong>{got?t.title:locked?'Закрытая находка':'Подсказка'}</strong><small>{got?'В коллекции':locked?'Откроется при '+t.at+' очках этапа':t.clue}</small></div>{!got&&!locked&&view.active&&<button onClick={()=>inspect(t.id,t.position)}>Осмотреть место</button>}</div>})}{found===3&&!done&&<button onClick={()=>setTab('workshop')}>В мастерскую →</button>}</article>})}
  {tab==='inventory'&&<><h4>Материалы · {items.length}</h4>{items.length?<div className="adventure-items">{items.map(t=><div key={t.id}><span>{t.emoji}</span><strong>{t.title}</strong><small>1 шт.</small></div>)}</div>:<p>В рюкзаке пока нет свободных материалов. Найди их в 3D-мире.</p>}<h4>Коллекция готовых предметов</h4><div className="adventure-items">{missions.filter(m=>view.state.crafted.includes(m.recipe.id)).map(m=><div key={m.id}><span>{m.recipe.emoji}</span><strong>{m.recipe.title}</strong><small>Установлен в мире</small></div>)}</div></>}
  {tab==='workshop'&&missions.map(m=>{const ready=m.treasures.every(t=>view.state.found.includes(t.id)&&view.points>=t.at),done=view.state.crafted.includes(m.recipe.id);return <article className="adventure-mission" key={m.id}><h4>{m.recipe.emoji} {m.recipe.title}</h4><p>{done?'Предмет уже стоит в твоём мире.':'Рецепт: три найденных материала.'}</p>{!done&&<div className="adventure-ingredients">{m.treasures.map(t=><span key={t.id}>{view.state.found.includes(t.id)?t.emoji+' '+t.title:'🔒 Материал'}</span>)}</div>}<button disabled={done||!ready||!view.active} onClick={()=>craft(m.recipe.id)}>{done?'✓ Создано':ready?'Создать предмет':'Нужны материалы'}</button></article>})}
  {notice&&<p className="adventure-notice" role="status">{notice}<button onClick={clearNotice} aria-label="Закрыть сообщение">×</button></p>}
  {!view.active&&<p>Приключения проходит ребёнок. Здесь показан сохранённый на этом устройстве прогресс.</p>}
  <small className="adventure-foot">Игровые материалы и украшения не дают монет, реальных наград или очков развития. Прогресс приключений пока хранится на этом устройстве.</small>
 </section>
}
