import {useEffect,useState} from 'react';
import type {useFamilyCloud} from '../../lib/useFamilyCloud';
import {supabase} from '../../lib/supabase';
import {dateInMadrid} from '../../daily/library';
import './GrowthFocus.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
const QUALITIES={
 kindness:{icon:'💚',name:'Доброта',action:'Сегодня попробую сказать кому-то доброе слово или помочь без просьбы.'},
 patience:{icon:'🌿',name:'Терпение',action:'Если что-то не получится, сначала успокоюсь и попробую ещё раз.'},
 courage:{icon:'🦁',name:'Смелость',action:'Постараюсь спокойно сделать правильное дело, даже если немного страшно.'},
 gratitude:{icon:'🌤️',name:'Благодарность',action:'Подумаю, за что я благодарен сегодня, и скажу спасибо.'}
} as const;
type Quality=keyof typeof QUALITIES;
function startOfWeek(iso:string){const d=new Date(iso+'T12:00:00Z');const day=d.getUTCDay();d.setUTCDate(d.getUTCDate()-(day===0?6:day-1));return d.toISOString().slice(0,10)}
export function GrowthFocus({cloud}:{cloud:Cloud}){
 const week=startOfWeek(dateInMadrid()),[quality,setQuality]=useState<Quality>('kindness'),[note,setNote]=useState(''),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!supabase||!cloud.familyId||!cloud.childId)return;let active=true;setSaved(false);
  void supabase.from('moymir_growth_focus').select('quality,note').eq('family_id',cloud.familyId).eq('child_id',cloud.childId).eq('week_start',week).maybeSingle().then(({data,error})=>{
    if(!active)return;if(error){setError('Не удалось загрузить тему недели');return}if(data&&data.quality in QUALITIES){setQuality(data.quality as Quality);setNote(data.note||'');setSaved(true)}
  });return()=>{active=false}
 },[cloud.familyId,cloud.childId,cloud.session?.user.id,week]);
 async function save(){if(busy||cloud.role!=='child'||!supabase)return;setBusy(true);setError('');
  const {error}=await supabase.from('moymir_growth_focus').upsert({family_id:cloud.familyId,child_id:cloud.childId,week_start:week,quality,note:note.trim(),updated_at:new Date().toISOString()},{onConflict:'child_id,week_start'});
  if(error)setError(error.message);else setSaved(true);setBusy(false)
 }
 return <section className="mw-panel growth-focus" aria-label="Качество недели"><div className="growth-head"><h3>🌻 Качество недели</h3><span>{saved?'✓':'🌱'}</span></div>
  <p>Выбери, над каким хорошим качеством хочешь работать. Это личная цель, без экзаменов и штрафных баллов.</p>
  <div className="growth-options">{(Object.entries(QUALITIES) as [Quality,(typeof QUALITIES)[Quality]][]).map(([id,info])=><button key={id} disabled={cloud.role!=='child'} className={quality===id?'chosen':''} type="button" onClick={()=>{setQuality(id);setSaved(false)}}>{info.icon}<small>{info.name}</small></button>)}</div>
  <div className="growth-suggestion"><strong>💡 Одна идея на сегодня</strong><p>{QUALITIES[quality].action}</p></div>
  {cloud.role==='child'&&<><label className="growth-note">Моя маленькая цель на эту неделю (необязательно)<textarea maxLength={200} rows={2} placeholder="Например, стараться не перебивать других" value={note} onChange={e=>{setNote(e.target.value);setSaved(false)}}/></label><button className="growth-save" disabled={busy||saved} onClick={()=>void save()}>{busy?'Сохраняю…':saved?'✓ Сохранено на неделю':'Сохранить мой выбор'}</button></>}
  {error&&<p className="school-error" role="alert">{error}</p>}
 </section>;
}
