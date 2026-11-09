const {chromium}=require('playwright-core');
const JSZip=require('jszip');
const BASE=process.env.QA_BASE_URL||'http://127.0.0.1:5248/';
const ids={parent:'11111111-1111-4111-8111-111111111111',child:'22222222-2222-4222-8222-222222222222',family:'33333333-3333-4333-8333-333333333333',task:'44444444-4444-4444-8444-444444444444',daily:'55555555-5555-4555-8555-555555555555',reward:'66666666-6666-4666-8666-666666666666'};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function makeJWT(id){const payload=Buffer.from(JSON.stringify({sub:id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+7200})).toString('base64url');return 'eyJhbGciOiJIUzI1NiJ9.'+payload+'.synthetic'}
let failures=0;
const privateDaily=new Map();
async function syntheticEpub(){
 const zip=new JSZip();
 const weekdays=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
 const months=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
 for(let i=0;i<365;i++){
  const day=new Date(Date.UTC(2026,0,i+1));const date=day.toISOString().slice(0,10);
  const heading=`${weekdays[day.getUTCDay()]}, ${day.getUTCDate()} ${months[day.getUTCMonth()]}`;
  const xml=`<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${heading}</title></head><body><header><h2>${heading}</h2></header><p class="themeScrp">СИНТЕТИЧЕСКИЙ ТЕКСТ ${date}</p><div class="bodyTxt"><p>Синтетический комментарий ${date}</p></div></body></html>`;
  zip.file(`OEBPS/1102026200-split${i+1}.xhtml`,xml);
 }
 return zip.generateAsync({type:'nodebuffer'});
}
async function syntheticArchive(){
 const zip=new JSZip();
 for(const year of [2026,2027]){
  const dates={};
  const daycount=365;
  for(let i=0;i<daycount;i++){
   const d=new Date(Date.UTC(year,0,i+1)).toISOString().slice(0,10);
   dates[d]={date:d,heading:'Тестовая дата '+d,theme:'СИНТЕТИЧЕСКИЙ ТЕКСТ '+d,commentary:'Тестовый комментарий. Это не материал издательства.'};
  }
  zip.file('daily-'+year+'.json',JSON.stringify({schema:'moymir-daily-texts-1',year,language:'ru',source:'QA synthetic',publisher:'QA',dates}));
 }
 return zip.generateAsync({type:'nodebuffer'});
}
const dateToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

// Synthetic test copy of the 30 classes extracted from the user's school timetable.
const schoolMatrix={
 1:['Biología y Geología','Música','Matemáticas','Inglés','Lengua','Educación Física'],
 2:['Geografía e Historia','Biología y Geología','Música','Matemáticas','Inglés','Lengua'],
 3:['Atención Educativa','Geografía e Historia','Tutoría','Biología y Geología','Plástica','Francés'],
 4:['Educación Física','Inglés','Francés','Matemáticas','Lengua','Computación y Robótica'],
 5:['Matemáticas','Educación Física','Geografía e Historia','Lengua','Inglés','Computación y Robótica']
};
const classHours=['08:00','09:00','10:00','11:00','12:30','13:30'];
const syntheticLessons=Object.entries(schoolMatrix).flatMap(([day,subjects])=>subjects.map((subject,i)=>({
 id:'a1111111-1111-4111-8111-'+String(Number(day)*100+i).padStart(12,'0'),
 family_id:ids.family,child_id:ids.child,weekday:Number(day),lesson_order:i+1,subject,starts_at:classHours[i]+':00',notes:''
})));

