import './WorldCelebration.css'

export function WorldCelebration({onNext,onClose,preview=false}:{onNext:()=>void;onClose:()=>void;preview?:boolean}){
 return <div className="world-victory-backdrop" role="dialog" aria-modal="true" aria-label="Поздравление с завершением первого мира">
  <div className="world-victory-stage">
   <div className="world-victory-sky" aria-hidden="true">
    {[[17,20],[81,24],[24,65],[77,70]].map(([x,y],j)=><div key={j} className="victory-firework" style={{left:x+'%',top:y+'%',animationDelay:j*.42+'s'}}>
      {Array.from({length:12},(_,i)=><i key={i} style={{'--angle':(i*30)+'deg','--hue':(j*70+i*19)+'deg'} as React.CSSProperties}/>)}
    </div>)}
    {Array.from({length:29},(_,i)=><span className="victory-confetti" key={i} style={{left:(i*37%100)+'%',animationDelay:(i%9)*.2+'s','--turn':(i*47)+'deg'} as React.CSSProperties}>{['✦','★','●','✿'][i%4]}</span>)}
   </div>
   <div className="victory-miro" aria-hidden="true">
    <svg viewBox="0 0 160 185">
     <defs><linearGradient id="victoryBot" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#8ec7ef"/></linearGradient></defs>
     <ellipse cx="80" cy="164" rx="44" ry="11" fill="#88edf2" opacity=".4"/>
     <path d="M48 87Q32 126 58 154Q80 170 102 154Q128 126 112 87Z" fill="url(#victoryBot)" stroke="#d7f4ff" strokeWidth="3"/>
     <ellipse cx="28" cy="110" rx="14" ry="23" fill="#c7e5f4" transform="rotate(-29 28 110)"/>
     <ellipse cx="132" cy="110" rx="14" ry="23" fill="#c7e5f4" transform="rotate(29 132 110)"/>
     <rect x="19" y="20" width="122" height="85" rx="43" fill="url(#victoryBot)" stroke="#d8f8ff" strokeWidth="3"/>
     <rect x="30" y="36" width="100" height="58" rx="29" fill="#123957"/>
     <path d="M46 66Q58 48 69 66 M92 66Q103 48 115 66" fill="none" stroke="#5cf4ea" strokeWidth="6" strokeLinecap="round"/>
     <path d="M67 77Q80 88 94 77" fill="none" stroke="#6cf4eb" strokeWidth="4" strokeLinecap="round"/>
     <ellipse cx="80" cy="132" rx="12" ry="6" fill="#79d5f8"/>
    </svg>
    <span className="victory-miro-stars">✦ ✨ ✦</span>
   </div>
   <div className="victory-content">
    <p className="victory-kicker">🎉 Ура! Первый мир завершён!</p>
    <h2>Поздравляю!</h2>
    <p>Ты построил <strong>«Домик на поляне»</strong>!</p>
    <p className="victory-robot-quote">«Привет! Это Миро. Ты достиг первого этапа! Впереди нас ждёт новый мир. Полетели?»</p>
    {preview&&<small className="victory-preview-label">Это пробный показ праздника. Прогресс не меняется.</small>}
    <button className="victory-next" onClick={onNext}>🌳 Перейти к следующему миру</button>
    <button className="victory-later" onClick={onClose}>Остаться и посмотреть поляну</button>
   </div>
  </div>
 </div>
}
