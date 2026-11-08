/** Three original instrumental arrangements; no continuous oscillator drones. */
export type MusicScene='meadow'|'treehouse'|'reading';
export type MusicPreference='auto'|MusicScene;
const ENABLED_KEY='moymir28-bg-music';
const VOLUME_KEY='moymir30-music-volume';
const TRACK_KEY='moymir30-music-theme';
const available:MusicScene[]=['meadow','treehouse','reading'];
let audio:HTMLAudioElement|null=null;
let currentTrack:MusicScene|null=null;
let currentScene:MusicScene='meadow';
let ducked=false;
let activated=false;
let playing=false;
let fadeFrame:number|null=null;
function safeRead(key:string){try{return localStorage.getItem(key)}catch{return null}}
function safeWrite(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}
export function musicEnabled(){return safeRead(ENABLED_KEY)==='true'}
export function musicVolume(){const n=Number(safeRead(VOLUME_KEY)??'0.38');return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0.38}
export function musicPreference():MusicPreference{const value=safeRead(TRACK_KEY)||'auto';return value==='auto'||available.includes(value as MusicScene)?value as MusicPreference:'auto'}
export function musicIsPlaying(){return playing&&!!audio&&!audio.paused}
function target(){return Math.min(1,musicVolume()*(ducked?.17:1))}
function resolvedTrack(){const pref=musicPreference();return pref==='auto'?currentScene:pref}
function fadeTo(node:HTMLAudioElement,volume:number,duration:number){
 if(fadeFrame!==null){cancelAnimationFrame(fadeFrame);fadeFrame=null}
 const start=performance.now(),from=node.volume,to=Math.max(0,Math.min(1,volume));
 const step=(now:number)=>{const t=Math.max(0,Math.min(1,(now-start)/duration));node.volume=Math.max(0,Math.min(1,from+(to-from)*t));
 if(t<1)fadeFrame=requestAnimationFrame(step);else fadeFrame=null};
 if(duration<=0){node.volume=to;return}
 fadeFrame=requestAnimationFrame(step);
}
async function ensurePlayback(){
 if(!activated||!musicEnabled()||document.hidden)return false;
 const track=resolvedTrack();
 if(!audio||currentTrack!==track){
  const old=audio;const node=new Audio(import.meta.env.BASE_URL+'music/'+track+'.mp3');
  node.preload='auto';node.loop=true;node.volume=0;
  audio=node;currentTrack=track;playing=false;
  if(old){old.pause();old.removeAttribute('src');old.load()}
 }
 const node=audio;
 if(node.paused){try{await node.play()}catch(e){playing=false;console.warn('Фоновая музыка пока не может воспроизводиться',e);return false}}
 if(audio!==node)return false;
 playing=true;fadeTo(node,target(),420);
 return true;
}
export function startMusic(){activated=true;return ensurePlayback()}
export function stopMusic(){
 if(fadeFrame!==null){cancelAnimationFrame(fadeFrame);fadeFrame=null}
 playing=false;
 if(audio){audio.pause();audio.currentTime=0;audio.removeAttribute('src');audio.load();audio=null;currentTrack=null}
}
export async function setMusicEnabled(enabled:boolean){
 safeWrite(ENABLED_KEY,String(enabled));
 if(!enabled){stopMusic();return true}
 activated=true;
 const ok=await ensurePlayback();
 if(!ok)safeWrite(ENABLED_KEY,'false');
 return ok;
}
export function setMusicVolume(volume:number){const n=Math.max(0,Math.min(1,volume));safeWrite(VOLUME_KEY,String(n));if(audio)fadeTo(audio,target(),160)}
export function setMusicPreference(pref:MusicPreference){safeWrite(TRACK_KEY,pref);if(musicEnabled()&&activated)void ensurePlayback()}
export function setMusicScene(scene:MusicScene){if(currentScene===scene)return;currentScene=scene;if(musicEnabled()&&activated)void ensurePlayback()}
export function setMusicDucked(value:boolean){ducked=value;if(audio&&musicEnabled())fadeTo(audio,target(),260)}
export function attachMusicLifecycle(){
 // Restores a previously enabled soundtrack on the user's first gesture.
 // Browsers and Android WebView reject autoplay without an interaction.
 const restore=()=>{if(musicEnabled()){activated=true;void ensurePlayback()}};
 document.addEventListener('pointerdown',restore,{once:true,passive:true});
 const visibility=()=>{if(document.hidden||!musicEnabled()){if(audio)audio.pause();playing=false}else if(activated)void ensurePlayback()};
 const hidden=()=>{if(audio)audio.pause();playing=false};
 document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',hidden);
 return()=>{document.removeEventListener('pointerdown',restore);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',hidden);stopMusic()};
}
