import {useDailyReading} from './useDailyReading';
import {playSound} from '../features/sounds';
import {useEffect,useRef,useState} from 'react';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import {dateInMadrid,downloadDailyFromFamily,loadCachedDaily,parseDailyFiles,saveImportedDaily} from './library';
import type {DailyLibrary,DailyYear} from './library';
import './DailyTextReader.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
const start='2026-01-01',end='2027-12-31';
const fmt=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Madrid',weekday:'long',day:'numeric',month:'long',year:'numeric'});
const dayNumber=(id:string)=>new Date(id+'T12:00:00');
function shift(id:string,n:number){const d=dayNumber(id);d.setDate(d.getDate()+n);const y=d.getFullYear();return `${y}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function DailyTextReader({cloud,onAskMiro,onSchoolSettings}:{cloud:Cloud;onAskMiro:(question:string)=>void;onSchoolSettings:()=>void}){
 const today=dateInMadrid();
 const[date,setDate]=useState(today);
 const[claiming,setClaiming]=useState(false),[justAwarded,setJustAwarded]=useState(false);
 const[books,setBooks]=useState<DailyLibrary>({});
 const[loading,setLoading]=useState(true),[uploading,setUploading]=useState(false),[message,setMessage]=useState('');
 const[error,setError]=useState('');
 const upload=useRef<HTMLInputElement>(null);
 const familyId=cloud.familyId;
 useEffect(()=>{if(!familyId){setBooks({});setLoading(false);return}
  let live=true;setLoading(true);setBooks({});setMessage('');
  void loadCachedDaily(familyId).then(c=>{if(live)setBooks(c)}).catch(e=>console.warn('Offline library:',e)).finally(()=>{if(live)setLoading(false)});
  void downloadDailyFromFamily(familyId).then(c=>{if(live)setBooks(prev=>({...prev,...c}))}).catch(e=>{if(live)console.warn('Family private library:',e)});
  return()=>{live=false};
 },[familyId]);
 const year=Number(date.slice(0,4)) as 2026|2027;
 const item=books[year]?.dates[date];
 const loadedYears=[2026,2027].filter(y=>!!books[y as 2026|2027]);
 const isToday=date===today;
 const todaysAward=cloud.spiritual.find(x=>x.step_id==='daily-text'&&x.activity_date===today);
 const alreadyRead=Number(todaysAward?.points||0)>=10||justAwarded;
 const reading=useDailyReading(cloud.session?.user.id||'',date,cloud.role==='child'&&isToday&&!!item&&!alreadyRead);
 useEffect(()=>setJustAwarded(false),[date,cloud.session?.user.id]);
 const setDateSafe=(d:string)=>{if(d>=start&&d<=end)setDate(d)};
 async function onFiles(files:FileList|null){if(!files?.length||!familyId||cloud.role!=='parent')return;
  setError('');setMessage('');setUploading(true);
  try{
   const imported:DailyYear[]=[];
   for(const file of Array.from(files))imported.push(...await parseDailyFiles(file));
   const unique=[...new Map(imported.map(x=>[x.year,x])).values()];
   await saveImportedDaily(familyId,unique);
   setBooks(prev=>({...prev,...Object.fromEntries(unique.map(x=>[x.year,x]))}));
   setMessage(`Загружено ${unique.length} сборника: ${unique.map(x=>x.year).join(', ')}. Теперь они доступны семье и сохранены на этом устройстве офлайн.`);
  }catch(e){setError(e instanceof Error?e.message:'Ошибка при чтении книги')}
  finally{setUploading(false);if(upload.current)upload.current.value=''}
 }
 async function markRead(){
  if(claiming||alreadyRead||!reading.done||date!==dateInMadrid())return;
  setError('');setClaiming(true);
  try{
   await cloud.rpc('finish_daily_text_reading',{
    p_family:familyId,p_date:date,
    p_active_seconds:Math.floor(reading.progress.seconds),
    p_max_progress:Number(reading.progress.depth.toFixed(3)),
    p_interactions:reading.progress.interactions
   });
   setJustAwarded(true);
   playSound('success');
   setMessage('🌟 Чтение завершено! +10 баллов духовного роста.');
  }catch(e){setError(e instanceof Error?e.message:'Не получилось сохранить духовные баллы. Проверь подключение и повтори.')}
  finally{setClaiming(false)}
 }
 const prompt=item?'Я прочитал ежедневный стих за '+date+': '+item.theme+' Комментарий начинается так: '+item.commentary.slice(0,620)+'. Помоги мне понять смысл и задуматься о применении. Не выдавай свои слова за оригинальную публикацию. Задай вопрос для обсуждения.':'Помоги мне понять библейский стих.';
 return <section className="mw-panel daily-reader" aria-label="Календарь ежедневных библейских текстов">
  <div className="daily-reader-heading"><div><span className="daily-reader-kicker">🌾 ИССЛЕДУЕМ ПИСАНИЕ КАЖДЫЙ ДЕНЬ</span><h3>📖 Текст на каждый день</h3></div><span className="daily-book-icon">📚</span></div>
  <div className="daily-reader-date"><button type="button" disabled={date<=start} onClick={()=>setDateSafe(shift(date,-1))} aria-label="Предыдущий день">‹</button><label><span>{fmt.format(dayNumber(date))}</span><input aria-label="Выбрать дату ежедневного текста" type="date" min={start} max={end} value={date} onChange={e=>setDateSafe(e.target.value)}/></label><button type="button" disabled={date>=end} onClick={()=>setDateSafe(shift(date,1))} aria-label="Следующий день">›</button></div>
  <div className="daily-year-tabs"><button className={year===2026?'active':''} onClick={()=>setDateSafe('2026'+date.slice(4))}>2026 {books[2026]?'✓':''}</button><button className={year===2027?'active':''} onClick={()=>setDateSafe('2027'+date.slice(4))}>2027 {books[2027]?'✓':''}</button><button className="daily-today" onClick={()=>setDateSafe(today)}>Сегодня</button></div>
  {loading&&!loadedYears.length?<p className="daily-loading">Открываем семейную библиотеку…</p>:item?<article className="daily-content" ref={reading.articleRef} aria-label="Текст для внимательного чтения"><div className="daily-text-theme">{item.theme}</div><h4>Размышления на сегодня</h4><div className="daily-commentary">{item.commentary}</div><div className="daily-source">Источник: «Исследуем Писание на {year} год», WATCHTOWER. Материал предоставлен семьёй и сохранён в закрытой библиотеке.</div></article>:<div className="daily-not-loaded"><strong>📗 Сборник {year} года ещё не загружен</strong><p>{cloud.role==='parent'?'Добавь оригинальный EPUB или подготовленный архив за 2026–2027 годы. После загрузки книги появятся у Ильи и будут доступны офлайн.':'Родитель должен один раз добавить сборники в семейную библиотеку. После этого они автоматически появятся на твоём телефоне при подключении к интернету.'}</p></div>}
  {item&&cloud.role==='child'&&isToday&&<div className="daily-reading-reward">
   {alreadyRead?<div className="daily-reading-success" role="status"><span>🌟</span><strong>Сегодня прочитано · +10 ✨</strong><small>Баллы зачислены только в духовный рост.</small></div>:<>
    <div className="daily-reading-head"><strong>🌱 Читаю и расту</strong><b>+10 ✨</b></div>
    <div className="daily-reading-meter"><span style={{width:`${Math.min(100,reading.progress.seconds/60*100)}%`}}/></div>
    <p>Читай спокойно, листай текст до конца. Система учитывает активное чтение. Не нужно отвечать на вопросы.</p>
    <small>{reading.secondsLeft>0?`Ещё примерно ${reading.secondsLeft} сек. чтения`:reading.progress.depth<.94?'Пролистай комментарий до конца':reading.progress.interactions<2?'Листай текст в своём темпе':'Чтение завершено — можно получить баллы'}</small>
    <button type="button" className="daily-finish-reading" disabled={!reading.done||claiming} onClick={()=>void markRead()}>{claiming?'Сохраняем…':reading.done?'✓ Завершить чтение · +10 ✨':'📖 Продолжить чтение'}</button>
   </>}
  </div>}
  {item&&<div className="daily-reader-actions"><button onClick={()=>onAskMiro(prompt)}>🤖 Обсудить с Миро</button><button onClick={onSchoolSettings}>🔔 Напоминания</button></div>}
  {cloud.role==='parent'&&<details className="daily-import"><summary>📥 Добавить или обновить тексты из EPUB / ZIP</summary><p>Выбери файлы <strong>es26_U.epub</strong> и <strong>es27_U.epub</strong> либо один подготовленный архив <strong>MOY_MIR_daily_texts_2026_2027.zip</strong>. Файлы загружаются только в закрытое семейное хранилище. Достаточно сделать это один раз.</p><input ref={upload} type="file" accept=".zip,.epub,.json,application/epub+zip,application/zip,application/json" multiple aria-label="Выбрать EPUB или ZIP с ежедневными текстами" onChange={e=>void onFiles(e.target.files)}/><button disabled={uploading} onClick={()=>upload.current?.click()}>{uploading?'Обработка книг…':'Выбрать файлы для семейной библиотеки'}</button></details>}
  {!item&&!loading&&cloud.role==='child'&&<button className="daily-sync" onClick={()=>{setLoading(true);void downloadDailyFromFamily(familyId).then(c=>setBooks(prev=>({...prev,...c}))).finally(()=>setLoading(false))}}>↻ Загрузить семейную библиотеку</button>}
  {message&&<p role="status" className="daily-message">{message}</p>}{error&&<p role="alert" className="daily-error">{error}</p>}
 </section>
}