async function run(role,browser){
 const ctx=await browser.newContext({viewport:{width:role==='child'?390:430,height:860}});
 const uid=ids[role], session={access_token:makeJWT(uid),refresh_token:'fake-refresh',token_type:'bearer',expires_in:7200,expires_at:Math.floor(Date.now()/1000)+7200,user:{id:uid,aud:'authenticated',email:role+'@example.test',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()}};
 await ctx.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:'sb-ueqtitxbvsnqmbudwxwu-auth-token',session});
 const counters={rpc:[],restPosts:[],restWrites:[],errors:[]}; let world=1;let spiritualAward=0;let backpackChecked=false;let growthChoice=null;let growthAward=0;let playBalance=60,playCap=30,storyDone=[];
 let playSessions=role==='parent'?[{id:'91111111-1111-4111-8111-111111111111',minutes:10,status:'pending',requested_at:new Date().toISOString(),started_at:null}]:[];
 const playOverview=()=>({balance:playBalance,dailyLimit:playCap,todayUsed:playSessions.filter(x=>['active','finished'].includes(x.status)).reduce((n,x)=>n+x.minutes,0)});

 await ctx.route('https://ueqtitxbvsnqmbudwxwu.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url()), name=url.pathname.split('/').pop(),method=request.method();
  const resp=(data,object=false)=>route.fulfill({status:200,contentType:object?'application/vnd.pgrst.object+json':'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
  if(url.pathname.includes('/storage/v1/object/')){
   const key=url.pathname.replace(/^.*?moymir-daily-private\//,'');
   if(method==='POST'||method==='PUT'||method==='PATCH'){
    const raw=request.postDataBuffer().toString('utf8');const content=Buffer.from(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));privateDaily.set(key,content);
    return resp({Key:key});
   }
   if(method==='GET'){
    const book=privateDaily.get(key);
    if(book)return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:book});
    return route.fulfill({status:404,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'Object not found'})});
   }
  }
  if(url.pathname.includes('/auth/v1/'))return resp({user:session.user});
  if(url.pathname.includes('/rest/v1/rpc/')){counters.rpc.push({name,body:request.postDataJSON()});if(name==='advance_my_world')world=2;if(name==='finish_daily_text_reading'){spiritualAward=10;return resp(10)}if(name==='moymir_check_backpack'){backpackChecked=!!request.postDataJSON()?.p_done;return resp(true)}if(name==='moymir_choose_weekly_quality'){growthChoice=request.postDataJSON()?.p_quality;return resp(growthChoice)}if(name==='moymir_complete_growth_day'){growthAward=20;return resp(20)}if(name==='moymir_playtime_sync'||name==='moymir_playtime_overview')return resp(playOverview());if(name==='moymir_parent_activity_feed')return resp([{date:dateToday,category:'🧹 Ежедневное дело',title:'Заправить кровать',status:'approved',amount:5}]);
    if(name==='moymir_playtime_set_limit'){playCap=Number(request.postDataJSON()?.p_daily);return resp(true)}
    if(name==='moymir_playtime_grant'){playBalance+=Number(request.postDataJSON()?.p_minutes);return resp(true)}
    if(name==='moymir_playtime_request'){const minutes=Number(request.postDataJSON()?.p_minutes);playSessions=[{id:'92222222-2222-4222-8222-222222222222',minutes,status:'pending',requested_at:new Date().toISOString(),started_at:null}];return resp(playSessions[0].id)}
    if(name==='moymir_playtime_review'){playSessions=playSessions.map(x=>x.id===request.postDataJSON()?.p_id?{...x,status:request.postDataJSON()?.p_approve?'approved':'rejected'}:x);return resp(request.postDataJSON()?.p_approve?'approved':'rejected')}
    if(name==='moymir_playtime_start'){const when=new Date().toISOString();playSessions=playSessions.map(x=>x.id===request.postDataJSON()?.p_id?{...x,status:'active',started_at:when}:x);return resp(when)}
    if(name==='moymir_playtime_finish'){playSessions=playSessions.map(x=>x.id===request.postDataJSON()?.p_id?{...x,status:'finished'}:x);return resp(true)}
    if(name==='moymir_complete_story_chapter'){storyDone.push(Number(request.postDataJSON()?.p_chapter));return resp(true)}
    if(name==='moymir_family_overview')return resp({worldPoints:1700,balance:1700,earned:1700,spent:0,deducted:0,spiritualPoints:spiritualAward+growthAward,tasks7:2,daily7:5,spiritual7:spiritualAward+growthAward,homework7:1,today:dateToday});return resp(name==='advance_my_world'?2:name==='report_child_app_open'?false:'ok')}
  if(method==='HEAD'&&name==='moymir_story_chapters')return route.fulfill({status:200,headers:{'content-range':`0-${Math.max(0,storyDone.length-1)}/${storyDone.length}`,'access-control-allow-origin':'*'},body:''});
  if(!url.pathname.includes('/rest/v1/'))return resp({});
  if(method==='POST'&&name==='family_chat_messages'){counters.restPosts.push(name);return resp([])}
  if(['moymir_school_lessons','moymir_school_homework','moymir_school_preferences','moymir_backpack_items','moymir_growth_focus'].includes(name)&&['POST','PATCH','DELETE'].includes(method)){counters.restWrites.push({name,method});return resp([])}
  let data=[];
  switch(name){
   case 'moymir_school_lessons':data=syntheticLessons;break;
   case 'moymir_school_homework':data=[{id:'a2222222-2222-4222-8222-222222222222',family_id:ids.family,child_id:ids.child,subject:'Matemáticas',description:'Повторить дроби',due_date:today,completed_at:null}];break;
   case 'moymir_school_preferences':data={school_enabled:false,school_remind_at:'07:30:00',homework_enabled:false,homework_remind_at:'18:30:00',verse_enabled:false,verse_remind_at:'08:00:00'};break;
   case 'moymir_backpack_items':data=[{id:'b1111111-1111-4111-8111-111111111111',family_id:ids.family,child_id:ids.child,subject:'Matemáticas',item:'Тетрадь по математике'}];break;
   case 'moymir_backpack_checks':data=backpackChecked?[{id:'a5555555-5555-4555-8555-555555555555',item_id:'b1111111-1111-4111-8111-111111111111',for_date:dateToday,checked_at:new Date().toISOString()}]:[];break;
   case 'moymir_island_memories':data=[];break;
   case 'moymir_story_chapters':data=storyDone.map(chapter=>({chapter}));break;
   case 'moymir_playtime_sessions':data=playSessions;break;
   case 'moymir_playtime_policy':data=[{daily_limit:playCap}];break;
   case 'moymir_playtime_credits':data=[];break;

   case 'moymir_growth_focus':data=growthChoice?{quality:growthChoice}:null;break;
   case 'moymir_growth_daily':data=growthAward?[{activity_date:dateToday,quality:growthChoice,points:20}]:[];break;
   case 'family_members': data=url.searchParams.get('role')==='eq.child'?[{user_id:ids.child}]:url.searchParams.has('user_id')?{family_id:ids.family,role}:[{user_id:ids.parent,role:'parent'},{user_id:ids.child,role:'child'}];break;
   case 'point_ledger': data=[{child_id:ids.child,delta:1700}];break;
   case 'daily_chore_templates': data=[{id:ids.daily,title:'Заправить кровать',points:5,icon:'🛏️',active:true,weekdays:[0,1,2,3,4,5,6]}];break;
   case 'daily_chore_completions':data=[];break;
   case 'tasks':data=[{id:ids.task,title:'Сделать уроки',points:20,assigned_child:ids.child},{id:'77777777-7777-4777-8777-777777777777',title:'Без исполнителя',points:10,assigned_child:null}];break;
   case 'task_submissions':data=[];break;
   case 'rewards':data=[{id:ids.reward,title:'Семейное кино',cost:80,active:true},{id:'b2222222-2222-4222-8222-222222222222',title:'Неактивная награда',cost:200,active:false}];break;
   case 'reward_requests':data=[];break;
   case 'behavior_points':data=[];break;
   case 'spiritual_activity_records':data=[...(spiritualAward?[{id:'a4444444-4444-4444-8444-444444444444',activity_date:dateToday,step_id:'daily-text',points:10}]:[]),...(growthAward?[{id:'a6666666-6666-4666-8666-666666666666',activity_date:dateToday,step_id:'growth-focus',points:20}]:[])];break;
   case 'spiritual_point_requests':data=[];break;
   case 'child_task_proposals':data=[{id:'88888888-8888-4888-8888-888888888888',title:'Помыть велосипед',proposed_points:20,status:'pending'}];break;
   case 'child_world_progress':data=[{active_world:world}];break;
   case 'family_child_profiles':data=url.searchParams.has('child_id')?{display_name:'Илья'}:[{child_id:ids.child,display_name:'Илья'}];break;
   case 'family_chat_messages':data=[];break;
   case 'family_notifications':data=[];break;
   case 'device_push_tokens':data=[];break;
   default:data=[];
  }
  await resp(data,request.headers()['accept']?.includes('vnd.pgrst.object')||false)
 });
 const page=await ctx.newPage();page.on('pageerror',e=>counters.errors.push(e.message));
 const check=(label,pass,details='')=>{console.log((pass?'PASS':'FAIL'),role,label,details);if(!pass)failures++};
 try{
 await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:18000});await page.waitForTimeout(2200);
 check('connected',await page.getByText(/Прежний прогресс подключён/).count()>0,(await page.locator('.mw-cloud-syncbar').innerText()).slice(0,140));
 check('balance',await page.getByText(/Баланс: 1700/).count()>0);
 const myday=page.getByRole('region',{name:'Мой день'});
 check('smart daily planner exists',await myday.count()===1);
 check('three day modes and auto',await myday.getByRole('button',{name:/Утро/}).count()===1&&await myday.getByRole('button',{name:/После школы/}).count()===1&&await myday.getByRole('button',{name:/Вечер/}).count()===1);
 await myday.getByRole('button',{name:/Утро/}).click();
 check('morning reflects real Spanish subjects',await myday.getByText('Matemáticas',{exact:false}).count()>0||await myday.getByText(/Hoy no hay clases/).count()>0);
 await myday.getByRole('button',{name:/Вечер/}).click();
 check('evening includes tomorrow backpack',await myday.getByText(/Собери рюкзак на следующий день/).count()>0);
 await myday.getByRole('button',{name:'Авто'}).click();
 check('seven-day squirrel quest visible',await page.getByRole('region',{name:'История белочки на семь дней'}).count()>0);

 await page.getByRole('button',{name:/Дела/}).last().click();
 check('assigned task',await page.getByText('Сделать уроки').count()>0);
 check('weekly overview from server',await page.getByText('Семейный отчёт за семь дней').count()>0||await page.getByText('Моя неделя').count()>0);
 check('unassigned hidden',await page.getByText('Без исполнителя').count()===0);
 if(role==='child'){
  check('proposal',await page.getByRole('heading',{name:/Предложить задание/}).count()>0);
  await page.getByPlaceholder('Например, помочь приготовить ужин').fill('Помыть велосипед');
  await page.getByRole('button',{name:'Отправить родителю'}).click();await page.waitForTimeout(180);
  check('propose RPC',counters.rpc.some(x=>x.name==='propose_child_task'));
  await page.getByRole('button',{name:'Готово'}).first().click();await page.waitForTimeout(450);
  check('submit RPC',counters.rpc.some(x=>x.name==='submit_daily_chore'||x.name==='submit_task'));
  await page.getByRole('button',{name:/Мир/}).last().click();
  const advance=page.getByRole('button',{name:'🌳 Открыть второй мир'});
  check('advance button',await advance.count()>0);
  if(await advance.count()){
   await advance.click();await page.waitForTimeout(450);
   check('advance persisted',counters.rpc.some(x=>x.name==='advance_my_world'));
   check('world2 available',await page.getByRole('button',{name:/Домик на дереве/}).isEnabled());
   check('living island event',await page.getByRole('region',{name:'Приключение острова и семейный альбом'}).count()>0);
   const story=page.getByRole('region',{name:'История белочки на семь дней'});
   check('7 story chapters',await story.locator('.island-story-days button').count()===7);
   await story.getByRole('button',{name:'🧺 Корзинка'}).click();
   await story.getByRole('button',{name:'Продолжить историю'}).click();await page.waitForTimeout(220);
   check('first story chapter persisted',storyDone.includes(1)&&counters.rpc.some(x=>x.name==='moymir_complete_story_chapter'));
   check('story completion indicator',await story.locator('.island-story-days button.done').count()>0);

   const tokens=page.locator('.island-moments-grid button');
   const texts=await tokens.allTextContents();
   const target=texts.includes('🌰')?'🌰':texts.includes('⭐')?'⭐':'🔵';
   const ids=texts.map((x,i)=>x===target?i:-1).filter(i=>i>=0);
   check('three collectible island targets',ids.length===3);
   for(const i of ids)await tokens.nth(i).click();
   await page.getByRole('button',{name:'Сохранить памятный значок'}).click();await page.waitForTimeout(180);
   check('island memory saved via protected RPC',counters.rpc.some(x=>x.name==='moymir_collect_island_memory'));

  }
 }else{
  check('create task',await page.getByRole('heading',{name:/Добавить задание/}).count()>0);
  await page.getByPlaceholder('Название задания').fill('Помочь вымыть велосипед');
  await page.getByRole('button',{name:'Создать задание'}).click();await page.waitForTimeout(180);
  check('create task RPC',counters.rpc.some(x=>x.name==='create_family_task'));
  check('daily editor',await page.getByText(/Управление ежедневными заданиями/).count()>0);
  await page.getByText(/Управление ежедневными заданиями/).click();
  const create=page.getByPlaceholder('Например, почистить зубы вечером');await create.fill('Вынести мусор');
  await page.getByRole('button',{name:'Добавить ежедневное дело'}).click();await page.waitForTimeout(300);
  check('create daily RPC',counters.rpc.some(x=>x.name==='create_daily_chore'));
  await page.getByRole('button',{name:'Изменить'}).first().click();
  check('daily task editor',await page.locator('.mw-inline-editor').count()>0);
  await page.locator('.mw-inline-editor').first().getByRole('button',{name:'Сохранить изменения'}).click();await page.waitForTimeout(160);
  check('daily task update protected RPC',counters.rpc.some(x=>x.name==='manage_daily_chore'));

  check('discipline',await page.getByText('Дисциплинарные меры').count()>0);
  await page.getByRole('button',{name:/Мир/}).last().click();
  check('parent sees family quest',await page.getByText('Семейное приключение').count()>0);
 }
 await page.getByRole('button',{name:/Учёба/}).last().click();
 check('school tab',await page.getByRole('heading',{name:'Учёба'}).count()>0);
 check('school lesson',await page.getByText('Matemáticas',{exact:true}).count()>0);
 check('school cached for offline reopening',await page.evaluate(([f,c,u])=>{try{const x=JSON.parse(localStorage.getItem(`moymir31-school:${f}:${c}:${u}`)||'null');return x?.lessons?.length===30&&Array.isArray(x?.homework)}catch{return false}},[ids.family,ids.child,uid]));
 check('Spanish timetable heading',await page.getByRole('heading',{name:/Horario escolar/}).count()>0);
 check('weekdays shown in Spanish',await page.getByRole('button',{name:'Lun',exact:true}).count()===1&&await page.getByRole('button',{name:'Mié',exact:true}).count()===1);
 await page.getByRole('button',{name:'Lun',exact:true}).click();
 check('Monday six classes',await page.getByText('Lunes · 6 clases').count()>0);
 check('recess between classes',await page.getByText('12:00–12:30').count()>0);
 await page.getByRole('button',{name:'Vie',exact:true}).click();
 check('Friday ends with robotics',await page.getByText('Computación y Robótica',{exact:true}).count()>0);
 await page.getByRole('button',{name:'Lun',exact:true}).click();
 check('homework card',await page.getByText('Повторить дроби').count()>0);
 check('ask Miro',await page.getByRole('button',{name:/Миро/}).count()>0);
 check('backpack panel appears',await page.getByRole('region',{name:'Рюкзак на следующий учебный день'}).count()>0);
 if(role==='child'){await page.getByRole('button',{name:'Открыть Миро и спросить об уроках'}).click();await page.waitForTimeout(480);check('Miro opens from school tab',await page.getByRole('dialog',{name:/Миро/}).count()>0);check('study prompt filled',await page.getByRole('textbox',{name:'Вопрос Миро'}).inputValue().then(x=>x.includes('домашними заданиями')));const offlineRequests=[];page.on('request',r=>{if(r.url().includes('moymir2-miro-ai'))offlineRequests.push(r.url())});await page.getByRole('textbox',{name:'Вопрос Миро'}).fill('Что взять в рюкзак?');await page.getByRole('button',{name:'➤'}).click();await page.waitForTimeout(160);check('Miro local guidance without API',await page.getByText(/Следующий учебный день:/).count()>0&&offlineRequests.length===0);await page.getByRole('button',{name:'Уменьшить Миро'}).click();await page.getByRole('button',{name:/Учёба/}).last().click()}

 if(role==='parent'){
   await page.getByPlaceholder('Предмет, например: Matemáticas').fill('Español');
   await page.getByRole('button',{name:'Сохранить урок'}).click();await page.waitForTimeout(150);
   check('lesson saved through REST',counters.restWrites.some(x=>x.name==='moymir_school_lessons'));
   await page.getByPlaceholder('Например, тетрадь по математике').fill('Транспортир');
   await page.getByRole('button',{name:'Добавить принадлежность'}).click();await page.waitForTimeout(140);
   check('parent saves backpack items',counters.restWrites.some(x=>x.name==='moymir_backpack_items'));

   await page.getByPlaceholder('Предмет',{exact:true}).fill('Biología');
   await page.getByPlaceholder('Что нужно выполнить: параграф, упражнения, страницы').fill('Повторить клетки');
   await page.getByRole('button',{name:'Сохранить домашнее задание'}).click();await page.waitForTimeout(140);
   check('homework saved through REST',counters.restWrites.some(x=>x.name==='moymir_school_homework'));
   await page.getByRole('button',{name:'Настроить'}).click();
   await page.getByRole('button',{name:'Сохранить время напоминаний'}).click();await page.waitForTimeout(150);
   check('reminder settings saved',counters.restWrites.some(x=>x.name==='moymir_school_preferences'));
 }else{
   await page.getByRole('button',{name:'✓ Готово'}).click();await page.waitForTimeout(160);
   check('child may mark homework through RPC',counters.rpc.some(x=>x.name==='moymir_mark_homework'));
   await page.getByRole('button',{name:'Следующий учебный день'}).click();
   const bag=page.locator('.backpack-item input[type=checkbox]');
   if(await bag.count()){await bag.first().check();await page.waitForTimeout(160)}
   check('child checks backpack via protected RPC',counters.rpc.some(x=>x.name==='moymir_check_backpack'));

 }
 await page.getByRole('button',{name:/Магазин/}).last().click();check('same rewards',await page.getByText('Семейное кино').count()>0);
 const playbank=page.getByRole('region',{name:'Копилка игрового времени'});
 check('playtime wallet accessible',await playbank.count()===1);
 if(role==='parent'){
  await playbank.getByRole('button',{name:/Добавить 20 минут/}).click();await page.waitForTimeout(200);
  check('parent grants minutes with protected RPC',counters.rpc.some(x=>x.name==='moymir_playtime_grant'));
  check('parent sees pending request',await playbank.getByText(/Запрос от Ильи: 10 минут/).count()>0);
  await playbank.getByRole('button',{name:'✓ Разрешить'}).click();await page.waitForTimeout(220);
  check('parent approves session',counters.rpc.some(x=>x.name==='moymir_playtime_review'));
  await page.getByRole('button',{name:/Дела/}).last().click();
  const journal=page.getByText('📋 Журнал семейных достижений и решений');await journal.click();await page.waitForTimeout(260);
  check('parent sees secure activity journal',counters.rpc.some(x=>x.name==='moymir_parent_activity_feed')&&await page.getByText('🧹 Ежедневное дело').count()>0);
  await page.getByRole('button',{name:/Магазин/}).last().click();
 }else{
  check('initial time bank balance',await playbank.getByText('60 мин').count()>0);
  await playbank.getByRole('button',{name:'Попросить 20 минут'}).click();await page.waitForTimeout(220);
  check('child requests time with protected RPC',counters.rpc.some(x=>x.name==='moymir_playtime_request'));
  check('child waits for approval',await playbank.getByText(/Ждём решения родителя/).count()>0);
  // A simulated parent approves the request between browser refreshes.
  playSessions=playSessions.map(x=>({...x,status:'approved'}));
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.waitForTimeout(370);
  check('child sees approval',await playbank.getByRole('button',{name:/Начать 20 минут/}).count()>0);
  await playbank.getByRole('button',{name:/Начать 20 минут/}).click();await page.waitForTimeout(330);
  check('server-backed timer started',counters.rpc.some(x=>x.name==='moymir_playtime_start')&&await playbank.getByRole('timer').count()>0);
  await playbank.getByRole('button',{name:'Завершить сеанс'}).click();await page.waitForTimeout(250);
  check('timer finished without bonus points',counters.rpc.some(x=>x.name==='moymir_playtime_finish'));

 }

 if(role==='parent'){check('inactive reward visible to parent',await page.getByText('Неактивная награда').count()>0);await page.getByRole('button',{name:'✎ Изменить награду'}).first().click();check('reward editor',await page.getByRole('button',{name:'Сохранить награду'}).count()>0);await page.getByRole('button',{name:'Сохранить награду'}).click();await page.waitForTimeout(170);check('manage reward protected RPC',counters.rpc.some(x=>x.name==='manage_reward'))}else check('inactive reward hidden from child',await page.getByText('Неактивная награда').count()===0);

 if(role==='child'){await page.getByRole('button',{name:'Заказать'}).first().click();await page.waitForTimeout(180);check('reward request RPC',counters.rpc.some(x=>x.name==='request_reward'))}
 await page.getByRole('button',{name:/Духовный рост/}).last().click();
 check('spiritual tab',await page.getByText('Библейские занятия').count()>0);
 check('weekly growth focus',await page.getByRole('region',{name:'Качество недели'}).count()>0);
 const growth=page.getByRole('region',{name:'Качество недели'});
 check('all 7 qualities selectable for preview',await growth.locator('.growth-options button').count()===7);
 check('no quality preselected',await growth.locator('.growth-options button[aria-pressed=true]').count()===0);
 if(role==='child'){
  await growth.getByRole('button',{name:/Доброта/}).click();
  check('kindness preview works',await growth.getByText(/Забота, выраженная в поступках/).count()>0);
  await growth.getByRole('button',{name:/Терпение/}).click();
  check('child changes preview to patience',await growth.getByText(/Не торопить людей/).count()>0);
  await growth.getByRole('button',{name:/Честность/}).click();
  await growth.getByRole('button',{name:/Выбрать «Честность» на эту неделю/}).click();
  await page.waitForTimeout(250);
  check('choice saved through family-checked RPC',growthChoice==='honesty'&&counters.rpc.some(x=>x.name==='moymir_choose_weekly_quality'));
  check('seven day task buttons',await growth.locator('.growth-day-nav button').count()===7);
  check('daily task has Bible reference',await growth.locator('.growth-principle').innerText().then(x=>x.includes('Псалом')||x.includes('Эфесянам')||x.includes('Луки')||x.includes('Матфея')));
  const currentDate=await growth.locator('.growth-daily-challenge .growth-day-heading').innerText();
  const otherDay=(new Date(dateToday+'T12:00:00Z').getUTCDay()+6)%7===0?1:0;
  await growth.locator('.growth-day-nav button').nth(otherDay).click();
  check('cannot mark future or past day',await growth.getByRole('button',{name:/Я выполнил задание/}).count()===0);
  const todayIndex=(new Date(dateToday+'T12:00:00Z').getUTCDay()+6)%7;
  await growth.locator('.growth-day-nav button').nth(todayIndex).click();
  await growth.getByRole('button',{name:/Я выполнил задание/}).click();await page.waitForTimeout(350);
  check('20 spiritual points via protected RPC',growthAward===20&&counters.rpc.filter(x=>x.name==='moymir_complete_growth_day').length===1);
  check('growth record awarded once',await growth.getByText(/Задание выполнено · \+20 баллов духовного роста/).count()>0);
  check('done button disappears',await growth.getByRole('button',{name:/Я выполнил задание/}).count()===0);
  check('same week locked after completion',await growth.getByRole('button',{name:/Доброта/}).isDisabled());
  check('ordinary coins unchanged by virtue task',await page.locator('.mw-wallet').count()===0 || await page.getByText(/Баланс: 1700/).count()>0);
 }else{
  await growth.getByRole('button',{name:/Сочувствие/}).click();
  check('parent can preview empathy',await growth.getByText(/Понимать чувства и нужды/).count()>0);
  check('parent cannot award/choose for child',await growth.getByRole('button',{name:/Выбрать «/}).count()===0);
 }

 check('offline scripture reader',await page.getByRole('region',{name:'Календарь ежедневных библейских текстов'}).count()>0);
 if(role==='parent'){
  const picker=page.getByRole('textbox',{name:'Выбрать EPUB или ZIP с ежедневными текстами'});
  const archive=await syntheticArchive();
  await page.locator('input[type=file][accept*=".epub"]').setInputFiles({name:'MOY_MIR_daily_texts_2026_2027.zip',mimeType:'application/zip',buffer:archive});
  await page.waitForTimeout(700);
  check('book import private storage',privateDaily.size===2,'files='+privateDaily.size);
  check('text in calendar after import',await page.getByText('СИНТЕТИЧЕСКИЙ ТЕКСТ '+dateToday).count()>0);
  const input=page.getByRole('textbox',{name:'Выбрать дату ежедневного текста'});await input.fill('2027-11-08');
  check('2027 calendar lookup',await page.getByText('СИНТЕТИЧЕСКИЙ ТЕКСТ 2027-11-08').count()>0);
  const originalEpub=await syntheticEpub();
  await page.locator('input[type=file][accept*=".epub"]').setInputFiles({name:'es26_U.epub',mimeType:'application/epub+zip',buffer:originalEpub});
  await page.waitForTimeout(600);
  await input.fill(dateToday);
  check('original EPUB calendar parser',await page.getByText('СИНТЕТИЧЕСКИЙ ТЕКСТ '+dateToday).count()>0);

 }else{
  await page.waitForTimeout(1800);
  check('child downloads private scripture library',await page.getByText('СИНТЕТИЧЕСКИЙ ТЕКСТ '+dateToday).count()>0);
  check('offline scripture date picker',await page.getByRole('textbox',{name:'Выбрать дату ежедневного текста'}).count()>0);
  await page.locator('.daily-content').scrollIntoViewIfNeeded();
  await page.locator('.daily-content').click({position:{x:20,y:35}});
  await page.waitForTimeout(1600);
  const partial=await page.evaluate(([u,d])=>JSON.parse(localStorage.getItem(`moymir-read-v1:${u}:${d}`)||'null'),[uid,dateToday]);
  check('reading timer records real active time',!!partial&&partial.seconds>=1,JSON.stringify(partial));
  check('daily completion disabled before reading',await page.locator('.daily-finish-reading').isDisabled());
  check('old one-click action removed',await page.locator('.mw-chore').filter({hasText:'Прочитать ежедневный стих'}).getByRole('button',{name:'Отметить'}).count()===0);
  check('family identity cached for offline use',await page.evaluate(uid=>!!localStorage.getItem('moymir-family-offline-'+uid),uid));
  await page.context().setOffline(true);
  await page.locator('.mw-cloud-syncbar button').first().click();
  await page.waitForTimeout(900);
  check('daily text remains readable offline',await page.getByText('СИНТЕТИЧЕСКИЙ ТЕКСТ '+dateToday).count()>0);
  await page.context().setOffline(false);
  await page.evaluate(([u,d])=>localStorage.setItem(`moymir-read-v1:${u}:${d}`,JSON.stringify({seconds:60,depth:1,interactions:4})),[uid,dateToday]);
  await page.getByRole('button',{name:/Учёба/}).last().click();
  await page.getByRole('button',{name:/Духовный рост/}).last().click();
  await page.waitForTimeout(400);
  check('resume reading unlocks completion',await page.locator('.daily-finish-reading').isEnabled());
  await page.locator('.daily-finish-reading').click();await page.getByText(/Сегодня прочитано · \+10/).waitFor({state:'visible',timeout:6000});

  check('protected server award only once',counters.rpc.filter(x=>x.name==='finish_daily_text_reading').length===1);
  check('ten spiritual points awarded',spiritualAward===10);
  check('completed reward displayed',await page.getByText(/Сегодня прочитано · \+10/).count()>0);
  check('claim button removed after award',await page.locator('.daily-finish-reading').count()===0);
  check('coins unchanged',await page.locator('.mw-coin').innerText().then(x=>x.includes('1700')));


 }

 await page.getByRole('button',{name:/Семья/}).last().click();check('real chat',await page.locator('.family-chat').count()===1);
 const field=page.getByRole('textbox',{name:'Сообщение семье'});
 check('composer present',await field.count()===1);
 const metric=await field.evaluate(el=>{const r=el.getBoundingClientRect(),shell=document.querySelector('.mw-phone')?.getBoundingClientRect(),nav=document.querySelector('.mw-bottom')?.getBoundingClientRect();return {top:r.top,bottom:r.bottom,navTop:nav?.top,shellBottom:shell?.bottom,height:r.height}});
 check('composer visible above tab bar',metric.top>=0&&metric.bottom<=(metric.navTop??0)+1&&metric.height>=38,JSON.stringify(metric));
 await page.setViewportSize({width:390,height:490});await page.waitForTimeout(110);
 const compact=await field.evaluate(el=>{const r=el.getBoundingClientRect(),nav=document.querySelector('.mw-bottom')?.getBoundingClientRect();return {top:r.top,bottom:r.bottom,navTop:nav?.top,height:r.height}});
 check('composer visible with mobile keyboard',compact.top>=0&&compact.bottom<=(compact.navTop??0)+1&&compact.height>=38,JSON.stringify(compact));
 await field.focus();await page.waitForTimeout(80);
 const focused=await field.evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom}});
 check('composer stays visible on focus',focused.top>=0&&focused.bottom<=490,JSON.stringify(focused));


 const chatInput=page.getByRole('textbox',{name:'Сообщение семье'});await chatInput.fill('Синтетическое тестовое сообщение');await page.getByRole('button',{name:'Отправить сообщение'}).click();await page.waitForTimeout(180);check('real chat send',counters.restPosts.includes('family_chat_messages'));
 await page.getByRole('button',{name:'Открыть настройки'}).click();
 const alarm=page.locator('.miro-alarm-panel');
 check('Miro wakeup settings visible',await alarm.count()===1);
 check('alarm only has web preview in browser',await alarm.getByText(/В браузере доступен только предпросмотр/).count()===1);
 check('Miro alarm original tracks',await alarm.locator('select').last().locator('option').count()===3);
 check('alarm scheduling disabled without Android module',await alarm.getByRole('button',{name:'Сохранить будильник'}).isDisabled());
 check('alarm time controls owned by parent',role==='parent'?await alarm.locator('input[type=time]').isEnabled():await alarm.locator('input[type=time]').isDisabled());
 await alarm.getByRole('button',{name:/Посмотреть и послушать/}).click();
 check('Miro animation opened',await alarm.locator('.miro-alarm-avatar.waking').count()===1);
 check('awake and snooze controls exist',await alarm.getByRole('button',{name:/Я проснулся!/}).count()===1&&await alarm.getByRole('button',{name:/Ещё 5 мин/}).count()===1);
 await alarm.getByRole('button',{name:/Я проснулся!/}).click();
 check('awake greeting displayed',await alarm.getByText(/Новый день начался/).count()===1);
 check('original music picker',await page.getByRole('combobox',{name:'Выбрать фоновую мелодию'}).count()>0);
 check('music volume control',await page.getByRole('slider',{name:'Громкость фоновой музыки'}).count()>0);
 if(role==='parent'){
  const mediaRequests=[];page.on('request',req=>{if(req.url().includes('/music/'))mediaRequests.push(req.url())});
  await page.getByRole('button',{name:/Включить фоновую музыку/}).click();await page.waitForTimeout(550);
  check('melodic MP3 instead of droning oscillator',mediaRequests.some(x=>x.includes('/music/meadow.mp3')),JSON.stringify(mediaRequests));
  await page.getByRole('combobox',{name:'Выбрать фоновую мелодию'}).selectOption('treehouse');await page.waitForTimeout(340);
  check('treehouse soundtrack requested',mediaRequests.some(x=>x.includes('/music/treehouse.mp3')));
  await page.getByRole('combobox',{name:'Выбрать фоновую мелодию'}).selectOption('reading');await page.waitForTimeout(340);
  check('reading soundtrack requested',mediaRequests.some(x=>x.includes('/music/reading.mp3')));
  check('music setting retained',await page.evaluate(()=>localStorage.getItem('moymir28-bg-music')==='true'));
  await page.getByRole('button',{name:/Выключить настоящую музыку/}).click();
  check('music off',await page.evaluate(()=>localStorage.getItem('moymir28-bg-music')==='false'));
 }
 check('single-row six bottom tabs',await page.locator('.mw-bottom button').count()===6);
 check('no JS exceptions',counters.errors.length===0,counters.errors.join(' | '));
 await page.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-'+role+'-2.8.png'});
 }catch(e){console.log('TEST_EXCEPTION',role,e.message.slice(0,650));failures++}
 await ctx.close();
}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_PATH||'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',args:['--enable-unsafe-swiftshader']});await run('parent',browser);await run('child',browser);await browser.close();console.log('TOTAL_FAILS',failures);process.exitCode=failures?1:0})().catch(e=>{console.error(e);process.exit(1)})
