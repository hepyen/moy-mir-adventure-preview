import {useState} from 'react';
import {musicEnabled,musicPreference,musicVolume,setMusicEnabled,setMusicPreference,setMusicVolume} from './music';
import type {MusicPreference} from './music';
const tracks:[MusicPreference,string][]=[['auto','🎼 Мелодия для каждого раздела'],['meadow','🌿 Ice Cream · добрая и живая'],['treehouse','🌳 Echoes of Home · сказочная'],['reading','📖 Growing Up · нежное фортепиано']];
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
   <p className="mw-music-caption">Три полноценные композиции с красивой аранжировкой. Музыка затихает, когда приложение свёрнуто.</p>
   <label className="mw-music-label">Мелодия<select aria-label="Выбрать фоновую мелодию" value={pref} onChange={e=>{const p=e.target.value as MusicPreference;setPref(p);setMusicPreference(p)}}>{tracks.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
   <label className="mw-music-label">Громкость · {Math.round(volume*100)}%<input aria-label="Громкость фоновой музыки" type="range" min="0" max="100" step="5" value={Math.round(volume*100)} onChange={e=>{const n=Number(e.target.value)/100;setVolume(n);setMusicVolume(n)}}/></label>
   <details className="mw-music-credits"><summary>🎼 Автор музыки и лицензия</summary><p>Автор: Scott Buckley. Композиции: Ice Cream (2023), Echoes of Home (2025), Growing Up (2018). Лицензия Creative Commons Attribution 4.0 International (CC BY 4.0). Использованы сокращённые по размеру MP3-копии с выравниванием громкости.</p><p>Официальные источники: scottbuckley.com.au/library/ice-cream/ · /echoes-of-home/ · /growing-up/. Лицензия: creativecommons.org/licenses/by/4.0/.</p></details>
   {error&&<small className="mw-cloud-error" role="alert">{error}</small>}
 </div>;
}
