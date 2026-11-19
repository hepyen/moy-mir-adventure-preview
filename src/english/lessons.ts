import {expandEnglishLessons} from './expandedLessons'
export type EnglishQuestion={prompt:string;options:[string,string,string];correct:number;explain:string;topic:string}
export type EnglishLesson={id:string;title:string;level:string;intro:string;rule:string;examples:string[];questions:EnglishQuestion[]}
const q=(topic:string,lines:[string,string,string,string,number,string][]):EnglishQuestion[]=>lines.map(([prompt,a,b,c,correct,explain])=>({prompt,options:[a,b,c],correct,explain,topic}))
export const LEGACY_LESSONS:EnglishLesson[]=[
 {id:'to-be',title:'Am, is, are',level:'A1 · Начало',intro:'Говорим, кто мы, где находимся и как себя чувствуем.',rule:'I am (I’m), he/she/it is, you/we/they are. В отрицании: am not / isn’t / aren’t.',examples:['I am twelve. — Мне двенадцать.','She is at school. — Она в школе.','They are happy. — Они рады.'],questions:q('to-be',[
 ['I ___ a student.','are','am','is',1,'С местоимением I используем am.'],
 ['She ___ my friend.','is','are','am',0,'She — третье лицо единственного числа, поэтому is.'],
 ['We ___ at home.','is','am','are',2,'We — множественное число, поэтому are.'],
 ['___ you tired?','Is','Are','Am',1,'В вопросе с you ставим Are в начало.'],
 ['He ___ not angry.','is','are','am',0,'He употребляется с is; isn’t — краткое отрицание.'],
 ['They ___ from Spain.','is','are','am',1,'They употребляется с are.']])},
 {id:'have-got',title:'Have got / has got',level:'A1 · Семья и вещи',intro:'Как сказать, что у тебя или у другого человека что-то есть.',rule:'I/you/we/they have got; he/she/it has got. Отрицание: haven’t got / hasn’t got.',examples:['I have got a dog. — У меня есть собака.','She has got two books. — У неё две книги.','Have you got a pen? — У тебя есть ручка?'],questions:q('have-got',[
 ['She ___ got a bike.','have','has','having',1,'She — has got.'],
 ['I ___ got a notebook.','has','having','have',2,'С I используем have got.'],
 ['They ___ got three cats.','have','has','is',0,'They — множественное число, have got.'],
 ['___ you got a pencil?','Has','Are','Have',2,'В вопросе с you используем Have you got...?'],
 ['He ___ got a brother.','hasn’t','haven’t','aren’t',0,'He hasn’t got — у него нет.'],
 ['We ___ got English today.','has','have','is',1,'We have got — у нас есть.']])},
 {id:'present-simple',title:'Present Simple',level:'A1 · Привычки',intro:'Рассказываем о действиях, которые повторяются регулярно.',rule:'I/you/we/they play. He/she/it plays. Для вопроса: Do you…? Does she…? В отрицании: don’t / doesn’t.',examples:['I read every day. — Я читаю каждый день.','He goes to school. — Он ходит в школу.','Does she like music? — Ей нравится музыка?'],questions:q('present-simple',[
 ['She ___ to school every day.','go','goes','going',1,'Для she у go появляется окончание -es.'],
 ['I ___ English on Mondays.','study','studies','studying',0,'После I глагол без -s.'],
 ['___ he play football?','Do','Is','Does',2,'В вопросе с he используем Does.'],
 ['My brother ___ TV at night.','watch','watches','watching',1,'Watch оканчивается на -ch, добавляется -es.'],
 ['We ___ like cold weather.','doesn’t','aren’t','don’t',2,'We don’t like — нам не нравится.'],
 ['He ___ his homework after school.','does','do','doing',0,'He does his homework — он выполняет домашнее задание.']])},
 {id:'present-continuous',title:'Present Continuous',level:'A1 · Прямо сейчас',intro:'Описываем то, что происходит в этот момент.',rule:'am/is/are + глагол с -ing: I am reading, she is playing, they are walking.',examples:['I am learning English now.','She is writing a message.','They are playing outside.'],questions:q('present-continuous',[
 ['I ___ reading now.','is','am','are',1,'I am reading.'],
 ['She is ___ a book.','read','reads','reading',2,'После is ставим глагол с -ing.'],
 ['They ___ playing now.','are','is','am',0,'They are playing.'],
 ['Look! The dog ___ running.','am','is','are',1,'The dog = it; используем is.'],
 ['He is not ___ today.','sleep','sleeping','sleeps',1,'После is not ставим -ing.'],
 ['___ you listening?','Are','Do','Does',0,'Are you listening? — Ты слушаешь?']])},
 {id:'there-is-are',title:'There is / There are',level:'A1 · Дом и комната',intro:'Описываем, что находится в комнате, доме и на улице.',rule:'There is — один предмет; there are — несколько. Is there…? Are there…? — вопросы.',examples:['There is a desk in my room.','There are three windows.','Is there a garden?'],questions:q('there-is-are',[
 ['There ___ a dog in the garden.','are','is','am',1,'Одна собака: there is.'],
 ['There ___ two books on the table.','is','am','are',2,'Две книги: there are.'],
 ['___ there a lamp in the room?','Are','Is','Do',1,'Is there a lamp?'],
 ['There ___ any chairs here.','aren’t','isn’t','doesn’t',0,'Во множественном числе: there aren’t.'],
 ['There is ___ apple.','a','an','thee',1,'Перед гласным звуком в apple используем an.'],
 ['___ there any flowers?','Are','Is','Am',0,'Flowers — множественное число: Are there...?']])},
 {id:'past-simple',title:'Past Simple',level:'A1–A2 · Вчера',intro:'Рассказываем, что происходило вчера или на прошлой неделе.',rule:'Для правильных глаголов: play → played, watch → watched. Неправильные: go → went, eat → ate. Вопрос: Did you…?',examples:['I visited my friend yesterday.','We went to the park.','Did you watch the film?'],questions:q('past-simple',[
 ['Yesterday I ___ football.','play','played','playing',1,'Yesterday требует прошедшего времени: played.'],
 ['We ___ to the park last Sunday.','went','go','goed',0,'Неправильный глагол go → went.'],
 ['___ you study yesterday?','Do','Did','Does',1,'В вопросах о прошлом используем Did.'],
 ['He ___ breakfast at eight.','eated','eat','ate',2,'Неправильный глагол eat → ate.'],
 ['She didn’t ___ TV.','watch','watched','watches',0,'После didn’t глагол в начальной форме.'],
 ['I ___ my homework last night.','finish','finished','finishing',1,'Regular verb: finish → finished.']])},
 {id:'daily-words',title:'School & daily life',level:'A1 · Словарь',intro:'Слова для школы, дома и повседневной жизни.',rule:'Запоминай слова в коротких предложениях, а не по одному. Пытайся составлять собственные фразы.',examples:['My timetable starts at eight.','I put my books in my backpack.','I have lunch at home.'],questions:q('daily-words',[
 ['What is a “timetable”?','расписание','тетрадь','парта',0,'Timetable — расписание уроков.'],
 ['What is “homework”?','каникулы','домашняя работа','перемена',1,'Homework — домашнее задание.'],
 ['“Breakfast” means…','обед','ужин','завтрак',2,'Breakfast — завтрак.'],
 ['I keep my pens in a ___.','pencil case','window','garden',0,'Pencil case — пенал.'],
 ['After school I ___ home.','sleep','go','readed',1,'Go home — идти домой.'],
 ['“Library” means…','школа','столовая','библиотека',2,'Library — библиотека.']])},
 {id:'questions',title:'Asking questions',level:'A1–A2 · Разговор',intro:'Учимся задавать вопросы и понимать ответы.',rule:'What — что, where — где/куда, when — когда, who — кто, why — почему, how — как.',examples:['Where do you live? — Где ты живёшь?','What time is it? — Который час?','How are you? — Как дела?'],questions:q('questions',[
 ['___ is your name?','Where','What','When',1,'What is your name?'],
 ['___ do you go to school? — At eight.','When','Who','Why',0,'When спрашивает о времени.'],
 ['___ is that person? — My teacher.','How','Where','Who',2,'Who спрашивает, кто это.'],
 ['___ are you? — Fine, thanks.','How','Why','When',0,'How are you? — Как дела?'],
 ['___ do you live? — In Spain.','Why','Where','Who',1,'Where спрашивает о месте.'],
 ['___ are you happy? — Because it is Friday.','Who','What','Why',2,'Why спрашивает о причине.']])}
]
const diagnosticQuestions:EnglishQuestion[]=[
 LEGACY_LESSONS[0].questions[0],LEGACY_LESSONS[0].questions[3],LEGACY_LESSONS[0].questions[4],
 LEGACY_LESSONS[1].questions[0],LEGACY_LESSONS[1].questions[2],
 LEGACY_LESSONS[2].questions[0],LEGACY_LESSONS[2].questions[2],LEGACY_LESSONS[2].questions[4],
 LEGACY_LESSONS[3].questions[0],LEGACY_LESSONS[3].questions[3],
 LEGACY_LESSONS[4].questions[0],LEGACY_LESSONS[4].questions[2],
 LEGACY_LESSONS[5].questions[0],LEGACY_LESSONS[5].questions[1],
 LEGACY_LESSONS[6].questions[0],LEGACY_LESSONS[6].questions[3],
 LEGACY_LESSONS[7].questions[0],LEGACY_LESSONS[7].questions[4],
]
export const LESSONS=expandEnglishLessons(LEGACY_LESSONS)
export const DIAGNOSTIC:EnglishLesson={id:'diagnostic',title:'Проверка уровня',level:'18 заданий · без оценки',intro:'Миро выяснит, с каких тем тебе лучше начать. Ошибаться можно: это помогает составить план.',rule:'Прочитай каждое предложение и выбери подходящий вариант. В конце получишь объяснения и план.',examples:['Выбирай сам. Подсказки будут после завершения.'],questions:diagnosticQuestions}
export const ALL_ENGLISH_LESSONS=[DIAGNOSTIC,...LESSONS,...LEGACY_LESSONS]
export const findEnglishLesson=(key:string)=>ALL_ENGLISH_LESSONS.find(x=>x.id===key)
/** New option arrangement for every session; the selected value is always the canonical option ID. */
export function shuffledEnglishChoices(q:EnglishQuestion,sessionId:string,index:number){
 const result=[0,1,2]
 let seed=2166136261
 for(const char of sessionId+':'+index){seed^=char.charCodeAt(0);seed=Math.imul(seed,16777619)>>>0}
 for(let i=result.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[result[i],result[j]]=[result[j],result[i]]}
 return result
}
