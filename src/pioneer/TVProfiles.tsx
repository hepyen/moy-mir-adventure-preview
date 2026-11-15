import {useEffect,useRef,useState} from 'react';
import './TVProfiles.css';

export type TVRank={
 id:string;name:string;total:number;unlocked:number;wins:number;games:number;updatedAt:string;
};
type Props={
 players:TVRank[];
 legacyPending:boolean;
 onSelect:(id:string)=>void;
 onCreate:(name:string,attachOld:boolean)=>string|null;
 error:string;
};
const rankMedals=['🥇','🥈','🥉'];
function dateLabel(v:string){
 try{return new Date(v).toLocaleDateString('ru-RU',{day:'2-digit',month:'short'})}catch{return ''}
}
export function TVProfiles({players,legacyPending,onSelect,onCreate,error}:Props){
 const [newName,setNewName]=useState('');
 const [attachOld,setAttachOld]=useState(true);
 const [localError,setLocalError]=useState('');
 const first=useRef<HTMLButtonElement|null>(null);
 const field=useRef<HTMLInputElement|null>(null);
 const ranked=[...players].sort((a,b)=>b.total-a.total||b.wins-a.wins||a.name.localeCompare(b.name,'ru'));
 const recent=[...players].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
 const submit=()=>{
  setLocalError('');
  const name=newName.replace(/\s+/g,' ').trim();
  if(name.length<2||name.length>24){setLocalError('Напиши имя от 2 до 24 символов');return}
  if(players.some(p=>p.name.toLocaleLowerCase('ru')===name.toLocaleLowerCase('ru'))){
   setLocalError('Игрок с таким именем уже есть. Выбери его из списка.');return;
  }
  const issue=onCreate(name,attachOld&&legacyPending);
  if(issue)setLocalError(issue);
  else{setNewName('');setAttachOld(false)}
 };
 useEffect(()=>{
  const raf=requestAnimationFrame(()=>{
   if(first.current)first.current.focus({preventScroll:true});
   else if(field.current)field.current.focus({preventScroll:true});
  });return()=>cancelAnimationFrame(raf)
 },[]);
 useEffect(()=>{
  const move=(e:KeyboardEvent)=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   if(document.activeElement instanceof HTMLInputElement && document.activeElement.type==='text')return;
   const buttons=Array.from(document.querySelectorAll<HTMLElement>('.ptv-gate button:not(:disabled), .ptv-gate input'))
     .filter(el=>el.getClientRects().length>0);
   const selected=document.activeElement instanceof HTMLElement&&buttons.includes(document.activeElement)?document.activeElement:buttons[0];
   if(!selected)return;
   const rect=selected.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
   const direction=e.key.slice(5).toLowerCase();
   const next=buttons.filter(el=>el!==selected).map(el=>{
    const r=el.getBoundingClientRect(),dx=r.left+r.width/2-x,dy=r.top+r.height/2-y;
    const forward=direction==='right'?dx:direction==='left'?-dx:direction==='down'?dy:-dy;
    const cross=direction==='right'||direction==='left'?Math.abs(dy):Math.abs(dx);
    return{el,forward,score:forward+cross*1.65};
   }).filter(a=>a.forward>10).sort((a,b)=>a.score-b.score)[0];
   if(next){e.preventDefault();next.el.focus({preventScroll:true});next.el.scrollIntoView({block:'nearest'})}
  };
  window.addEventListener('keydown',move);return()=>window.removeEventListener('keydown',move);
 },[]);
 return <main className="ptv-gate" aria-label="Выбор игрока и таблица лидеров">
   <div className="ptv-gate-stars" aria-hidden="true"/>
   <div className="ptv-gate-content">
     <header className="ptv-gate-heading">
       <div className="ptv-trophy">✦</div>
       <div><div className="ptv-kicker">БИБЛЕЙСКАЯ ТЕЛЕВИКТОРИНА</div>
        <h1>Кто сегодня играет?</h1>
        <p>Выбери своё имя или добавь нового участника. У каждого свои вопросы, уровни и баллы.</p>
       </div>
     </header>
     <div className="ptv-columns">
       <section className="ptv-choice">
        <div className="ptv-section-title"><span>👤</span><h2>Выбрать игрока</h2><small>{players.length} {players.length===1?'участник':'участников'}</small></div>
        <div className="ptv-players" role="list">
         {recent.length===0?<p className="ptv-empty">Первый участник ещё не создан. Введи своё имя ниже.</p>:
          recent.map((person,i)=><button key={person.id} ref={i===0?first:undefined} onClick={()=>onSelect(person.id)} className="ptv-player" type="button" role="listitem">
           <span className="ptv-avatar">{person.name.slice(0,1).toUpperCase()}</span>
           <span className="ptv-player-name"><b>{person.name}</b><small>Уровень {person.unlocked} из 6 · {person.games} игр</small></span>
           <strong>{person.total} ✦</strong><span className="ptv-chevron">›</span>
          </button>)
         }
        </div>
        <form className="ptv-add" onSubmit={e=>{e.preventDefault();submit()}}>
          <label htmlFor="ptv-name">➕ Новый игрок</label>
          <div className="ptv-inputrow">
           <input ref={field} id="ptv-name" type="text" autoComplete="off" autoCapitalize="words" maxLength={24} placeholder="Напиши своё имя..." value={newName} onChange={e=>setNewName(e.target.value)}/>
           <button type="submit" disabled={!newName.trim()}>Создать и играть</button>
          </div>
          {legacyPending&&<label className="ptv-import">
            <input type="checkbox" checked={attachOld} onChange={e=>setAttachOld(e.target.checked)}/>
            <span>Передать этому игроку результаты прежней версии</span>
           </label>}
          {(localError||error)&&<p className="ptv-error" role="alert">{localError||error}</p>}
        </form>
       </section>
       <section className="ptv-scores">
        <div className="ptv-section-title"><span>🏆</span><h2>Таблица лидеров</h2></div>
        <div className="ptv-score-head"><span>Место / Игрок</span><span>Баллы</span></div>
        <div className="ptv-rank-list">
         {ranked.length===0?<p className="ptv-empty">Рейтинг появится после первой игры.</p>:
          ranked.map((player,i)=><div className={'ptv-rank '+(i<3?'ptv-top ':'')} key={player.id}>
           <span className="ptv-rank-position">{i<3?rankMedals[i]:String(i+1)+'.'}</span>
           <div className="ptv-rank-name"><b>{player.name}</b><small>{player.wins} побед · {player.games} игр · {dateLabel(player.updatedAt)}</small></div>
           <strong>{player.total} <small>баллов</small></strong>
          </div>)
         }
        </div>
        <div className="ptv-score-footer">Рейтинг по заработанным баллам. Максимум 300 баллов на человека.</div>
       </section>
     </div>
     <footer className="ptv-footer">Все результаты сохраняются в памяти этого телевизора. Для каждого игрока вопросы и достижения ведутся отдельно.</footer>
   </div>
 </main>;
}
