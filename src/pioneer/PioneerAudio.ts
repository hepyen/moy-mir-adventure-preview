import {useEffect,useRef} from 'react';
import ambientTrack from './pioneer_ambient.mp3';

type Cue='start'|'right'|'wrong'|'win'|'hint'|'select'|'tick'|'urgent'|'timeup'|'exit';
function tone(audio:AudioContext,freq:number,when:number,length:number,volume:number,wave:OscillatorType='sine'){
 const oscillator=audio.createOscillator(),gain=audio.createGain();
 oscillator.type=wave;oscillator.frequency.setValueAtTime(freq,when);
 gain.gain.setValueAtTime(0.0001,when);
 gain.gain.exponentialRampToValueAtTime(volume,when+.012);
 gain.gain.exponentialRampToValueAtTime(0.0001,when+length);
 oscillator.connect(gain);gain.connect(audio.destination);
 oscillator.start(when);oscillator.stop(when+length+.02);
}
export function usePioneerAudio(enabled:boolean,playing:boolean){
 const context=useRef<AudioContext|null>(null);
 const backing=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{
  const audio=new Audio(ambientTrack);
  audio.loop=true;audio.volume=.28;audio.preload='auto';backing.current=audio;
  return()=>{audio.pause();audio.removeAttribute('src');audio.load();backing.current=null;if(context.current)void context.current.close().catch(()=>{})};
 },[]);
 useEffect(()=>{
  const music=backing.current;if(!music)return;
  if(!enabled||!playing){music.pause();return}
  void music.play().catch(()=>{/* Native WebView may require first touch; start cue activates it */});
 },[enabled,playing]);
 return (kind:Cue)=>{
  if(!enabled)return;
  if(kind==='start'||kind==='select'){
   const music=backing.current;
   if(music&&music.paused)void music.play().catch(()=>{});
  }
  try{
   const AudioClass=window.AudioContext;if(!AudioClass)return;
   if(!context.current)context.current=new AudioClass();
   const a=context.current;void a.resume();
   const now=a.currentTime+.015;
   if(kind==='tick'){tone(a,370,now,.075,.035);return}
   if(kind==='urgent'){tone(a,680,now,.12,.088,'triangle');tone(a,850,now+.17,.08,.055);return}
   const sequence=kind==='wrong'?[292,247,196,146]:
     kind==='win'?[392,494,587,740,988,1175]:
     kind==='start'?[220,329.63,440,523.25]:
     kind==='hint'?[523.25,659.25,784]:
     kind==='timeup'?[698,523,392,262]:
     kind==='exit'?[392,294,196]:
     kind==='select'?[440]:[523.25,659.25,784];
   const duration=kind==='win'?.18:kind==='wrong'||kind==='timeup'?.18:.13;
   sequence.forEach((freq,i)=>tone(a,freq,now+i*(kind==='win'?.14:.11),duration,kind==='win'?.11:.075,kind==='wrong'||kind==='timeup'?'triangle':'sine'));
  }catch{/* sound unavailable */ }
 };
}
