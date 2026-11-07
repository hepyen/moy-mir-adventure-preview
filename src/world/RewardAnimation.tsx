import './RewardAnimation.css'
import { sceneForReward } from './rewardScenes'
export function RewardAnimation({id,title}:{id:number;title:string}){
 const scene=sceneForReward(id,title)
 return <div className={'reward-scene reward-scene-'+scene} aria-label={'Анимация награды: '+title} role="img">
  {scene==='game'&&<><span className="reward-spark game-star-a">✦</span><div className="game-hands"><span>✋</span><div className="game-pad"><span>✚</span><b>● ●</b><span>🔴</span></div><span>🤚</span></div><span className="reward-spark game-star-b">✧</span></>}
  {scene==='movie'&&<><div className="movie-tv"><span>★　🎬　★</span></div><div className="movie-faces"><span>😄</span><span>🍿</span><span>😊</span></div></>}
  {scene==='mystery'&&<><div className="mystery-rays">✦　✧　✦</div><div className="mystery-box"><span>❔</span></div><div className="mystery-lid"/></>}
  {scene==='money'&&<><div className="money-fall">{Array.from({length:9},(_,i)=><span key={i} style={{left:(9+i*10)+'%',animationDelay:(i*.17)+'s'}}>{i%2?'🪙':'💶'}</span>)}</div><div className="money-bag">💰</div></>}
  {scene==='walk'&&<><div className="walk-sun">☀️</div><div className="walk-trees">🌳　🌲</div><div className="walk-feet">👣 👣 👣</div></>}
  {scene==='dessert'&&<><div className="reward-center-bounce">🧁</div><div className="reward-spark">✦　🍬　✦</div></>}
  {scene==='board'&&<><div className="reward-center-bounce">🎲</div><div className="reward-spark">♟　🎯　♟</div></>}
  {scene==='music'&&<><div className="reward-center-bounce">🎧</div><div className="reward-spark">♫　♪　♫</div></>}
  {scene==='family'&&<><div className="reward-center-bounce">👨‍👩‍👦</div><div className="reward-spark">💛　✨</div></>}
  {scene==='time'&&<><div className="reward-center-bounce">⏰</div><div className="reward-spark">✨　🎮　✨</div></>}
  {scene==='gift'&&<><div className="reward-center-bounce">🎁</div><div className="reward-spark">✦　✧　✦</div></>}
 </div>
}
