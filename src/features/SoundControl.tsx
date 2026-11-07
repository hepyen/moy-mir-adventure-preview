import {useEffect,useState} from 'react';
import {attachInterfaceSounds,isSoundEnabled,setSoundEnabled,playSound} from './sounds';
export function SoundControl({onChange}:{onChange?:(enabled:boolean)=>void}){
 const [enabled,setEnabled]=useState(isSoundEnabled);
 useEffect(()=>attachInterfaceSounds(),[]);
 return <button type="button" className="mw-settings-audio" title={enabled?'Отключить системные звуки':'Включить системные звуки'} aria-label={enabled?'Отключить звуки':'Включить звуки'} onClick={()=>{const next=!enabled;setEnabled(next);setSoundEnabled(next);onChange?.(next);if(next)playSound('notification')}}>{enabled?'🔊':'🔇'}<span>{enabled?'Звуки включены':'Без звука'}</span></button>;
}
