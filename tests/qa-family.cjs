const {chromium}=require('playwright-core');
const BASE=process.env.QA_BASE_URL||'http://127.0.0.1:5248/';
const ids={parent:'11111111-1111-4111-8111-111111111111',child:'22222222-2222-4222-8222-222222222222',family:'33333333-3333-4333-8333-333333333333',task:'44444444-4444-4444-8444-444444444444',daily:'55555555-5555-4555-8555-555555555555',reward:'66666666-6666-4666-8666-666666666666'};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function makeJWT(id){const payload=Buffer.from(JSON.stringify({sub:id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+7200})).toString('base64url');return 'eyJhbGciOiJIUzI1NiJ9.'+payload+'.synthetic'}
let failures=0;
async function run(role,browser){
 const ctx=await browser.newContext({viewport:{width:role==='child'?390:430,height:860}});
 const uid=ids[role], session={access_token:makeJWT(uid),refresh_token:'fake-refresh',token_type:'bearer',expires_in:7200,expires_at:Math.floor(Date.now()/1000)+7200,user:{id:uid,aud:'authenticated',email:role+'@example.test',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()}};
 await ctx.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:'sb-ueqtitxbvsnqmbudwxwu-auth-token',session});
 const counters={rpc:[],restPosts:[],errors:[]}; let world=1;
 await ctx.route('https://ueqtitxbvsnqmbudwxwu.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url()), name=url.pathname.split('/').pop(),method=request.method();
  const resp=(data,object=false)=>route.fulfill({status:200,contentType:object?'application/vnd.pgrst.object+json':'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
  if(url.pathname.includes('/auth/v1/'))return resp({user:session.user});
  if(url.pathname.includes('/rest/v1/rpc/')){counters.rpc.push({name,body:request.postDataJSON()});if(name==='advance_my_world')world=2;return resp(name==='advance_my_world'?2:name==='report_child_app_open'?false:'ok')}
  if(!url.pathname.includes('/rest/v1/'))return resp({});
  if(method==='POST'&&name==='family_chat_messages'){counters.restPosts.push(name);return resp([])}
  let data=[];
  switch(name){
   case 'family_members': data=url.searchParams.get('role')==='eq.child'?[{user_id:ids.child}]:url.searchParams.has('user_id')?{family_id:ids.family,role}:[{user_id:ids.parent,role:'parent'},{user_id:ids.child,role:'child'}];break;
   case 'point_ledger': data=[{child_id:ids.child,delta:1700}];break;
   case 'daily_chore_templates': data=[{id:ids.daily,title:'Заправить кровать',points:5,icon:'🛏️',active:true,weekdays:[0,1,2,3,4,5,6]}];break;
   case 'daily_chore_completions':data=[];break;
   case 'tasks':data=[{id:ids.task,title:'Сделать уроки',points:20,assigned_child:ids.child},{id:'77777777-7777-4777-8777-777777777777',title:'Без исполнителя',points:10,assigned_child:null}];break;
   case 'task_submissions':data=[];break;
   case 'rewards':data=[{id:ids.reward,title:'Семейное кино',cost:80,active:true}];break;
   case 'reward_requests':data=[];break;
   case 'behavior_points':data=[];break;
   case 'spiritual_activity_records':data=[];break;
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
 await page.getByRole('button',{name:/Магазин/}).last().click();check('same rewards',await page.getByText('Семейное кино').count()>0);
 if(role==='child'){await page.getByRole('button',{name:'Заказать'}).first().click();await page.waitForTimeout(180);check('reward request RPC',counters.rpc.some(x=>x.name==='request_reward'))}
 await page.getByRole('button',{name:/Духовный рост/}).last().click();check('spiritual tab',await page.getByText('Библейские занятия').count()>0);
 await page.getByRole('button',{name:/Семья/}).last().click();check('real chat',await page.locator('.family-chat').count()===1);
 const chatInput=page.getByRole('textbox',{name:'Сообщение семье'});await chatInput.fill('Синтетическое тестовое сообщение');await page.getByRole('button',{name:'Отправить сообщение'}).click();await page.waitForTimeout(180);check('real chat send',counters.restPosts.includes('family_chat_messages'));
 check('no JS exceptions',counters.errors.length===0,counters.errors.join(' | '));
 await page.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-'+role+'-2.8.png'});
 }catch(e){console.log('TEST_EXCEPTION',role,e.message.slice(0,650));failures++}
 await ctx.close();
}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_PATH||'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',args:['--enable-unsafe-swiftshader']});await run('child',browser);await run('parent',browser);await browser.close();console.log('TOTAL_FAILS',failures);process.exitCode=failures?1:0})().catch(e=>{console.error(e);process.exit(1)})
