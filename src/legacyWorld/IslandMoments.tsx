import {useEffect,useMemo,useState} from 'react';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import {supabase} from '../lib/supabase';
import {dateInMadrid} from '../daily/library';
import './IslandMoments.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
type Memory={id:string;for_date:string;event_key:'dog'|'squirrel'|'robot';sticker:string};
type EventKey=Memory['event_key'];
const EVENTS:Record<EventKey,{title:string;story:string;target:string;tokens:string[];done:string;sticker:string}>={
 dog:{title:'Помоги пёсику найти мячики',story:'Пёсик играл у домика и потерял три синих мячика. Найди их среди предметов на полянке!',target:'🔵',tokens:['🍎','🔵','🍃','🌼','🔵','🪁','🔵','🍄','🌺'],done:'Пёсик радостно машет хвостом! Мячики нашлись.',sticker:'🐶'},
 squirrel:{title:'Белочка собирает орешки',story:'Перед наступлением вечера белочка хочет собрать три орешка. Помоги ей найти их среди листьев!',target:'🌰',tokens:['🍂','🌰','🍎','🌷','🌰','🪵','🍃','🌰','🍐'],done:'Белочка принесла припасы в домик на дереве!',sticker:'🐿️'},
 robot:{title:'Зажги огоньки для Миро',story:'У Миро разрядились три светящихся звезды. Помоги найти звёздочки, чтобы зарядить его!',target:'⭐',tokens:['💧','⭐','🌿','☁️','⭐','🐾','🍎','⭐','🌸'],done:'Миро снова сияет! Спасибо за помощь.',sticker:'🤖'}
};
const FAMILY_IDEAS=['Приготовить что-нибудь вместе','Провести прогулку всей семьёй','Сделать открытку или рисунок','Помочь дома без напоминания'];
export function IslandMoments({cloud,worldNumber}:{cloud:Cloud;worldNumber:number}){
 const day=dateInMadrid(),eventKey:EventKey=worldNumber===2?(Number(day.slice(-2))%2?'squirrel':'robot'):(Number(day.slice(-2))%3===0?'robot':'dog');
 const event=EVENTS[eventKey];
 const [memories,setMemories]=useState<Memory[]>([]),[found,setFound]=useState<number[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false),[idea,setIdea]=useState(FAMILY_IDEAS[0]);
 const isDone=memories.some(x=>x.for_date===day);
 const cards=useMemo(()=>event.tokens.map((token,index)=>({token,index})).sort((a,b)=>((a.index*7+Number(day.slice(-2)))%11)-((b.index*7+Number(day.slice(-2)))%11)),[eventKey,day]);
 useEffect(()=>{setFound([]);setError('')},[day,eventKey,cloud.session?.user.id]);
 useEffect(()=>{if(!supabase||!cloud.familyId||!cloud.childId)return;let alive=true;setLoaded(false);
  void supabase.from('moymir_island_memories').select('id,for_date,event_key,sticker').eq('family_id',cloud.familyId).eq('child_id',cloud.childId).order('for_date',{ascending:false}).limit(20).then(({data,error})=>{
    if(!alive)return;if(error)setError('Не удалось загрузить семейный альбом');else setMemories((data||[]) as Memory[]);setLoaded(true)
  });return()=>{alive=false}
 },[cloud.familyId,cloud.childId,cloud.session?.user.id]);
 async function complete(){if(busy||!cloud.familyId)return;setBusy(true);setError('');try{
   await cloud.rpc('moymir_collect_island_memory',{p_family:cloud.familyId,p_date:day,p_event:eventKey});
   setMemories(old=>old.some(x=>x.for_date===day)?old:[{id:'today',for_date:day,event_key:eventKey,sticker:event.sticker},...old]);
  }catch(e){setError(e instanceof Error?e.message:'Нет связи. Нажми «Сохранить значок» ещё раз позже.')}
  finally{setBusy(false)}
 }
 async function addFamilyIdea(){if(busy)return;setBusy(true);setError('');try{await cloud.rpc('create_family_task',{p_family:cloud.familyId,p_child:cloud.childId,p_title:idea,p_points:15})}catch(e){setError(e instanceof Error?e.message:'Не удалось добавить задание')}finally{setBusy(false)}}
 return <section className="mw-panel island-moments" aria-label="Приключение острова и семейный альбом">
  <div className="island-moments-head"><div><small>✨ ЖИВОЙ ОСТРОВ</small><h3>Приключение дня</h3></div><span className="island-moments-icon">{event.sticker}</span></div>
  {cloud.role==='child'?<>
   <h4>{event.title}</h4><p>{event.story}</p>
   {isDone?<div className="island-moments-prize" role="status">🎉 {event.done}<strong>Значок {event.sticker} добавлен в твой альбом</strong></div>:<>
    <p className="island-moments-instruction">Найди {event.target} · {found.length} из 3</p>
    <div className="island-moments-grid">{cards.map(({token,index})=><button key={index} aria-label={'Предмет острова '+(index+1)+': '+token} className={found.includes(index)?'found':''} disabled={found.includes(index)||found.length>=3} onClick={()=>{if(token===event.target)setFound(old=>[...old,index]);else setError('Почти! Посмотри внимательнее.')}}>{found.includes(index)?'✅':token}</button>)}</div>
    {found.length===3&&<><div className="island-moments-prize" role="status">🌟 {event.done}</div><button className="island-moments-finish" disabled={busy} onClick={()=>void complete()}>{busy?'Сохраняем…':'Сохранить памятный значок'}</button></>}
   </>}
   <small className="island-moments-note">Приключение даёт памятный значок, а не монеты. Награды за настоящие дела подтверждают родители.</small>
  </>:<><p>Ежедневные мини-приключения помогают Илье возвращаться на остров. Значки сохраняются в семейном альбоме, обычные баллы не начисляются.</p>
   <div className="island-idea"><strong>🏠 Семейное приключение</strong><label>Предложить задание<select value={idea} onChange={e=>setIdea(e.target.value)}>{FAMILY_IDEAS.map(x=><option key={x} value={x}>{x}</option>)}</select></label><button disabled={busy||cloud.tasks.some(x=>x.title===idea)} onClick={()=>void addFamilyIdea()}>{cloud.tasks.some(x=>x.title===idea)?'Уже добавлено':'Добавить в дела · 15 монет после одобрения'}</button></div>
  </>}
  {error&&<p role="alert" className="island-moments-error">{error}</p>}
  <details className="island-memories"><summary>📖 Семейный альбом · {memories.length} значков</summary>{!loaded?<p>Загружаем…</p>:memories.length===0?<p>Первые памятные значки появятся после приключения.</p>:<div className="island-memory-grid">{memories.map(x=><div key={x.id}><span>{x.sticker}</span><small>{x.for_date.split('-').reverse().join('.')}</small></div>)}</div>}</details>
 </section>;
}
