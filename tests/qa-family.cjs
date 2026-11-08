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
async function run(role,browser){
 const ctx=await browser.newContext({viewport:{width:role==='child'?390:430,height:860}});
 const uid=ids[role], session={access_token:makeJWT(uid),refresh_token:'fake-refresh',token_type:'bearer',expires_in:7200,expires_at:Math.floor(Date.now()/1000)+7200,user:{id:uid,aud:'authenticated',email:role+'@example.test',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()}};
 await ctx.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:'sb-ueqtitxbvsnqmbudwxwu-auth-token',session});
 const counters={rpc:[],restPosts:[],restWrites:[],errors:[]}; let world=1;let spiritualAward=0;
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
  if(url.pathname.includes('/rest/v1/rpc/')){counters.rpc.push({name,body:request.postDataJSON()});if(name==='advance_my_world')world=2;if(name==='finish_daily_text_reading'){spiritualAward=10;return resp(10)}return resp(name==='advance_my_world'?2:name==='report_child_app_open'?false:'ok')}
  if(!url.pathname.includes('/rest/v1/'))return resp({});
  if(method==='POST'&&name==='family_chat_messages'){counters.restPosts.push(name);return resp([])}
  if(['moymir_school_lessons','moymir_school_homework','moymir_school_preferences'].includes(name)&&['POST','PATCH','DELETE'].includes(method)){counters.restWrites.push({name,method});return resp([])}
  let data=[];
  switch(name){
   case 'moymir_school_lessons':data=[{id:'a1111111-1111-4111-8111-111111111111',family_id:ids.family,child_id:ids.child,weekday:new Date(today+'T12:00:00').getDay(),lesson_order:1,subject:'Matemáticas',starts_at:'08:30:00',notes:''}];break;
   case 'moymir_school_homework':data=[{id:'a2222222-2222-4222-8222-222222222222',family_id:ids.family,child_id:ids.child,subject:'Matemáticas',description:'Повторить дроби',due_date:today,completed_at:null}];break;
   case 'moymir_school_preferences':data={school_enabled:false,school_remind_at:'07:30:00',homework_enabled:false,homework_remind_at:'18:30:00',verse_enabled:false,verse_remind_at:'08:00:00'};break;
   case 'family_members': data=url.searchParams.get('role')==='eq.child'?[{user_id:ids.child}]:url.searchParams.has('user_id')?{family_id:ids.family,role}:[{user_id:ids.parent,role:'parent'},{user_id:ids.child,role:'child'}];break;
   case 'point_ledger': data=[{child_id:ids.child,delta:1700}];break;
   case 'daily_chore_templates': data=[{id:ids.daily,title:'Заправить кровать',points:5,icon:'🛏️',active:true,weekdays:[0,1,2,3,4,5,6]}];break;
   case 'daily_chore_completions':data=[];break;
   case 'tasks':data=[{id:ids.task,title:'Сделать уроки',points:20,assigned_child:ids.child},{id:'77777777-7777-4777-8777-777777777777',title:'Без исполнителя',points:10,assigned_child:null}];break;
   case 'task_submissions':data=[];break;
   case 'rewards':data=[{id:ids.reward,title:'Семейное кино',cost:80,active:true}];break;
   case 'reward_requests':data=[];break;
   case 'behavior_points':data=[];break;
   case 'spiritual_activity_records':data=spiritualAward?[{id:'a4444444-4444-4444-8444-444444444444',activity_date:dateToday,step_id:'daily-text',points:10}]:[];break;
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
 await page.getByRole('button',{name:/Дела/}).last().click();
 check('assigned task',await page.getByText('Сделать уроки').count()>0);
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
  check('discipline',await page.getByText('Дисциплинарные меры').count()>0);
 }
 await page.getByRole('button',{name:/Учёба/}).last().click();
 check('school tab',await page.getByRole('heading',{name:'Учёба'}).count()>0);
 check('school lesson',await page.getByText('Matemáticas',{exact:true}).count()>0);
 check('homework card',await page.getByText('Повторить дроби').count()>0);
 check('ask Miro',await page.getByRole('button',{name:/Миро/}).count()>0);
 if(role==='child'){await page.getByRole('button',{name:'Открыть Миро и спросить об уроках'}).click();await page.waitForTimeout(480);check('Miro opens from school tab',await page.getByRole('dialog',{name:/Миро/}).count()>0);check('study prompt filled',await page.getByRole('textbox',{name:'Вопрос Миро'}).inputValue().then(x=>x.includes('домашними заданиями')));await page.getByRole('button',{name:'Уменьшить Миро'}).click();await page.getByRole('button',{name:/Учёба/}).last().click()}

 if(role==='parent'){
   await page.getByPlaceholder('Предмет, например: Matemáticas').fill('Español');
   await page.getByRole('button',{name:'Сохранить урок'}).click();await page.waitForTimeout(150);
   check('lesson saved through REST',counters.restWrites.some(x=>x.name==='moymir_school_lessons'));
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
 }
 await page.getByRole('button',{name:/Магазин/}).last().click();check('same rewards',await page.getByText('Семейное кино').count()>0);
 if(role==='child'){await page.getByRole('button',{name:'Заказать'}).first().click();await page.waitForTimeout(180);check('reward request RPC',counters.rpc.some(x=>x.name==='request_reward'))}
 await page.getByRole('button',{name:/Духовный рост/}).last().click();
 check('spiritual tab',await page.getByText('Библейские занятия').count()>0);
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
 check('no JS exceptions',counters.errors.length===0,counters.errors.join(' | '));
 await page.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-'+role+'-2.8.png'});
 }catch(e){console.log('TEST_EXCEPTION',role,e.message.slice(0,650));failures++}
 await ctx.close();
}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_PATH||'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',args:['--enable-unsafe-swiftshader']});await run('parent',browser);await run('child',browser);await browser.close();console.log('TOTAL_FAILS',failures);process.exitCode=failures?1:0})().catch(e=>{console.error(e);process.exit(1)})
