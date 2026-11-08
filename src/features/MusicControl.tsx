import {useState} from 'react';
import {musicEnabled,musicPreference,musicVolume,setMusicEnabled,setMusicPreference,setMusicVolume} from './music';
import type {MusicPreference} from './music';
const tracks:[MusicPreference,string][]=[['auto','🎼 По разделу приложения'],['meadow','🌿 Мелодия поляны'],['treehouse','🌳 Сказочный домик'],['reading','📖 Тихое чтение']];
export function MusicControl(){
 const[enabled,setEnabled]=useState(musicEnabled),[busy,setBusy]=useState(false);
 const[volume,setVolume]=useState(musicVolume),[pref,setPref]=useState<MusicPreference>(musicPreference);
 const[error,setError]=useState('');
 async function toggle(){
  if(busy)return;setBusy(true);setError('');
  try{const ok=await setMusicEnabled(!enabled);setEnabled(musicEnabled());if(!ok)setError('Android пока не разрешил воспроизведение. Попробуй нажать ещё раз.')}
  catch(e){setError(e instanceof Error?e.message:'Не удалось включить музыку')}
  finally{setBusy(false)}
 }
 return <div className="mw-music-settings" aria-label="Настройки фоновой музыки">
   <button type="button" className="mw-music-toggle" disabled={busy} onClick={()=>void toggle()}>{enabled?'🎵 Выключить настоящую музыку':'🎶 Включить фоновую музыку'}</button>
   <p className="mw-music-caption">Три оригинальные инструментальные мелодии. Гул удалён. Музыка останавливается при сворачивании.</p>
   <label className="mw-music-label">Мелодия<select aria-label="Выбрать фоновую мелодию" value={pref} onChange={e=>{const p=e.target.value as MusicPreference;setPref(p);setMusicPreference(p)}}>{tracks.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
   <label className="mw-music-label">Громкость · {Math.round(volume*100)}%<input aria-label="Громкость фоновой музыки" type="range" min="0" max="100" step="5" value={Math.round(volume*100)} onChange={e=>{const n=Number(e.target.value)/100;setVolume(n);setMusicVolume(n)}}/></label>
   {error&&<small className="mw-cloud-error" role="alert">{error}</small>}
 </div>;
}
