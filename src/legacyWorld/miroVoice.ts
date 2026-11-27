type Recognition={lang:string;interimResults:boolean;maxAlternatives:number;onresult:((e:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;abort:()=>void}
type RecognitionCtor=new()=>Recognition
function constructor(){const w=window as typeof window&{SpeechRecognition?:RecognitionCtor;webkitSpeechRecognition?:RecognitionCtor};return w.SpeechRecognition??w.webkitSpeechRecognition}
export const canListen=()=>!!constructor()
export const canSpeak=()=>typeof window.speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined'
export function stopSpeaking(){if(canSpeak())window.speechSynthesis.cancel()}
export function speakMiro(text:string,lang:string,onEnd:()=>void,onError:()=>void){if(!canSpeak()){onError();return false}try{stopSpeaking();const u=new SpeechSynthesisUtterance(text.slice(0,2500));u.lang=lang;u.rate=.93;u.pitch=1.12;u.onend=onEnd;u.onerror=e=>{if(e.error==='canceled'||e.error==='interrupted')onEnd();else onError()};window.speechSynthesis.speak(u);return true}catch{onError();return false}}
export function listenMiro(lang:string,onText:(v:string)=>void,onError:(s:string)=>void,onEnd:()=>void){
 const C=constructor();if(!C){onError('Голосовой ввод недоступен. Используй микрофон клавиатуры или напиши вопрос.');return null}
 try{const r=new C();r.lang=lang;r.interimResults=false;r.maxAlternatives=1;r.onresult=e=>onText(e.results[0]?.[0]?.transcript||'');r.onerror=e=>onError(e.error==='not-allowed'?'Разреши микрофон в настройках телефона.':'Не удалось распознать речь. Можно напечатать вопрос.');r.onend=onEnd;r.start();return ()=>r.abort()}catch{onError('Микрофон недоступен. Используй клавиатуру.');return null}
}
