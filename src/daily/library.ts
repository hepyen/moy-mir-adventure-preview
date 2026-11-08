import JSZip from 'jszip';
import {supabase} from '../lib/supabase';

export type DailyEntry={date:string;heading:string;theme:string;commentary:string};
export type DailyYear={schema:'moymir-daily-texts-1';year:number;language:'ru';source:string;publisher:string;dates:Record<string,DailyEntry>};
export type DailyLibrary=Partial<Record<2026|2027,DailyYear>>;
export const YEARS=[2026,2027] as const;
const BUCKET='moymir-daily-private';
const STORE='daily-years';
const DB='moymir-private-daily-texts-v1';
const months:Record<string,number>={января:1,февраля:2,марта:3,апреля:4,мая:5,июня:6,июля:7,августа:8,сентября:9,октября:10,ноября:11,декабря:12};
const weekdays=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const datePattern=/(Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье),\s*(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i;
function normalized(s:string){return s.replace(/[\u00a0\u202f]/g,' ').replace(/\s+/g,' ').trim()}
function storeKey(familyId:string,year:number){return `${familyId}/${year}`}
function openDatabase():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('IndexedDB недоступна'));
 });
}
async function readCache(familyId:string,year:2026|2027):Promise<DailyYear|null>{
 const db=await openDatabase();return new Promise((resolve,reject)=>{
  const req=db.transaction(STORE,'readonly').objectStore(STORE).get(storeKey(familyId,year));
  req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>{db.close();reject(req.error)};
 });
}
async function writeCache(familyId:string,doc:DailyYear){
 const db=await openDatabase();await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(doc,storeKey(familyId,doc.year));
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Не удалось сохранить тексты офлайн'));
 });db.close();
}
function checkYear(input:unknown):DailyYear{
 if(!input||typeof input!=='object')throw Error('Некорректная структура книги');
 const raw=input as Record<string,unknown>;
 if(raw.schema!=='moymir-daily-texts-1'||![2026,2027].includes(Number(raw.year)))throw Error('Ожидается сборник «Исследуем Писание» 2026 или 2027 года');
 const year=Number(raw.year) as 2026|2027,days=raw.dates;
 if(!days||typeof days!=='object'||Object.keys(days).length!==365)throw Error(`В сборнике ${year} года должно быть ровно 365 ежедневных текстов`);
 for(const [key,value] of Object.entries(days)){
  const item=value as Partial<DailyEntry>;
  if(!/^20(26|27)-\d\d-\d\d$/.test(key)||!key.startsWith(String(year))||item.date!==key||typeof item.theme!=='string'||typeof item.commentary!=='string'||!item.theme.trim()||!item.commentary.trim())throw Error('Повреждена запись: '+key);
  const d=new Date(key+'T12:00:00');if(Number.isNaN(d.getTime())||d.getMonth()+1!==Number(key.slice(5,7))||d.getDate()!==Number(key.slice(8)))throw Error('Неверная дата: '+key);
 }
 return input as DailyYear;
}
async function parseOriginalEpub(zip:JSZip,name:string):Promise<DailyYear>{
 const files=Object.keys(zip.files).filter(n=>n.endsWith('.xhtml')&&!zip.files[n].dir);
 if(files.length>1100)throw Error('EPUB содержит слишком много страниц');
 const yearMatch=name.match(/es(26|27)/i)||files.join(' ').match(/11020(26|27)\d\d/);
 const year=yearMatch?Number('20'+yearMatch[1]):null;
 if(year!==2026&&year!==2027)throw Error('Не могу определить год EPUB. Нужен файл es26_U.epub или es27_U.epub');
 const entries:Record<string,DailyEntry>={};
 for(const file of files){
  const txt=await zip.files[file].async('string');
  if(!txt.includes('themeScrp')||!txt.includes('bodyTxt'))continue;
  const doc=new DOMParser().parseFromString(txt,'application/xml');
  if(doc.querySelector('parsererror'))continue;
  const header=doc.querySelector('header h2'),theme=doc.querySelector('p.themeScrp'),paragraphs=[...doc.querySelectorAll('div.bodyTxt p')];
  if(!header||!theme||!paragraphs.length)continue;
  const caption=normalized(header.textContent||'');
  const match=caption.match(datePattern);if(!match)continue;
  const day=Number(match[2]),month=months[match[3].toLowerCase()];
  const id=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const date=new Date(id+'T12:00:00');
  if(date.getDate()!==day||date.getMonth()+1!==month||weekdays[date.getDay()]!==match[1].toLowerCase())throw Error('Дата или день недели не совпадает: '+caption);
  if(entries[id])throw Error('Повторная дата: '+id);
  const commentary=paragraphs.map(p=>normalized(p.textContent||'')).filter(Boolean).join('\n\n');
  entries[id]={date:id,heading:match[0],theme:normalized(theme.textContent||''),commentary};
 }
 return checkYear({schema:'moymir-daily-texts-1',year,language:'ru',source:'Исследуем Писание на '+year+' год',publisher:'WATCHTOWER',dates:entries});
}
export async function parseDailyFiles(file:File):Promise<DailyYear[]>{
 if(file.size>16*1024*1024)throw Error('Файл больше 16 МБ');
 if(!/\.(zip|epub|json)$/i.test(file.name))throw Error('Выбери EPUB, JSON или архив ZIP');
 if(/\.json$/i.test(file.name))return [checkYear(JSON.parse(await file.text()))];
 const zip=await JSZip.loadAsync(file);
 if(/\.epub$/i.test(file.name))return [await parseOriginalEpub(zip,file.name)];
 const candidates=YEARS.map(y=>zip.file(`daily-${y}.json`)).filter(Boolean);
 if(!candidates.length)throw Error('В ZIP не найдены daily-2026.json или daily-2027.json');
 const parsed:DailyYear[]=[];
 for(const item of candidates){if(!item)continue;parsed.push(checkYear(JSON.parse(await item.async('string'))))}
 return parsed;
}
export async function loadCachedDaily(familyId:string):Promise<DailyLibrary>{
 const results=await Promise.allSettled(YEARS.map(y=>readCache(familyId,y)));
 const library:DailyLibrary={};for(let i=0;i<YEARS.length;i++)if(results[i].status==='fulfilled'){
  const data=(results[i] as PromiseFulfilledResult<DailyYear|null>).value;if(data)library[YEARS[i]]=data;
 }return library;
}
export async function downloadDailyFromFamily(familyId:string):Promise<DailyLibrary>{
 const results:DailyLibrary={};if(!supabase)return results;
 for(const year of YEARS){
  const path=`${familyId}/daily-${year}.json`;
  const {data,error}=await supabase.storage.from(BUCKET).download(path);
  if(error){if(!/not.?found|404|does not exist/i.test(error.message))console.warn('Daily private download:',error.message);continue}
  if(!data||data.size>2*1024*1024)continue;
  try{const doc=checkYear(JSON.parse(await data.text()));await writeCache(familyId,doc);results[year]=doc}catch(e){console.warn('Private daily text invalid:',e)}
 }return results;
}
export async function saveImportedDaily(familyId:string,docs:DailyYear[]){
 if(!supabase)throw Error('Нет подключения к семейному серверу');
 for(const doc of docs){
  const path=`${familyId}/daily-${doc.year}.json`;
  const file=new Blob([JSON.stringify(doc)],{type:'application/json'});
  const {error}=await supabase.storage.from(BUCKET).upload(path,file,{upsert:true,contentType:'application/json'});
  if(error)throw Error(`Не удалось передать сборник ${doc.year} года семье: ${error.message}`);
  await writeCache(familyId,doc);
 }
}
export function dateInMadrid(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const m=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${m.year}-${m.month}-${m.day}`}
