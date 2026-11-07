type Tone='tap'|'switch'|'success'|'coin'|'build'|'notification'|'error'|'robot';
const STORAGE='moymir2-ui-audio-enabled';
let context:AudioContext|null=null;
let lastPlay=0;
export function isSoundEnabled():boolean{
 try{return localStorage.getItem(STORAGE)!=='false'}catch{return true}
}
export function setSoundEnabled(enabled:boolean):void{
 try{localStorage.setItem(STORAGE,String(enabled))}catch{}
}
function getAudio():AudioContext|null{
 try{
  if(!context)context=new AudioContext();
  if(context.state==='suspended')void context.resume().catch(()=>{});
  return context;
 }catch{return null}
}
function note(ctx:AudioContext,at:number,pitch:number,duration:number,volume:number,shape:OscillatorType='sine'){
 const oscillator=ctx.createOscillator();
 const gain=ctx.createGain();
 oscillator.type=shape;oscillator.frequency.setValueAtTime(pitch,at);
 gain.gain.setValueAtTime(.0001,at);
 gain.gain.exponentialRampToValueAtTime(volume,at+.008);
 gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
 oscillator.connect(gain);gain.connect(ctx.destination);
 oscillator.start(at);oscillator.stop(at+duration+.015);
}
export function playSound(type:Tone):void{
 if(!isSoundEnabled())return;
 const now=performance.now();
 if(type==='tap'&&now-lastPlay<75)return;
 lastPlay=now;
 const ctx=getAudio();if(!ctx)return;
 const t=ctx.currentTime+.008;
 if(type==='tap')note(ctx,t,720,.065,.038);
 if(type==='switch'){note(ctx,t,520,.07,.04);note(ctx,t+.07,770,.1,.035)}
 if(type==='success'){note(ctx,t,520,.12,.055);note(ctx,t+.13,690,.12,.055);note(ctx,t+.28,910,.26,.055)}
 if(type==='coin'){note(ctx,t,880,.09,.06);note(ctx,t+.075,1240,.21,.052)}
 if(type==='build'){note(ctx,t,260,.11,.038,'triangle');note(ctx,t+.1,390,.13,.046,'triangle');note(ctx,t+.22,590,.22,.05)}
 if(type==='notification'){note(ctx,t,650,.12,.042);note(ctx,t+.18,840,.18,.055)}
 if(type==='error'){note(ctx,t,310,.12,.042,'triangle');note(ctx,t+.14,240,.21,.035,'triangle')}
 if(type==='robot'){note(ctx,t,760,.08,.035,'sine');note(ctx,t+.1,1040,.16,.045,'sine')}
}
export function attachInterfaceSounds(){
 const handler=(event:PointerEvent)=>{
  const target=event.target;
  if(!(target instanceof Element))return;
  const control=target.closest('button,[role="button"],a');
  if(!(control instanceof HTMLElement)||control.hasAttribute('disabled'))return;
  const label=(control.textContent||control.getAttribute('aria-label')||'').toLowerCase();
  if(label.match(/одобри|подтверд|выполн|готово|сохранить|принять|добавить/))playSound('success');
  else if(label.match(/награ|монет|купить|получить|приз/))playSound('coin');
  else if(label.match(/миро|помощник|робот/))playSound('robot');
  else if(label.match(/дерево|мир|вкладк|назад/))playSound('switch');
  else playSound('tap');
 };
 document.addEventListener('pointerup',handler,{passive:true});
 return()=>document.removeEventListener('pointerup',handler);
}
