import {useEffect,useState} from 'react';
import {musicEnabled,setMusicEnabled,stopMusic} from './music';
export function MusicControl(){
 const [on,setOn]=useState(musicEnabled);
 useEffect(()=>{const v=()=>{if(document.visibilityState==='hidden')stopMusic();else if(on)setMusicEnabled(true)};document.addEventListener('visibilitychange',v);return()=>document.removeEventListener('visibilitychange',v)},[on]);
 return <button type='button' className='mw-music-toggle' onClick={()=>{setMusicEnabled(!on);setOn(!on)}}>{on?'🎵 Выключить фоновую музыку':'🎶 Включить тихую фоновую музыку'}</button>
}
