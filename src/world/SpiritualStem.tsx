import './SpiritualStem.css'
/** Visualises personal participation, not a measure of faith. */
export function SpiritualStem({points}:{points:number}){
 const grown=Math.min(1,Math.max(.28,points/1000))
 const leaves=Math.min(8,2+Math.floor(points/165))
 const grains=Math.min(9,Math.floor(Math.max(0,points-260)/82))
 return <div className="stem-terrarium" role="img" aria-label={'Растущий колос: '+points+' очков на текущем этапе'}>
  <div className="stem-sun" aria-hidden="true">✦</div>
  <div className="stem-stars" aria-hidden="true">✧　✦　✧</div>
  <svg className="stem-art" viewBox="0 0 300 280" aria-hidden="true">
   <defs>
    <linearGradient id="stemGold" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff5ad"/><stop offset=".6" stopColor="#f4c75b"/><stop offset="1" stopColor="#d59437"/></linearGradient>
    <linearGradient id="stemLeaf" x1="0" x2=".9" y1="0" y2="1"><stop stopColor="#9af0a1"/><stop offset="1" stopColor="#287d4f"/></linearGradient>
    <linearGradient id="stemTrunk" x1="0" x2="1"><stop stopColor="#327c4d"/><stop offset=".5" stopColor="#91cf71"/><stop offset="1" stopColor="#28734a"/></linearGradient>
    <clipPath id="stemReveal" clipPathUnits="userSpaceOnUse">
     <rect className="stem-reveal" x="42" y={253-236*grown} width="214" height={236*grown+4}/>
    </clipPath>
   </defs>
   <ellipse cx="150" cy="256" rx="104" ry="15" fill="#103c35" opacity=".4"/>
   <ellipse cx="150" cy="249" rx="91" ry="14" fill="#70b06e"/>
   <g className="stem-sway">
    <g className="stem-growth" clipPath="url(#stemReveal)">
     <path d="M151 250 C135 205 171 155 149 71" fill="none" stroke="#194c39" strokeWidth="12" strokeLinecap="round"/>
     <path d="M151 250 C135 205 171 155 149 71" fill="none" stroke="url(#stemTrunk)" strokeWidth="7" strokeLinecap="round"/>
     {Array.from({length:8},(_,i)=>{
      const y=224-i*17,side=i%2?1:-1,x=150+(i%3-1)*2
      return <g key={i} className={'stem-leaf '+(i<leaves?'stem-open':'stem-closed')} style={{animationDelay:(i*.12)+'s'}}>
       <path d={`M${x} ${y} Q${x+side*37} ${y-47} ${x+side*62} ${y-20} Q${x+side*41} ${y+3} ${x} ${y}`} fill="url(#stemLeaf)" stroke="#2d8654" strokeWidth="2"/>
       <path d={`M${x} ${y} Q${x+side*25} ${y-25} ${x+side*57} ${y-19}`} stroke="#c6f2a1" strokeWidth="1.8" fill="none"/>
      </g>
     })}
     <g className={'stem-ear '+(grains>0?'stem-ear-open':'stem-ear-closed')}>
      {Array.from({length:9},(_,i)=>{
       const y=139-i*10,dx=12+(i%2)*3
       return <g key={i} className={'stem-grain '+(i<grains?'stem-open':'stem-closed')} style={{animationDelay:(i*.1)+'s'}}>
        <ellipse cx={150-dx} cy={y} rx="10" ry="17" transform={`rotate(-35 ${150-dx} ${y})`} fill="url(#stemGold)"/>
        <ellipse cx={150+dx} cy={y} rx="10" ry="17" transform={`rotate(35 ${150+dx} ${y})`} fill="url(#stemGold)"/>
       </g>
      })}
      {grains>=8&&<ellipse cx="150" cy="48" rx="11" ry="25" fill="url(#stemGold)"/>}
     </g>
    </g>
   </g>
   <g fill="#d7f8a4" opacity=".86"><circle cx="68" cy="75" r="2.8"/><circle cx="248" cy="91" r="2.6"/><circle cx="221" cy="176" r="2.1"/><circle cx="72" cy="198" r="1.9"/></g>
  </svg>
  <div className="stem-caption">{points===0?'Каждый шаг начинается с малого':'Растёт вместе с твоими отметками'}</div>
 </div>
}
