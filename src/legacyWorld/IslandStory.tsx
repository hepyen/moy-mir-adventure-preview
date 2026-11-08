import {useEffect,useState} from 'react';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import type {useIslandStory} from './useIslandStory';
import {dateInMadrid} from '../daily/library';
import './IslandStory.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
type Story=ReturnType<typeof useIslandStory>;
const EPISODES=[
 {title:'Корзинка для белочки',text:'Белочка собирается строить уютный домик. Прежде нужно собрать орешки. Какой предмет поможет ей аккуратно их перенести?',answer:'🧺 Корзинка',choices:['🪨 Камень','🧺 Корзинка','🌧️ Дождь'],finish:'Белочка принесла первую корзинку припасов.'},
 {title:'Дорожка через ручей',text:'После дождя на дорожке появилась лужа. Белочка хочет добраться до места строительства. Что положить на мокрую землю?',answer:'🪵 Доска',choices:['🪵 Доска','☁️ Облако','🎈 Шарик'],finish:'Теперь по тропинке можно пройти сухими лапками.'},
 {title:'Крыша над головой',text:'Вечером подул ветер. Белочке нужна крыша, которая укроет её от дождя. Какие материалы пригодятся?',answer:'🍂 Листья и веточки',choices:['🍭 Конфеты','🍂 Листья и веточки','🫧 Пузыри'],finish:'Небольшая крыша готова!' },
 {title:'Мягкое гнёздышко',text:'Ночью бывает прохладно. Чем белочке лучше застелить уголок, чтобы спать было уютно?',answer:'🌿 Сухой мох',choices:['🧊 Лёд','🌿 Сухой мох','🪨 Камни'],finish:'Внутри стало тепло и мягко.'},
 {title:'Свет возле домика',text:'Вечером нужно заметить дорожку к домику. Что поможет осветить вход?',answer:'🏮 Фонарик',choices:['🪵 Бревно','🏮 Фонарик','🍄 Гриб'],finish:'Добрый огонёк освещает тропинку.'},
 {title:'Гости приходят в дом',text:'Собака и Миро пришли поздравить белочку с завершением строительства. Что поставить, чтобы всем было удобно сидеть вместе?',answer:'🪑 Лавочка',choices:['🌧️ Лужа','🪑 Лавочка','⚽ Мяч'],finish:'Возле домика появилась скамейка для друзей.'},
 {title:'Дом дружбы',text:'Теперь домик готов. Белочка хочет угостить друзей тем, что собрала сама. Что она принесёт?',answer:'🌰 Орешки',choices:['🌰 Орешки','🪨 Камешки','🎨 Краски'],finish:'Все семь глав завершены! На острове появилась память о дружбе.'}
] as const;
const weekIndex=()=>((new Date(dateInMadrid()+'T12:00:00Z').getUTCDay()+6)%7)+1;
export function IslandStory({cloud,story}:{cloud:Cloud;story:Story}){
 const [selected,setSelected]=useState(1),[choice,setChoice]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const release=weekIndex(),completed=story.chapters.length,next=completed+1;
 const unlocked=Math.min(7,release);
 useEffect(()=>{setSelected(Math.min(next,7));setChoice('');setError('')},[story.week,next,cloud.session?.user.id]);
 const episode=EPISODES[selected-1];const done=story.chapters.includes(selected),canFinish=cloud.role==='child'&&selected===next&&selected<=unlocked&&choice===episode.answer;
 const currentDate=story.week.split('-').reverse().join('.');
 async function finish(){if(!canFinish||busy)return;setBusy(true);setError('');setMessage('');try{
  await cloud.rpc('moymir_complete_story_chapter',{p_family:cloud.familyId,p_week:story.week,p_chapter:selected});
  await story.refresh();setChoice('');setMessage(`✅ ${episode.finish}`)
 }catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить главу')}finally{setBusy(false)}}
 return <section className="mw-panel island-story" aria-label="История белочки на семь дней">
  <div className="island-story-head"><div><small>📖 НОВАЯ ИСТОРИЯ КАЖДУЮ НЕДЕЛЮ</small><h3>Домик для белочки</h3><span>Неделя с {currentDate} · {completed}/7 глав</span></div><span className="island-story-emoji">🐿️</span></div>
  <div className="island-story-track"><span style={{width:`${completed/7*100}%`}}/></div>
  <div className="island-story-days" role="group" aria-label="Выбери главу истории">{EPISODES.map((_,i)=><button key={i} disabled={i+1>unlocked} className={(selected===i+1?'chosen ':'')+(story.chapters.includes(i+1)?'done':'')} onClick={()=>{setSelected(i+1);setChoice('');setError('');setMessage('')}}>{story.chapters.includes(i+1)?'✓':i+1}</button>)}</div>
  <article className="island-story-chapter"><small>ГЛАВА {selected} ИЗ 7 {done?'· ПРОЙДЕНО':selected>next?'· ЗАВТРА ИЛИ ПОЗЖЕ':''}</small><h4>{episode.title}</h4><p>{episode.text}</p>
   {cloud.role==='child'&&!done&&selected===next&&selected<=unlocked&&<><div className="island-story-choices">{episode.choices.map(c=><button type="button" key={c} className={choice===c?'chosen':''} onClick={()=>{setChoice(c);setMessage(c===episode.answer?'Верно! Теперь можно завершить главу.':'Это не совсем то. Попробуй другой предмет.')}}>{c}</button>)}</div><button className="island-story-finish" disabled={!canFinish||busy} onClick={()=>void finish()}>{busy?'Сохраняем…':'Продолжить историю'}</button></>}
   {done&&<div className="island-story-message">🌿 {episode.finish}</div>}
   {selected>next&&<p className="island-story-note">Сначала пройди предыдущую главу. Пропущенное можно наверстать без штрафов.</p>}
   {cloud.role==='parent'&&<p className="island-story-note">Илья проходит главы в своём аккаунте. Здесь виден прогресс.</p>}
   {message&&<p className="island-story-message" role="status">{message}</p>}
   {error&&<p className="island-story-error" role="alert">{error}</p>}
  </article>
  <p className="island-story-note">Каждая завершённая глава сохраняется в семье. Объекты на 3D-острове открываются постепенно, по общему числу завершённых глав. Денежных или духовных баллов за мини-игру нет.</p>
  {story.error&&<p className="island-story-error">{story.error}</p>}
 </section>
}
