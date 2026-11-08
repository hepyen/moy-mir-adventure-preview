import {Capacitor} from '@capacitor/core';
import {Browser} from '@capacitor/browser';
import './SchoolHub.css';
const OFFICIAL_DAILY='https://wol.jw.org/ru/wol/h/r2/lp-u';
export function DailyTextCard({onAskMiro,onSchoolSettings}:{onAskMiro:(question:string)=>void;onSchoolSettings:()=>void}){
 const today=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Madrid',day:'numeric',month:'long',year:'numeric'}).format(new Date());
 async function openOfficial(){try{if(Capacitor.isNativePlatform())await Browser.open({url:OFFICIAL_DAILY,presentationStyle:'fullscreen'});else window.open(OFFICIAL_DAILY,'_blank','noopener,noreferrer')}catch{window.open(OFFICIAL_DAILY,'_blank','noopener,noreferrer')}}
 return <section className="mw-panel school-dailytext"><div className="mw-section-label">📅 {today}</div><h3>📖 Текст на сегодня</h3>
  <p>Прочитай библейский стих и официальный комментарий из Онлайн-библиотеки Сторожевой башни. Каждый день открывается актуальная публикация.</p>
  <button onClick={()=>void openOfficial()}>Открыть стих и комментарий</button>
  <div className="school-source">Источник: wol.jw.org · «Исследуем Писание каждый день». Содержимое читается на официальном сайте, не генерируется нейросетью.</div>
  <div className="school-actions" style={{marginTop:11}}><button onClick={()=>onAskMiro('Я прочитал сегодняшний ежедневный стих в JW Library. Помоги мне обдумать его и применить на практике. Сначала спроси меня, что это был за стих, и не придумывай его содержание.')} style={{background:'#e0eee5',color:'#51785b'}}>🤖 Обсудить стих с Миро</button><button onClick={onSchoolSettings} style={{background:'#e0eee5',color:'#51785b'}}>🔔 Напоминание</button></div>
 </section>
}
