let ctx:AudioContext|null=null;let drones:OscillatorNode[]=[];let gains:GainNode[]=[];let active=false;
const KEY='moymir28-bg-music';
export function musicEnabled(){try{return localStorage.getItem(KEY)==='true'}catch{return false}}
export function startMusic(){
 if(active)return;
 try{
  ctx=new AudioContext();
  const notes=[196,246.94,293.66,392];
  for(const [i,n] of notes.entries()){
   const oscillator=ctx.createOscillator(),gain=ctx.createGain();
   oscillator.type='sine';oscillator.frequency.value=n;
   gain.gain.value=0.0015;
   oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();drones.push(oscillator);gains.push(gain);
   gain.gain.setTargetAtTime((i%2?0.004:0.005),ctx.currentTime,4);
  }
  active=true;
 }catch{stopMusic()}
}
export function stopMusic(){for(const o of drones){try{o.stop();o.disconnect()}catch{}}for(const g of gains)try{g.disconnect()}catch{}drones=[];gains=[];active=false;const old=ctx;ctx=null;if(old)void old.close().catch(()=>{});}
export function setMusicEnabled(value:boolean){try{localStorage.setItem(KEY,String(value))}catch{}if(value)startMusic();else stopMusic()}
