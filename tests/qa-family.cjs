const {chromium}=require('playwright-core');
const JSZip=require('jszip');
const {PerspectiveCamera,Vector3}=require('three');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {buildSync}=require('esbuild');
const lessonTmp=fs.mkdtempSync(path.join(os.tmpdir(),'moymir43-test-'));
const lessonFile=path.join(lessonTmp,'lessons.cjs');
fs.writeFileSync(lessonFile,buildSync({entryPoints:[path.resolve(__dirname,'../src/english/lessons.ts')],bundle:true,format:'cjs',platform:'node',write:false}).outputFiles[0].contents);
const {LESSONS:ENGLISH_LESSONS,shuffledEnglishChoices}=require(lessonFile);
fs.rmSync(lessonTmp,{recursive:true,force:true});
const BASE=process.env.QA_BASE_URL||'http://127.0.0.1:5248/';
const ids={parent:'11111111-1111-4111-8111-111111111111',child:'22222222-2222-4222-8222-222222222222',family:'33333333-3333-4333-8333-333333333333',task:'44444444-4444-4444-8444-444444444444',daily:'55555555-5555-4555-8555-555555555555',reward:'66666666-6666-4666-8666-666666666666'};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function makeJWT(id){const payload=Buffer.from(JSON.stringify({sub:id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+7200})).toString('base64url');return 'eyJhbGciOiJIUzI1NiJ9.'+payload+'.synthetic'}
let failures=0;
const approvalQA=process.env.QA_FOCUS==='parent-approvals';
const worldInspectQA=process.env.QA_FOCUS==='world-inspect';
const worldMilestoneQA=process.env.QA_FOCUS==='world-milestone';
const threeWorldQA=process.env.QA_FOCUS==='three-worlds';
const remoteWakeQA=process.env.QA_FOCUS==='remote-wake';
const livingWorldQA=process.env.QA_FOCUS==='living-world';
const adventureQA=process.env.QA_FOCUS==='adventure';
const miroQA=process.env.QA_FOCUS==='miro2';
let wakeState=null;const wakeId='c1234567-1111-4111-8111-123456789012';
const worldDecorQA=process.env.QA_FOCUS==='world-decor';
const worldConflictQA=process.env.QA_FOCUS==='world-conflict';
const englishTutorQA=process.env.QA_FOCUS==='english-tutor';
const englishResetAudioQA=process.env.QA_FOCUS==='english-reset-audio';
const playstationGiftQA=process.env.QA_FOCUS==='playstation-gift';
const taskManagementQA=process.env.QA_FOCUS==='task-management';
const pioneerMobileQA=process.env.QA_FOCUS==='pioneer-mobile';
const subjectTutorQA=process.env.QA_FOCUS==='subject-tutors';
const practiceQA=process.env.QA_FOCUS==='subject-practice';
const qaDaily='a1100000-0000-4000-8000-000000000001';
const qaTask='a1100000-0000-4000-8000-000000000002';
const qaNotice='a1100000-0000-4000-8000-000000000003';
const qaReward='a1100000-0000-4000-8000-000000000004';
const qaYesterday=new Date(Date.parse(today+'T12:00:00Z')-86400000).toISOString().slice(0,10);
let growthMeasurements=[];let growthSerial=0;
let healthPlan=null,healthDaily=[],healthGarden=null,healthRequestSeq=1;
let healthRequests=[{id:'d9999999-9999-4999-8999-000000000001',family_id:ids.family,child_id:ids.child,
 weekday:0,meal_kind:'lunch',suggestion:'Чечевица с морковью и хлебом',
 status:'pending',created_at:'2026-11-09T07:00:00Z'}];

const privateDaily=new Map();
const decorCloud=new Map();
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
 const ctx=await browser.newContext({viewport:{width:role==='child'?390:430,height:860},hasTouch:process.env.QA_TOUCH==='1',isMobile:process.env.QA_TOUCH==='1'});
 const uid=ids[role], session={access_token:makeJWT(uid),refresh_token:'fake-refresh',token_type:'bearer',expires_in:7200,expires_at:Math.floor(Date.now()/1000)+7200,user:{id:uid,aud:'authenticated',email:role+'@example.test',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()}};
 await ctx.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:'sb-ueqtitxbvsnqmbudwxwu-auth-token',session});
 if(englishResetAudioQA){
  await ctx.addInitScript(()=>{
   window.__qaAudioStarted=0;window.__qaAudioDuration=0;window.__qaAudioSource='';
   const native=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(){
    this.addEventListener('playing',()=>{window.__qaAudioStarted++;window.__qaAudioDuration=this.duration;window.__qaAudioSource=this.src},{once:true});
    return native.call(this);
   };
  });
  const old='eeeeeeee-eeee-4eee-8eee-000000000077';
  await ctx.addInitScript(({key})=>localStorage.setItem(key,JSON.stringify({first:[0,...Array(29).fill(null)],last:[0,...Array(29).fill(null)],wrong:[1,...Array(29).fill(0)],mastered:Array(30).fill(false)})),{key:'moymir-english-draft:'+old});
 }
 if(worldConflictQA){
  decorCloud.set(ids.child+':1',{family_id:ids.family,child_id:ids.child,world_number:1,layout:{flowerpot:{x:.9,z:-1.45,rotation:90}}});
  await ctx.addInitScript(({key})=>localStorage.setItem(key,JSON.stringify({flowerpot:{x:-.5,z:1.15,rotation:45}})),{key:'moymir-world-decor-v1:'+encodeURIComponent(ids.child)+':w1'});
 }
 let geographyAttempts=[];
 let healthNetworkBlocked=false;
 let qaDailyStatus='pending';
 const counters={rpc:[],restPosts:[],restWrites:[],errors:[]}; let world=1;let spiritualAward=0;let backpackChecked=false;let growthChoice=null;let growthAward=0;let playBalance=60,playCap=30,storyDone=[];
 const giftRewardId='604c860d-2121-4abc-a2ad-af3385b2c882';
 const giftOrders=playstationGiftQA?(role==='parent'?
 [{id:'a1400000-0000-4000-8000-000000000001',reward_id:giftRewardId,cost_snapshot:60,requested_at:new Date().toISOString(),status:'pending',mystery_prize:null}]:
 [{id:'a1400000-0000-4000-8000-000000000002',reward_id:giftRewardId,cost_snapshot:60,requested_at:new Date(Date.now()-86400000).toISOString(),status:'pending',mystery_prize:null}]):[];
 let giftSeq=2;
 let playSessions=role==='parent'?[{id:'91111111-1111-4111-8111-111111111111',minutes:10,status:'pending',requested_at:new Date().toISOString(),started_at:null}]:[];
 let taskRows=taskManagementQA?[
  {id:ids.task,title:'Сделать уроки',points:20,assigned_child:ids.child,active:true},
  {id:'77777777-7777-4777-8777-777777777777',title:'Неиспользуемое дело',points:7,assigned_child:ids.child,active:false}
 ]:null;
 let taskSerial=0;let choreDecision=null;
 let dailyTemplates=taskManagementQA?[
  {id:ids.daily,title:'Заправить кровать',points:5,icon:'🛏️',active:true,weekdays:[0,1,2,3,4,5,6],penalty_enabled:true},
  {id:'e0000000-0000-4000-8000-000000000089',title:'Устаревшее ежедневное дело',points:8,icon:'🧹',active:false,weekdays:[0,1,2,3,4,5,6]}
 ]:null;
 let pioneerAttempts=0;
 let pioneerActive=null;
 let pioneerFailOnce=false;
 const pioneerFakeState=()=>({total:0,unlocked:1,awards:[],cycles:[],history:[],active:pioneerActive});
 let earnedMock=(threeWorldQA||livingWorldQA||miroQA||adventureQA)?1599:1700,englishCredit=0,englishSessionSerial=0;
 const {SUBJECTS,ALL_SUBJECT_LESSONS}=await import('../src/subjects/subjects.ts');
 const englishAnswers={diagnostic:[1,1,0,1,0,1,2,2,1,1,1,1,1,0,0,0,1,1], 'to-be':[1,0,2,1,0,1],'have-got':[1,2,0,2,0,1],'present-simple':[1,0,2,1,2,0],'present-continuous':[1,2,0,1,1,0],'there-is-are':[1,2,1,0,1,0],'past-simple':[1,0,1,2,0,1],'daily-words':[0,1,2,0,1,2],questions:[1,0,2,0,1,2]};
 for(const subjectLesson of ALL_SUBJECT_LESSONS)englishAnswers[subjectLesson.id]=subjectLesson.questions.map(q=>q.correct);
 for(const englishLesson of ENGLISH_LESSONS)englishAnswers[englishLesson.id]=englishLesson.questions.map(q=>q.correct);
 const {getPracticeBank,allPractice}=await import('../src/subjects/practiceBank.ts');
 let practiceNetworkFailures=practiceQA&&role==='child'?1:0;
 const practiceRows=practiceQA&&role==='parent'?[{id:'f4444444-1111-4111-8111-111111111111',family_id:ids.family,child_id:ids.child,subject:'matematicas',chapter:'enteros',level:'mixed',score:9,total:12,completed_at:new Date().toISOString(),attempted_ids:[],wrong_ids:[],duration_seconds:410}]:[];
 let englishSessions=role==='parent'?[{id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',family_id:ids.family,child_id:ids.child,lesson_key:'to-be',activity_day:today,started_at:new Date(Date.now()-920000).toISOString(),finished_at:new Date().toISOString(),status:'completed',score:5,total_questions:6,points_awarded:30,answers:[1,0,2,1,1,1]},{id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',family_id:ids.family,child_id:ids.child,lesson_key:'diagnostic',activity_day:today,started_at:new Date().toISOString(),finished_at:new Date().toISOString(),status:'completed',score:14,total_questions:18,points_awarded:0,answers:englishAnswers.diagnostic}]:[];
 if(role==='child'&&englishResetAudioQA){
   englishSessions.unshift({id:'eeeeeeee-eeee-4eee-8eee-000000000076',family_id:ids.family,child_id:ids.child,lesson_key:'eng2:to-be',activity_day:today,started_at:new Date(Date.now()-1800000).toISOString(),finished_at:new Date(Date.now()-900000).toISOString(),status:'completed',score:22,total_questions:30,points_awarded:30,answers:englishAnswers['eng2:to-be']});
   englishSessions.unshift({id:'eeeeeeee-eeee-4eee-8eee-000000000077',family_id:ids.family,child_id:ids.child,lesson_key:'eng2:to-be',activity_day:today,started_at:new Date(Date.now()-600000).toISOString(),finished_at:null,status:'in_progress',score:null,total_questions:30,points_awarded:0,active_seconds:210,answers:null});
   englishCredit=30;
  }
 if(role==='parent'&&subjectTutorQA)englishSessions.unshift({id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',family_id:ids.family,child_id:ids.child,lesson_key:'lengua:categorias',activity_day:today,started_at:new Date(Date.now()-920000).toISOString(),finished_at:new Date().toISOString(),status:'completed',score:4,total_questions:6,points_awarded:30,answers:[1,0,1,1,0,2]});
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
  if(url.pathname.includes('/functions/v1/moymir2-miro-ai'))return resp({answer:'Hello! Let us practise English. What do you like to do after school?'});
  if(url.pathname.includes('/rest/v1/rpc/')){counters.rpc.push({name,body:request.postDataJSON()});
    if(name==='moymir_wake_status')return resp(remoteWakeQA?wakeState:null);
    if(name==='moymir_wake_send'){wakeState={id:wakeId,created_at:new Date().toISOString(),state:'sent'};return resp(wakeId)}
    if(name==='moymir_wake_claim'){if(remoteWakeQA&&role==='child'&&['sent','received'].includes(wakeState?.state)){wakeState.state='received';return resp(wakeId)}return resp(null)}
    if(name==='moymir_wake_reply'){wakeState.state='awake';return resp(true)}

    if(name==='moymir_study_heartbeat'){
     const row=englishSessions.find(x=>x.id===request.postDataJSON().p_session);
     if(!row||row.child_id!==ids.child||!row.lesson_key.startsWith('eng2:'))return resp({error:'Not allowed'});
     if(englishTutorQA||englishResetAudioQA)row.active_seconds=900;
     return resp({active_seconds:row.active_seconds||0,required_seconds:900,status:'active'});
    }
    if(pioneerMobileQA&&name==='pioneer_state'){
     if(pioneerFailOnce){pioneerFailOnce=false;return route.fulfill({status:403,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'Недостаточно прав для загрузки библейской викторины',code:'42501'})})}
     return resp(pioneerFakeState());
    }
    if(pioneerMobileQA&&name==='pioneer_begin'){
     if(role==='parent')return route.fulfill({status:403,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'Child only',code:'42501'})});
     pioneerAttempts++;
     pioneerActive={id:'a6000000-0000-4000-8000-000000000002',level:1,correct:0,slot:1,cycle:1,hints:{},deadline:new Date(Date.now()+30000).toISOString(),question:{id:51,text:'Кто построил ковчег?',number:1,choices:['Моисей','Ной','Давид','Иосиф']}};
     return resp(pioneerActive.id)
    }
    if(pioneerMobileQA&&name==='pioneer_answer'){
     const q=request.postDataJSON();if(!pioneerActive||q.p_attempt!==pioneerActive.id)return resp({error:'Invalid question'});
     return resp({correct:true,answer:'Ной',reference:'Бытие 6:14',finished:false,status:'active',saved:0,newPoints:0});
    }
    if(pioneerMobileQA&&name==='pioneer_advance'){
     if(pioneerActive)pioneerActive={...pioneerActive,correct:1,deadline:new Date(Date.now()+30000).toISOString(),question:{id:52,text:'Как звали брата Моисея?',number:2,choices:['Аарон','Иов','Иосиф','Павел']}};
     return resp(new Date().toISOString());
    }
    if(pioneerMobileQA&&name==='pioneer_cashout'){
     pioneerActive=null;return resp({saved:0,newPoints:0})
    }
    if(taskManagementQA&&name==='manage_family_task'){
     if(role!=='parent')return route.fulfill({status:403,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'Parent only',code:'42501'})});
     const q=request.postDataJSON(),item=taskRows.find(x=>x.id===q.p_id);
     if(!item)return resp({error:'Unknown task'});
     Object.assign(item,{title:q.p_title,points:q.p_points,active:q.p_active});return resp(item.id)
    }
    if(taskManagementQA&&name==='pending_daily_chore_decisions')return resp(role==='parent'&& !choreDecision?[{template_id:ids.daily,activity_date:today,title:'Заправить кровать',points:5,status:'open'}]:[]);
    if(taskManagementQA&&name==='daily_chore_parent_decisions')return resp(choreDecision?[{template_id:ids.daily,activity_date:today,decision:choreDecision}]:[]);
    if(taskManagementQA&&name==='decide_daily_chore'){if(role!=='parent')return resp({error:'Parent only'});choreDecision=request.postDataJSON().p_decision;return resp(choreDecision);}
    if(taskManagementQA&&name==='set_daily_chore_penalty'){
     if(role!=='parent')return resp({error:'Parent only'});
     const q=request.postDataJSON(),item=dailyTemplates.find(x=>x.id===q.p_id);
     if(!item)return resp({error:'Unknown daily chore'});
     item.penalty_enabled=q.p_enabled;return resp(q.p_enabled);
    }
    if(taskManagementQA&&name==='manage_daily_chore'){
     if(role!=='parent')return resp({error:'Parent only'});
     const q=request.postDataJSON(),item=dailyTemplates.find(x=>x.id===q.p_id);
     if(!item)return resp({error:'Unknown daily chore'});
     Object.assign(item,{title:q.p_title,points:q.p_points,icon:q.p_icon,weekdays:q.p_weekdays,active:q.p_active});return resp(item.id)
    }
    if(taskManagementQA&&name==='create_family_task'){
     const q=request.postDataJSON(),item={id:'f0000000-0000-4000-8000-'+String(++taskSerial).padStart(12,'0'),title:q.p_title,points:q.p_points,assigned_child:q.p_child,active:true};
     taskRows.push(item);return resp(item.id)
    }
    if(taskManagementQA&&name==='submit_task'){
     const q=request.postDataJSON(),item=taskRows.find(x=>x.id===q.p_task_id);
     if(!item?.active)return route.fulfill({status:403,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'Task unavailable',code:'42501'})});
     return resp('ok')
    }
    if(name==='moymir_english_restart'){
     const key=request.postDataJSON().p_lesson;
     if(!englishAnswers[key])return resp({error:'Unknown lesson'});
     const old=englishSessions.find(x=>x.lesson_key===key&&x.status==='in_progress');
     if(old){old.status='abandoned';old.finished_at=new Date().toISOString()}
     const row={id:'eeeeeeee-eeee-4eee-8eee-'+String(++englishSessionSerial).padStart(12,'0'),family_id:ids.family,child_id:ids.child,lesson_key:key,activity_day:today,started_at:new Date().toISOString(),finished_at:null,status:'in_progress',score:null,total_questions:englishAnswers[key].length,points_awarded:0,active_seconds:0,answers:null};
     englishSessions.unshift(row);
     return resp({id:row.id,started_at:row.started_at,lesson_key:key,resumed:false,restarted:true,previous_session_id:old?.id||null});
    }
    if(name==='moymir_english_begin'){
     const key=request.postDataJSON().p_lesson;
     if(!englishAnswers[key])return resp({error:'Unknown lesson'});
     let row=englishSessions.find(s=>s.lesson_key===key&&s.status==='in_progress');
     if(!row){row={id:'eeeeeeee-eeee-4eee-8eee-'+String(++englishSessionSerial).padStart(12,'0'),family_id:ids.family,child_id:ids.child,lesson_key:key,activity_day:today,started_at:new Date(Date.now()-(key==='diagnostic'?5000:905000)).toISOString(),finished_at:null,status:'in_progress',score:null,total_questions:englishAnswers[key].length,points_awarded:0,answers:null};englishSessions.unshift(row)}
     return resp({id:row.id,started_at:row.started_at,lesson_key:key,resumed:false})
    }
    if(name==='moymir_english_finish'){
     const body=request.postDataJSON();const row=englishSessions.find(x=>x.id===body.p_session&&x.status==='in_progress');
     if(!row)return resp({error:'Already completed'});
     const answers=body.p_answers,correct=englishAnswers[row.lesson_key],score=answers.filter((x,i)=>x===correct[i]).length;
     if(row.lesson_key!=='diagnostic'&&!row.lesson_key.endsWith(':diagnostic')&&(row.lesson_key.startsWith('eng2:')?(row.active_seconds||0)<900:Date.now()-Date.parse(row.started_at)<900000))return resp({status:'waiting',remaining_seconds:900,score,total:correct.length});
     const awarded=row.lesson_key!=='diagnostic'&&!row.lesson_key.endsWith(':diagnostic')&&!englishSessions.some(x=>x!==row&&x.lesson_key.replace(/^eng2:/,'')===row.lesson_key.replace(/^eng2:/,'')&&x.points_awarded===30)?30:0;
     Object.assign(row,{status:'completed',finished_at:new Date().toISOString(),answers,score,points_awarded:awarded});englishCredit+=awarded;
     return resp({status:'completed',score,total:correct.length,points_awarded:awarded,correct_answers:correct})
    }
if(name==='review_daily_chore'&&request.postDataJSON()?.p_completion===qaDaily)qaDailyStatus=request.postDataJSON().p_approve?'approved':'rejected';if(name==='advance_my_world'){world=2;return resp(2)}if(name==='advance_my_world_stage'){world=3;return resp(3)}if(name==='finish_daily_text_reading'){spiritualAward=10;return resp(10)}if(name==='moymir_check_backpack'){backpackChecked=!!request.postDataJSON()?.p_done;return resp(true)}if(name==='moymir_choose_weekly_quality'){growthChoice=request.postDataJSON()?.p_quality;return resp(growthChoice)}if(name==='moymir_complete_growth_day'){growthAward=20;return resp(20)}if(name==='moymir_playtime_sync'||name==='moymir_playtime_overview')return resp(playOverview());if(name==='moymir_parent_activity_feed')return resp([{date:dateToday,category:'🧹 Ежедневное дело',title:'Заправить кровать',status:'approved',amount:5}]);
    if(playstationGiftQA&&name==='request_reward'){
     const id=request.postDataJSON().p_reward;
     if(id!==giftRewardId)return resp({error:'Unrecognized test reward'});
     const already=giftOrders.some(x=>x.reward_id===id&&new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(x.requested_at))===today);
     if(already)return route.fulfill({status:400,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({message:'Илья, ты уже активировал подарок сегодня',code:'22023'})});
     const row={id:'a1400000-0000-4000-8000-'+String(++giftSeq).padStart(12,'0'),reward_id:id,cost_snapshot:60,requested_at:new Date().toISOString(),status:'pending',mystery_prize:null};
     giftOrders.unshift(row);return resp(row.id)
    }
    if(playstationGiftQA&&name==='review_reward'){
     const req=giftOrders.find(x=>x.id===request.postDataJSON().p_request);
     if(!req)return resp({error:'Not found'});
     if(req.status==='pending'){
      req.status=request.postDataJSON().p_approve?'approved':'rejected';
      if(req.status==='approved')playBalance+=30;
     }
     return resp(req.status)
    }
    if(name==='moymir_playtime_set_limit'){playCap=Number(request.postDataJSON()?.p_daily);return resp(true)}
    if(name==='moymir_playtime_grant'){playBalance+=Number(request.postDataJSON()?.p_minutes);return resp(true)}
    if(name==='moymir_playtime_request'){const minutes=Number(request.postDataJSON()?.p_minutes);playSessions=[{id:'92222222-2222-4222-8222-222222222222',minutes,status:'pending',requested_at:new Date().toISOString(),started_at:null}];return resp(playSessions[0].id)}
    if(name==='moymir_playtime_review'){playSessions=playSessions.map(x=>x.id===request.postDataJSON()?.p_id?{...x,status:request.postDataJSON()?.p_approve?'approved':'rejected'}:x);return resp(request.postDataJSON()?.p_approve?'approved':'rejected')}
    if(name==='moymir_playtime_start'){const when=new Date().toISOString();playSessions=playSessions.map(x=>x.id===request.postDataJSON()?.p_id?{...x,status:'active',started_at:when}:x);return resp(when)}
    if(name==='moymir_playtime_finish'){playSessions=playSessions.map(x=>x.id===request.postDataJSON()?.p_id?{...x,status:'finished'}:x);return resp(true)}
    if(name==='moymir_complete_story_chapter'){storyDone.push(Number(request.postDataJSON()?.p_chapter));return resp(true)}
    if(name==='moymir_family_overview')return resp({worldPoints:earnedMock+englishCredit,balance:1700+englishCredit,earned:earnedMock+englishCredit,spent:0,deducted:0,spiritualPoints:spiritualAward+growthAward,tasks7:2,daily7:5,spiritual7:spiritualAward+growthAward,homework7:1,today:dateToday});return resp(name==='advance_my_world'?2:name==='report_child_app_open'?false:'ok')}
  if(method==='HEAD'&&name==='moymir_story_chapters')return route.fulfill({status:200,headers:{'content-range':`0-${Math.max(0,storyDone.length-1)}/${storyDone.length}`,'access-control-allow-origin':'*'},body:''});
  if(!url.pathname.includes('/rest/v1/'))return resp({});
  if(name==='moymir_subject_practice_attempts'){
   if(method==='GET'){const subject=url.searchParams.get('subject')?.replace('eq.','');return resp(subject?practiceRows.filter(x=>x.subject===subject):practiceRows)}
   if(method==='POST'){
    if(practiceNetworkFailures>0){practiceNetworkFailures--;return route.abort('failed')}
    const item=request.postDataJSON();const record=Array.isArray(item)?item[0]:item;
    if(!practiceRows.some(x=>x.id===record.id))practiceRows.unshift(record);
    counters.restWrites.push({name,method,record});return resp([])
   }
  }
  if(name==='moymir_english_sessions'&&method==='GET'){
   const filter=url.searchParams.get('lesson_key');
   const found=filter?.startsWith('in.(')?new Set(filter.slice(4,-1).split(',')):null;
   return resp(found?englishSessions.filter(s=>found.has(s.lesson_key)):englishSessions);
  }
  if(name==='moymir_world_decor_layouts'){
   if(method==='GET'){
    const worldId=(url.searchParams.get('world_number')||'').replace('eq.','');
    const child=(url.searchParams.get('child_id')||'').replace('eq.','');
    const found=decorCloud.get(child+':'+worldId)||null;
    return resp(found,true);
   }
   if(method==='POST'||method==='PATCH'){
    const item=request.postDataJSON();
    const record=Array.isArray(item)?item[0]:item;
    decorCloud.set(record.child_id+':'+record.world_number,record);
    counters.restWrites.push({name,method,record});
    return resp([]);
   }
  }
  if(['moymir_health_plan','moymir_health_daily','moymir_health_garden','moymir_health_meal_requests'].includes(name)){
    if(healthNetworkBlocked)return route.abort('failed');
    const single=request.headers()['accept']?.includes('vnd.pgrst.object')||false;
    const body=method==='POST'||method==='PATCH'?request.postDataJSON():null;
    if(name==='moymir_health_plan'){
     if(method==='GET')return resp(healthPlan,single);
     if(method==='POST'){
      const item=Array.isArray(body)?body[0]:body;
      healthPlan={...healthPlan,...item};
      counters.restWrites.push({name,method,record:healthPlan});
      return resp(single?healthPlan:[],single);
     }
    }
    if(name==='moymir_health_daily'){
     if(method==='GET')return resp(healthDaily);
     if(method==='POST'){
      const item=Array.isArray(body)?body[0]:body;
      healthDaily=[...healthDaily.filter(x=>x.activity_date!==item.activity_date),{...item}];
      counters.restWrites.push({name,method,record:item});
      return resp([]);
     }
    }
    if(name==='moymir_health_garden'){
     if(method==='GET')return resp(healthGarden,single);
     if(method==='POST'){
      const item=Array.isArray(body)?body[0]:body;
      healthGarden={...healthGarden,...item};
      counters.restWrites.push({name,method,record:healthGarden});
      return resp(single?healthGarden:[],single);
     }
    }
    if(name==='moymir_health_meal_requests'){
     if(method==='GET')return resp(healthRequests);
     if(method==='POST'){
      const item=Array.isArray(body)?body[0]:body;
      const newRecord={id:'d9999999-9999-4999-8999-'+String(++healthRequestSeq).padStart(12,'0'),
       family_id:item.family_id,child_id:item.child_id,weekday:item.weekday,
       meal_kind:item.meal_kind,suggestion:item.suggestion,status:'pending',created_at:new Date().toISOString()};
      healthRequests.unshift(newRecord);counters.restWrites.push({name,method,record:newRecord});
      return resp([]);
     }
     if(method==='PATCH'){
      const id=url.searchParams.get('id')?.replace('eq.','');
      healthRequests=healthRequests.map(x=>x.id===id?{...x,...body}:x);
      counters.restWrites.push({name,method,record:body});
      return resp([]);
     }
    }
   }
  if(name==='moymir_health_measurements'){
    if(method==='GET')return resp(growthMeasurements);
    if(method==='POST'){
     const incoming=request.postDataJSON();
     const item=Array.isArray(incoming)?incoming[0]:incoming;
     const record={id:'c9999999-9999-4999-8999-'+String(++growthSerial).padStart(12,'0'),
       family_id:item.family_id,child_id:item.child_id,client_ref:item.client_ref,
       measured_on:item.measured_on,height_cm:item.height_cm,weight_kg:item.weight_kg};
     const old=growthMeasurements.find(x=>x.client_ref===record.client_ref);
     if(!old)growthMeasurements.push(record);
     counters.restWrites.push({name,method,record});
     return resp(old||record,request.headers()['accept']?.includes('vnd.pgrst.object')||false);
    }
    if(method==='PATCH'){
     const id=url.searchParams.get('id')?.replace('eq.','');
     const change=request.postDataJSON();
     growthMeasurements=growthMeasurements.map(x=>x.id===id?{...x,...change}:x);
     counters.restWrites.push({name,method});
     return resp(growthMeasurements.find(x=>x.id===id),request.headers()['accept']?.includes('vnd.pgrst.object')||false);
    }
    if(method==='DELETE'){
     const id=url.searchParams.get('id')?.replace('eq.','');
     growthMeasurements=growthMeasurements.filter(x=>x.id!==id);
     counters.restWrites.push({name,method});
     return resp([]);
    }
  }
  if(name==='moymir_geography_attempts'){
   if(method==='GET')return resp(geographyAttempts);
   if(method==='POST'){
    const x=request.postDataJSON();
    const record={...x,id:'efefefef-0000-4000-8000-000000000001',option_orders:Array.from({length:25},(_,i)=>i%2===0?[2,1,0]:[1,0,2]),quiz_revision:2,reward_eligible:true,started_at:new Date().toISOString(),finished_at:null};
    geographyAttempts.unshift(record);
    return resp(record,true);
   }
   if(method==='PATCH'){
    const id=url.searchParams.get('id')?.replace('eq.','');
    const x=request.postDataJSON();
    geographyAttempts=geographyAttempts.map(a=>a.id===id?{...a,...x}:a);
    return resp(geographyAttempts.find(a=>a.id===id),true);
   }
  }
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
   case 'daily_chore_templates': data=dailyTemplates||[{id:ids.daily,title:'Заправить кровать',points:5,icon:'🛏️',active:true,weekdays:[0,1,2,3,4,5,6],penalty_enabled:true}];break;
   case 'daily_chore_completions':data=approvalQA?[{id:qaDaily,template_id:ids.daily,activity_date:today,status:qaDailyStatus}]:[];break;
   case 'tasks':data=taskRows||[{id:ids.task,title:'Сделать уроки',points:20,active:true,assigned_child:ids.child},{id:'77777777-7777-4777-8777-777777777777',title:'Без исполнителя',points:10,active:true,assigned_child:null}];break;
   case 'task_submissions':data=approvalQA?[{id:qaTask,task_id:ids.task,child_id:ids.child,activity_date:qaYesterday,status:'pending'}]:[];break;
   case 'rewards':data=[{id:ids.reward,title:'Семейное кино',cost:80,active:true},{id:'b2222222-2222-4222-8222-222222222222',title:'Неактивная награда',cost:200,active:false},...(playstationGiftQA?[{id:giftRewardId,title:'30 минут PlayStation',cost:60,active:true}]:[])];break;
   case 'reward_requests':data=playstationGiftQA?giftOrders:approvalQA?[{id:qaReward,reward_id:ids.reward,cost_snapshot:80,status:'pending'}]:[];break;
   case 'behavior_points':data=[];break;
   case 'spiritual_activity_records':data=[...(spiritualAward?[{id:'a4444444-4444-4444-8444-444444444444',activity_date:dateToday,step_id:'daily-text',points:10}]:[]),...(growthAward?[{id:'a6666666-6666-4666-8666-666666666666',activity_date:dateToday,step_id:'growth-focus',points:20}]:[])];break;
   case 'spiritual_point_requests':data=[];break;
   case 'child_task_proposals':data=[{id:'88888888-8888-4888-8888-888888888888',title:'Помыть велосипед',proposed_points:20,status:'pending'}];break;
   case 'child_world_progress':data=[{active_world:world}];break;
   case 'family_child_profiles':data=url.searchParams.has('child_id')?{display_name:'Илья'}:[{child_id:ids.child,display_name:'Илья'}];break;
   case 'family_chat_messages':data=[];break;
   case 'family_notifications':data=approvalQA?[{id:qaNotice,kind:'daily_submitted',source_id:qaDaily,title:'Илья заправил кровать',body:'Подтвердите выполнение',created_at:new Date().toISOString(),read_at:null}]:[];break;
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
 check('balance',await page.getByText(englishResetAudioQA&&role==='child'?/Баланс: 1730/:/Баланс: 1700/).count()>0);
 if(adventureQA){
  const hub=page.getByLabel('Игровые приключения');
  await hub.waitFor();
  check('two missions in open world',await hub.locator('.adventure-mission').count()===2);
  check('future worlds not exposed',!(await hub.innerText()).match(/Лун|Белочка|Космос/));
  await hub.getByRole('button',{name:'🛠 Мастерская'}).click();
  check('craft blocked without materials',await hub.getByRole('button',{name:'Нужны материалы'}).count()===2);
  await hub.getByRole('button',{name:'🗺 Миссии'}).click();
  if(role==='child'){
   const first=hub.locator('.adventure-mission').first();
   for(let i=0;i<3;i++){
    await first.getByRole('button',{name:'Осмотреть место'}).first().click();
    await page.getByRole('button',{name:'Подобрать находку'}).click();
   }
   check('all three unique finds collected',await first.getByText(/Найдено 3\/3/).count()===1&&await first.getByRole('button',{name:'Осмотреть место'}).count()===0);
   await hub.getByRole('button',{name:'🎒 Рюкзак'}).click();
   check('inventory contains 3 materials',await hub.getByText('Материалы · 3').count()===1);
   await hub.getByRole('button',{name:'🛠 Мастерская'}).click();
   await hub.getByRole('button',{name:'Создать предмет'}).click();
   check('recipe creates only once',await hub.getByRole('button',{name:'✓ Создано'}).isDisabled());
   await hub.getByRole('button',{name:'🎒 Рюкзак'}).click();
   check('materials consumed',await hub.getByText('Материалы · 0').count()===1);
   check('crafted decoration in collection',await hub.getByText('Фонарь путешественника',{exact:true}).count()===1);
   check('balance unchanged',await page.getByText(/Баланс: 1700/).count()>0);
   await page.reload({waitUntil:'domcontentloaded'});
   await hub.getByRole('button',{name:'🎒 Рюкзак'}).click({timeout:15000});
   check('inventory survives reload',await hub.getByText('Фонарь путешественника',{exact:true}).count()===1);
   earnedMock=1700;await page.locator('.mw-cloud-syncbar button').first().click();
   const dialog=page.getByRole('dialog',{name:'Поздравление с завершением этапа'});
   await dialog.getByRole('button',{name:/Перейти к другому этапу/}).click();
   await hub.getByRole('button',{name:'🗺 Миссии'}).click();
   check('new world has own mission and locked materials',await hub.getByText('Запасы белочки',{exact:true}).count()===1&&await hub.getByText('Закрытая находка').count()===5);
   await hub.getByRole('button',{name:'Осмотреть место'}).click();
   await page.getByRole('button',{name:'Подобрать находку'}).click();
   await hub.getByRole('button',{name:'🎒 Рюкзак'}).click();
   check('treehouse inventory separate',await hub.getByText('Орешек',{exact:true}).count()===1&&await hub.getByText('Фонарь путешественника',{exact:true}).count()===0);
   earnedMock=3200;await page.locator('.mw-cloud-syncbar button').first().click();
   await dialog.getByRole('button',{name:/Перейти к другому этапу/}).click();
   earnedMock=3400;await page.locator('.mw-cloud-syncbar button').first().click();
   await hub.getByRole('button',{name:'🗺 Миссии'}).click();
   await hub.locator('.adventure-mission').first().getByRole('button',{name:'Осмотреть место'}).first().click();
   await page.getByRole('button',{name:'Подобрать находку'}).click();
   check('space treasure collected',await hub.locator('.adventure-mission').first().getByText(/Найдено 1\/3/).count()===1);
  }else{
   check('parent cannot collect',await hub.getByRole('button',{name:'Осмотреть место'}).count()===0);
   check('parent read only notice',await hub.getByText(/Приключения проходит ребёнок/).count()===1);
  }
  check('no page exceptions',counters.errors.length===0,counters.errors.join(' | '));return;
 }
 if(miroQA){
  await page.getByRole('button',{name:'🤖 Поговорить с Миро'}).click();
  const dialog=page.getByRole('dialog',{name:/Миро/});
  await dialog.waitFor();
  check('three Miro sections',await dialog.getByRole('group',{name:'Режимы Миро'}).getByRole('button').count()===3);
  await dialog.getByRole('button',{name:'📚 Учёба',exact:true}).click();
  await dialog.getByRole('checkbox',{name:/Дроби и десятичные числа/}).check();
  check('study memory persisted',await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('moymir-miro-profile-v2:')&&JSON.parse(localStorage.getItem(k)).topics.includes('fractions'))));
  await dialog.getByRole('button',{name:'Повторить сохранённую тему'}).click();
  check('saved topic opens draft', (await dialog.getByRole('textbox',{name:'Вопрос Миро'}).inputValue()).includes('Дроби'));
  await dialog.getByRole('textbox',{name:'Вопрос Миро'}).fill('Что повторить сегодня?');
  await dialog.getByRole('button',{name:'➤'}).click();
  await dialog.getByText(/В твоём списке повторения/).waitFor();
  check('saved topics returned offline',await dialog.getByText(/В твоём списке повторения: Дроби/).count()===1);
  await dialog.getByRole('button',{name:'🤖 Робот',exact:true}).click();
  check('style available after points',await dialog.getByRole('button',{name:/Золотой/}).isEnabled());
  check('locked future style',await dialog.getByRole('button',{name:/Фиолетовый/}).isDisabled());
  await dialog.getByRole('button',{name:/Золотой/}).click();
  check('style choice saved',await dialog.getByRole('button',{name:/Золотой/}).getAttribute('aria-pressed')==='true');
  await dialog.getByRole('checkbox',{name:/Озвучивать ответы автоматически/}).check();
  await dialog.getByRole('combobox',{name:'Язык речи'}).selectOption('es-ES');
  check('voice settings saved',await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('moymir-miro-profile-v2:')&&JSON.parse(localStorage.getItem(k)).language==='es-ES'&&JSON.parse(localStorage.getItem(k)).autoSpeak)));
  await dialog.getByRole('button',{name:'Уменьшить Миро'}).click();
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'🤖 Поговорить с Миро'}).click({timeout:15000});
  await dialog.getByRole('button',{name:'📚 Учёба',exact:true}).click();
  check('memory survives reload',await dialog.getByRole('checkbox',{name:/Дроби и десятичные числа/}).isChecked());
  await dialog.getByRole('button',{name:'💬 Разговор',exact:true}).click();
  check('voice controls available',await dialog.getByRole('button',{name:/Сказать вопрос/}).count()===1&&await dialog.getByRole('button',{name:'Озвучить ответ Миро'}).count()>0);
  check('no page exceptions',counters.errors.length===0,counters.errors.join(' | '));return;
 }
 if(livingWorldQA){
  const worldPanel=page.locator('.world3d-panel');
  await worldPanel.locator('canvas').waitFor({timeout:15000});
  const weather=worldPanel.getByLabel('Погода и освещение');
  await weather.getByRole('button',{name:'🌙 Ночь'}).click();
  check('night sky selected',await weather.getByRole('button',{name:'🌙 Ночь'}).getAttribute('aria-pressed')==='true');
  await weather.getByRole('button',{name:'🌧 Дождь'}).click();
  check('rain selected',await weather.getByRole('button',{name:'🌧 Дождь'}).getAttribute('aria-pressed')==='true');
  await weather.getByRole('button',{name:'🍃 Ветер'}).click();
  check('wind selected',await weather.getByRole('button',{name:'🍃 Ветер'}).getAttribute('aria-pressed')==='true');
  await worldPanel.getByRole('button',{name:'🍖 Покормить'}).click();
  await page.waitForTimeout(200);
  check('dog action exists',await worldPanel.locator('.living-pet').getByRole('button',{name:'🎾 Играть'}).count()===1);
  await worldPanel.getByRole('button',{name:'🏡 Войти в комнату'}).click();
  await worldPanel.locator('.living-room-viewport canvas').waitFor({timeout:12000});
  await worldPanel.getByRole('button',{name:'↔ Переставить'}).click();
  check('room stores changed furniture locally',await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('moymir-room:')&&JSON.parse(localStorage.getItem(k)).bed!==0)));
  await worldPanel.getByRole('button',{name:'💡 Погасить'}).click();
  check('room light changes',await worldPanel.getByRole('button',{name:'💡 Зажечь'}).count()===1);
  await worldPanel.getByRole('button',{name:'Выйти из комнаты'}).click();
  check('exterior restored',await worldPanel.getByRole('button',{name:'🏡 Войти в комнату'}).count()===1);
  check('future worlds remain hidden',await page.locator('.mw-mystery-card').count()===2&&!(await page.locator('.mw-scroll').innerText()).match(/Домик на дереве|Космическая экспедиция|Космос/));
  if(role==='child'){
   earnedMock=1700;await page.locator('.mw-cloud-syncbar button').first().click();
   const dialog=page.getByRole('dialog',{name:'Поздравление с завершением этапа'});
   await dialog.getByRole('button',{name:/Перейти к другому этапу/}).click();
   await page.locator('.living-pet').getByText('🐿️ Моя белочка').waitFor({timeout:15000});
   await page.locator('.living-pet').getByRole('button',{name:'🌰 Покормить'}).click();
   check('squirrel available after earned 80 points',await page.locator('.living-pet').getByText('🐿️ Моя белочка').count()===1);
   check('treehouse room remains locked at 100 points',await page.getByRole('button',{name:'🏡 Войти в комнату'}).count()===0);
   earnedMock=3200;await page.locator('.mw-cloud-syncbar button').first().click();
   await dialog.getByRole('button',{name:/Перейти к другому этапу/}).click();
   await page.locator('.space-world').waitFor({timeout:12000});
   check('robot locked before earned points',await page.locator('.space-world .living-pet').count()===0);
   earnedMock=4400;await page.locator('.mw-cloud-syncbar button').first().click();
   await page.locator('.space-world').getByRole('button',{name:'🔋 Зарядить'}).click();
   check('robot charges and responds',await page.locator('.living-pet-status').innerText()==='Робот заряжает батарею!');
   await page.locator('.space-world').getByRole('button',{name:'🚀 Войти в жилой модуль'}).click();
   check('space interior opened',await page.locator('.space-world').getByText('🚀 Жилой модуль',{exact:true}).count()===1);
  }
  check('no page exceptions',counters.errors.length===0,counters.errors.join(' | '));return;
 }
 if(remoteWakeQA){
  if(role==='parent'){
   const panel=page.locator('.mw-remote-wake');
   await panel.waitFor();
   page.once('dialog',d=>d.accept());
   await panel.getByRole('button',{name:'🔔 Разбудить Илью'}).click();
   await panel.getByText(/Команда отправлена/).waitFor();
   check('parent sends wake request and cooldown is enabled',wakeState?.state==='sent'&&await panel.getByRole('button').isDisabled());
  }else{
   const dialog=page.getByRole('dialog',{name:'Пора просыпаться'});
   await page.bringToFront();
   await dialog.waitFor({timeout:12000}).catch(async e=>{console.log('WAKE_DEBUG',wakeState,counters.rpc.filter(x=>x.name.includes('wake')),counters.errors,await page.evaluate(()=>document.visibilityState));throw e});
   check('child receives a full screen wake prompt',wakeState?.state==='received'&&await dialog.isVisible());
   check('child cannot see parent trigger',await page.locator('.mw-remote-wake').count()===0);
   await dialog.getByRole('button',{name:'Выключить звук'}).click();
   await dialog.getByRole('button',{name:'✓ Я проснулся!'}).click();
   await dialog.waitFor({state:'detached'});
   check('child replies to parent',wakeState?.state==='awake'&&counters.rpc.some(x=>x.name==='moymir_wake_reply'&&x.body.p_id===wakeId));
  }
  check('no page exceptions',counters.errors.length===0,counters.errors.join(' | '));
  return;
 }
 if(threeWorldQA){
  const switcher=page.locator('.mw-worldswitch');
  const dialog=page.getByRole('dialog',{name:'Поздравление с завершением этапа'});
  check('1599 points: celebration stays closed',await dialog.count()===0);
  check('only opened world selectable, two mystery cards',await switcher.getByRole('button').count()===1&&await page.locator('.mw-mystery-card').count()===2);
  check('no future world names or interactive previews',!(await page.locator('.mw-scroll').innerText()).match(/Домик на дереве|Космическая экспедиция|Космос/)&&await page.locator('.space-world').count()===0);
  check('mystery cards have no clickable controls',await page.locator('.mw-mystery-card button,.mw-mystery-card a').count()===0);
  earnedMock=1600;
  await page.locator('.mw-cloud-syncbar button').first().click();
  if(role==='child'){
   await dialog.waitFor({timeout:12000});
   check('1600 points: full-screen modal with fireworks',await dialog.locator('.mw-firework').count()===7&&await dialog.locator('h1').innerText()==='Поздравляю, Илья!');
   check('no automatic stage transition',world===1);
   check('celebration preserves surprise',!(await dialog.innerText()).match(/Домик на дереве|Космос|Космическая/));
   await dialog.getByRole('button',{name:/Перейти к другому этапу/}).click();
   await dialog.waitFor({state:'detached',timeout:15000});
   await page.locator('.world3d-toolbar').getByText('3D-домик на дереве').waitFor({timeout:15000});
   check('child advances to treehouse and starts at zero',world===2&&await page.locator('.world3d-bottom').innerText().then(x=>x.includes('0 / 1600')));
   check('one remaining mystery card and two open worlds',await page.locator('.mw-mystery-card').count()===1&&await switcher.getByRole('button').count()===2);
   check('third world still hidden',!(await switcher.innerText()).match(/Космос/)&&await page.locator('.space-world').count()===0);
   earnedMock=3200;await page.locator('.mw-cloud-syncbar button').first().click();
   await dialog.waitFor({timeout:12000});
   check('3200 points: second stage celebration',await dialog.getByText('ЭТАП 2 ЗАВЕРШЁН').count()===1);
   await dialog.getByRole('button',{name:/Перейти к другому этапу/}).click();
   await page.locator('.space-world').waitFor({timeout:15000});
   check('third stage unlocked with zero points',world===3&&await page.locator('.space-catalog button:disabled').count()===30);
   check('all three worlds opened, no locked cards',await switcher.getByRole('button').count()===3&&await page.locator('.mw-mystery-card').count()===0);
   check('no loss of wallet',await page.locator('.mw-coin').innerText().then(x=>x.includes('1700')));
  }else{
   await page.waitForTimeout(400);
   check('parent cannot trigger child milestone',await dialog.count()===0&&world===1);
  }
  check('no page exceptions',counters.errors.length===0,counters.errors.join(' | '));
  return;
 }
 if(role==='child'&&await page.getByRole('dialog',{name:'Поздравление с завершением этапа'}).count())await page.getByRole('button',{name:'Посмотреть позже'}).click();
 if(pioneerMobileQA){
  await page.getByRole('button',{name:/Духовный рост/}).last().click();
  const entry=page.locator('.pn-entry');await entry.waitFor();
  check('pioneer entry is visible in spiritual-growth tab on mobile',await entry.getByRole('heading',{name:'Кто хочет стать пионером?'}).count()===1);
  await entry.getByRole('button',{name:role==='child'?'▶ Играть':'📊 Результаты'}).click();
  const portal=page.getByRole('dialog',{name:'Кто хочет стать пионером'});await portal.waitFor();
  await portal.getByText('ГОТОВ ОТКРЫТЬ',{exact:false}).waitFor({state:'visible',timeout:7000});
  check('pioneer quiz opens on narrow Android viewport',await portal.locator('.pn-lobby').count()===1&&await portal.isVisible());
  if(role==='child'){
   const level=portal.locator('.pn-level.open').first();await level.click();
   await portal.getByText('Кто построил ковчег?').waitFor({state:'visible'});
   check('child sees playable real first Bible question',pioneerAttempts===1&&await portal.locator('.pn-option').count()===4);
   check('four answer buttons fit the phone without horizontal clipping',await portal.locator('.pn-option').first().evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=window.innerWidth+2&&r.width>200}));
   await portal.getByRole('button',{name:'Б. Ной'}).click();
   await portal.getByText('✨ Правильно!').waitFor();
   check('answer submitted and Bible reference shown',counters.rpc.some(x=>x.name==='pioneer_answer')&&await portal.getByText(/Бытие 6:14/).count()===1);
   await portal.getByRole('button',{name:/Следующий вопрос/}).click();
   await portal.getByText('Как звали брата Моисея?').waitFor();
   check('next Bible question opens after a correct answer',counters.rpc.some(x=>x.name==='pioneer_advance'));
   await portal.getByRole('button',{name:/Выйти/}).click();
   const confirm=portal.getByRole('alertdialog');await confirm.waitFor();
   check('early exit requires confirmation without silently losing progress',await confirm.getByText(/Попытка завершится/).count()===1);
   await confirm.getByRole('button',{name:'Да, выйти'}).click();
   await portal.waitFor({state:'hidden'});
   check('pioneer closes safely after confirmation',counters.rpc.some(x=>x.name==='pioneer_cashout'));
   pioneerFailOnce=true;
   await entry.getByRole('button',{name:'▶ Играть'}).click();
   await portal.waitFor();await portal.getByText(/Недостаточно прав для загрузки/).waitFor({timeout:6000});
   check('if API fails, phone shows a retry control instead of blank screen',await portal.getByRole('button',{name:'Повторить загрузку'}).count()===1);
   await portal.getByRole('button',{name:'Повторить загрузку'}).click();
   await portal.getByText('ГОТОВ ОТКРЫТЬ',{exact:false}).waitFor();
   check('retry recovers Pioneer quiz after server becomes available',await portal.locator('.pn-level.open').count()===1);
  }else{
   check('parent can open Pioneer report without controls to play',await portal.getByText('Отчёт для родителя').count()===1&&await portal.locator('.pn-level').count()===0);
  }
  check('pioneer mobile quiz produces no JavaScript exceptions',counters.errors.length===0,counters.errors.join(' | '));return;
 }
 if(taskManagementQA){
  await page.getByRole('button',{name:/Дела/}).last().click();
  await page.getByRole('heading',{name:role==='parent'?'Проверка заданий':'Мои дела'}).waitFor();
  if(role==='parent'){
   const manager=page.getByRole('group',{name:'Управление обычными делами'}).count();
   const details=page.locator('details[aria-label="Управление обычными делами"]');
   await details.locator('summary').click();
   check('parent sees old and archived ordinary chores',await details.locator('.mw-family-task-editor').count()===2);
   const ordinary=details.locator('.mw-family-task-editor').filter({hasText:'Сделать уроки'});
   await ordinary.getByRole('button',{name:/Изменить/}).click();
   await ordinary.getByLabel('Название дела').fill('Проверить школьный дневник');
   await ordinary.getByLabel('Монеты за выполнение').fill('25');
   await ordinary.getByRole('button',{name:'Сохранить изменения'}).click();
   await details.getByText('Проверить школьный дневник').waitFor();
   check('parent changes title and reward of an existing task',taskRows.some(x=>x.title==='Проверить школьный дневник'&&x.points===25));
   const updated=details.locator('.mw-family-task-editor').filter({hasText:'Проверить школьный дневник'});
   await updated.getByRole('button',{name:/Убрать из дел/}).click();
   check('parent receives archive confirmation',await updated.getByText(/Прежние выполнения и заработанные баллы останутся/).count()===1);
   await updated.getByRole('button',{name:'Да, убрать'}).click();
   await updated.getByText('Убрано из списка').waitFor();
   check('archived ordinary task is hidden from active list but retained in editor',!taskRows.find(x=>x.title==='Проверить школьный дневник').active&&await page.locator('.mw-chore').filter({hasText:'Проверить школьный дневник'}).count()===0);
   await updated.getByRole('button',{name:/Восстановить/}).click();await updated.getByRole('button',{name:'Да, восстановить'}).click();
   await page.locator('.mw-chore').filter({hasText:'Проверить школьный дневник'}).waitFor();
   check('parent can restore archived ordinary task',taskRows.find(x=>x.title==='Проверить школьный дневник').active);
   await page.getByPlaceholder('Название задания').fill('Новое дело для Ильи');
   await page.getByRole('button',{name:'Создать задание'}).click();
   await details.getByText('Новое дело для Ильи').waitFor();
   check('parent adds an ordinary task and it appears in list',taskRows.some(x=>x.title==='Новое дело для Ильи'&&x.active));
   const dailies=page.locator('details[aria-label="Управление ежедневными заданиями"]');await dailies.locator('summary').click();
   const daily=dailies.locator('.mw-cloud-line').filter({hasText:'Заправить кровать'});
   check('parent sees initial matching automatic penalty',await daily.getByText('Возможный штраф: −5 монет').count()===1);
   await daily.getByRole('button',{name:'Отключить штраф'}).click();
   await daily.getByText('Без штрафа за пропуск').waitFor();
   check('parent can disable automatic penalty',dailyTemplates.find(x=>x.id===ids.daily).penalty_enabled===false);
   await daily.getByRole('button',{name:'Включить штраф'}).click();
   await daily.getByText('Возможный штраф: −5 монет').waitFor();
   check('parent can enable automatic penalty',dailyTemplates.find(x=>x.id===ids.daily).penalty_enabled===true);
   await daily.getByRole('button',{name:/Убрать из дел/}).click();await daily.getByRole('button',{name:'Да, убрать'}).click();
   await daily.getByText(/Приостановлено/).waitFor();
   check('parent hides a daily chore without deleting original record',dailyTemplates.find(x=>x.id===ids.daily).active===false);
   await daily.getByRole('button',{name:/Восстановить/}).click();await daily.getByRole('button',{name:'Да, восстановить'}).click();
   await daily.getByText(/Активно/).waitFor();
   check('parent restores the daily chore with original name and points',dailyTemplates.find(x=>x.id===ids.daily).active&&dailyTemplates.find(x=>x.id===ids.daily).points===5);
   await daily.getByRole('button',{name:'Изменить',exact:true}).click();
   await daily.getByLabel('Название').fill('Заправить постель утром');
   await daily.getByRole('button',{name:'Сохранить изменения'}).click();
   await dailies.getByText('Заправить постель утром').waitFor();
   check('parent can rename existing daily chore without losing history',dailyTemplates.find(x=>x.id===ids.daily).title==='Заправить постель утром'&&dailyTemplates.find(x=>x.id===ids.daily).active);
   const decisions=page.locator('#chore-decisions');
   check('parent sees manual decision actions',await decisions.getByRole('button',{name:'Оштрафовать −5'}).count()===1);
   page.once('dialog',d=>d.accept());
   await decisions.getByRole('button',{name:'Оштрафовать −5'}).click();
   await decisions.waitFor({state:'detached'});
   check('manual penalty sent only on parent confirmation',choreDecision==='penalty');

  }else{
   check('child does not see parental edit controls',await page.locator('details[aria-label="Управление обычными делами"]').count()===0&&await page.locator('details[aria-label="Управление ежедневными заданиями"]').count()===0);
   check('archived ordinary and daily tasks are not presented as active',await page.getByText('Неиспользуемое дело').count()===0&&await page.getByText('Устаревшее ежедневное дело').count()===0);
   check('child sees matching penalty for an unfinished daily chore',await page.locator('.mw-chore').filter({hasText:'Заправить кровать'}).getByText('При пропуске: −5 🪙').count()===1);
   check('child has no penalty management button',await page.getByRole('button',{name:/Включить штраф|Отключить штраф/}).count()===0);
   check('child sees original active chores only',await page.locator('.mw-chore').filter({hasText:'Сделать уроки'}).count()===1&&await page.locator('.mw-chore').filter({hasText:'Заправить кровать'}).count()===1);
  }
  check('task edit/restore causes no JS exceptions',counters.errors.length===0,counters.errors.join(' | '));return;
 }
 if(practiceQA){
  await page.getByRole('button',{name:/Учёба/}).last().click();
  const entry=page.locator('.subjects-entry');await entry.locator('summary').click();
  for(const subj of ['lengua','matematicas','historia','biologia']){
   const spec=SUBJECTS.find(s=>s.id===subj);
   await entry.getByRole('button',{name:'Репетитор '+spec.name}).click();
   const portal=page.getByRole('dialog',{name:'Репетитор '+spec.name});
   const practice=portal.locator('.practice-section');await practice.waitFor();
   check(subj+' large bank available',await practice.getByText('256 упражнений').count()===1&&await practice.locator('.practice-chapter').count()===8);
   if(role==='parent'){
    check(subj+' parent has no practice start controls',await practice.getByRole('button',{name:/Практика /}).count()===0);
    if(subj==='matematicas'){
     await page.waitForFunction(()=>{const t=document.querySelector('.practice-section .practice-stats')?.textContent||'';return t.includes('12')},undefined,{timeout:5000});
     check('parent sees child practice report across devices',await practice.locator('.practice-stats').innerText().then(x=>x.includes('12')&&x.includes('75%')));
    }
   }else{
    const ch=getPracticeBank(subj)[0],button=practice.getByRole('button',{name:'Практика '+ch.title});
    await button.click();
    const questionArea=practice.locator('.practice-task');await questionArea.waitFor();
    check(subj+' requires typed answer instead of A B C',await questionArea.locator('input').count()===1&&await questionArea.locator('button[aria-pressed]').count()===0);
    const seen=[];
    for(let i=0;i<12;i++){
     const text=await questionArea.locator('h4').innerText();
     const item=ch.items.find(q=>q.prompt===text);if(!item)throw Error('No matching original practice prompt '+text);
     seen.push(item.id);
     if(i===0&&subj==='matematicas'){
      await questionArea.locator('input').fill('nonrespuesta');
      await questionArea.getByRole('button',{name:'Проверить'}).click();
      check('incorrect free answer gets a second chance',await questionArea.getByText(/Пока неверно/).count()===1);
     }
     await questionArea.locator('input').fill(item.answer);
     await questionArea.getByRole('button',{name:'Проверить'}).click();
     await questionArea.getByText(/✓ Верно!/).waitFor();
     await questionArea.getByRole('button',{name:i===11?'Завершить':'Следующее →'}).click();
    }
    await practice.locator('.practice-finish').waitFor();
    check(subj+' completed 12 typed answer questions',await practice.locator('.practice-finish h4').innerText().then(x=>x.includes(subj==='matematicas'?'11/12':'12/12')));
    if(subj==='lengua'){
     const pendingKey='moymir-practice-pending-v1:'+encodeURIComponent(ids.child)+':lengua';
     await page.waitForFunction(key=>(JSON.parse(localStorage.getItem(key)||'[]')).length===1,pendingKey,{timeout:4000});
     check('offline practice retains a pending report on device',await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'[]').length===1,pendingKey));
     await page.evaluate(()=>window.dispatchEvent(new Event('online')));
     await page.waitForFunction(key=>(JSON.parse(localStorage.getItem(key)||'[]')).length===0,pendingKey,{timeout:5000});
     check('online recovery uploads offline practice report',practiceRows.some(x=>x.subject==='lengua'&&x.total===12));
    }else await page.waitForTimeout(150);
    check(subj+' practice results synced without point rewards',practiceRows.some(x=>x.subject===subj&&x.total===12)&&englishCredit===0);
    await practice.locator('.practice-finish').getByRole('button',{name:'К темам'}).click();
    await button.click();
    const nextText=await practice.locator('.practice-task h4').innerText();
    check(subj+' repeats use new bank items before old ones',!seen.some(id=>ch.items.find(q=>q.id===id)?.prompt===nextText));
    await practice.locator('.practice-exit').click();
   }
   await portal.getByRole('button',{name:'Закрыть предмет'}).click();
  }
  await page.getByRole('button',{name:/Мир/}).last().click();
  check('practice does not change the child balance',englishCredit===0&&await page.getByText(/Баланс: 1700/).count()>0);
  check('practice tutor has no JavaScript exceptions',counters.errors.length===0,counters.errors.join(' | '));
  return;
 }
 if(subjectTutorQA){
  await page.getByRole('button',{name:/Учёба/}).last().click();
  const entry=page.locator('.subjects-entry');
  check('school tutors are compact until opened',await entry.locator('summary').isVisible()&&await entry.locator('.subjects-grid button').first().isHidden());
  await entry.locator('summary').click();
  check('all nine school subjects visible',await entry.locator('.subjects-grid button').count()===9&&await entry.locator('.subjects-grid button').first().isVisible());
  check('English tutor and geography exam remain separate',await page.locator('.english-entry').count()===1&&await page.locator('.geo-entry').count()===1);
  for(const subject of SUBJECTS){
   await entry.getByRole('button',{name:'Репетитор '+subject.name}).click();
   const portal=page.getByRole('dialog',{name:'Репетитор '+subject.name});
   await portal.waitFor({state:'visible'});
   check(subject.name+' shows its own syllabus',await portal.locator('.english-lesson').count()===subject.lessons.length);
   if(role==='parent'){
    check(subject.name+' cannot start child lessons as parent',await portal.locator('.english-lesson button').count()===0);
    if(subject.id==='lengua'){
     await portal.locator('.english-history').waitFor({state:'visible',timeout:4500});
     check('parent sees Lengua grades and 30-point award',await portal.locator('.english-history').getByText('Clases de palabras').count()===1&&await portal.locator('.english-history').getByText('+30 🏅').count()===1);
    }
   }else{
    if(subject.id==='historia'){
     await portal.locator('.english-ai').getByRole('button',{name:'Открыть'}).click();
     await portal.getByRole('button',{name:'Объясни ещё раз'}).click();
     await portal.locator('.english-chat-msg.assistant').waitFor();
     check('history Miro AI conversation available without timed quiz',await portal.locator('.english-chat-msg.assistant').count()===1);
    }
    if(subject.id==='matematicas'){
     const beforeDiagnosticCredit=englishCredit;
     await portal.getByRole('button',{name:/Пройти диагностику/}).click();
     await portal.getByText('Вопрос 1 из 12').waitFor({state:'visible',timeout:5000});
     check('Mathematics diagnostic has 12 questions',await portal.getByText('Вопрос 1 из 12').count()===1);
     for(let i=0;i<subject.diagnostic.questions.length;i++){
      await portal.locator('.english-options button').first().click();
      if(i<subject.diagnostic.questions.length-1)await portal.getByRole('button',{name:'Следующий →'}).click();
     }
     await portal.getByRole('button',{name:'Узнать результат'}).click();
     await portal.locator('.english-good').filter({hasText:'Диагностика завершена'}).waitFor();
     check('Mathematics diagnostic grants no points',englishCredit===beforeDiagnosticCredit);
     check('Mathematics results include explanations for all answers',await portal.locator('.english-review').count()===subject.diagnostic.questions.length);
     await portal.getByRole('button',{name:'К списку тем →'}).click();
    }
    await portal.locator('.english-lesson').first().getByRole('button',{name:'Начать'}).click();
    await portal.getByText('Вопрос 1 из 6').waitFor({state:'visible',timeout:5000});
    check(subject.name+' opens a guided lesson',await portal.locator('.english-rule').isVisible()&&await portal.getByText('Вопрос 1 из 6').count()===1);
    if(subject.id==='frances'){
     await portal.locator('.english-ai').getByRole('button',{name:'Открыть'}).click();
     await portal.getByRole('button',{name:'Объясни ещё раз'}).click();
     await portal.locator('.english-chat-msg.assistant').waitFor();
     check('French AI tutor answers',await portal.locator('.english-chat-msg.assistant').innerText().then(x=>x.includes('Hello!')));
    }
    const row=englishSessions.find(x=>x.lesson_key===subject.lessons[0].id&&x.status==='in_progress');
    if(!row)throw Error('Missing subject session');
    for(let i=0;i<6;i++){
     const question=subject.lessons[0].questions[i],order=shuffledEnglishChoices(question,row.id,i);
     if(i===0&&subject.id==='historia'){
      await portal.locator('.english-options button').nth(order.indexOf((question.correct+1)%3)).click();
      await portal.getByText(/Ещё одна попытка/).waitFor();
      check('history tutor explains the incorrect answer immediately',await portal.locator('.guided-feedback').getByText('Правило:',{exact:false}).count()===1&&await portal.locator('.guided-feedback').getByText('Объяснение:',{exact:false}).count()===1);
      check('cannot skip correction before understanding it',await portal.getByRole('button',{name:'Следующий →'}).isDisabled());
      await portal.getByRole('button',{name:'Закрыть предмет'}).click();
      const warning=page.getByRole('alertdialog',{name:'Предупреждение о незавершённом уроке'});
      await warning.waitFor({state:'visible'});
      check('early exit warns child about lost reward and preserved answers',await warning.getByText(/30 баллов пока не начислятся/).count()===1);
      await warning.getByRole('button',{name:'Продолжить занятие'}).click();
     }
     await portal.locator('.english-options button').nth(order.indexOf(question.correct)).click();
     if(i<5)await portal.getByRole('button',{name:'Следующий →'}).click();
    }
    await portal.getByRole('button',{name:'Завершить урок (+30)'}).click();
    await portal.getByText(/Сервер начислил \+30 баллов/).waitFor();
    check(subject.name+' earns exactly 30 verified points',englishSessions.some(s=>s.lesson_key===subject.lessons[0].id&&s.points_awarded===30));
    check(subject.name+' offers six explanations',await portal.locator('.english-review').count()===6);
    if(subject.id==='historia')check('original wrong historical answer is retained in parent report',englishSessions.find(x=>x.lesson_key===subject.lessons[0].id)?.score===5);
    await portal.getByRole('button',{name:'К списку тем →'}).click();
    check(subject.name+' history visible',await portal.locator('.english-history').count()===1);
   }
   await portal.getByRole('button',{name:'Закрыть предмет'}).click();
  }
  if(role==='child'){
   check('nine independent 15-minute lesson awards total 270',englishCredit===270);
   await page.getByRole('button',{name:/Мир/}).last().click();
   await page.getByText(/Баланс: 1970/).waitFor();
   check('all subjects contribute to family balance',await page.getByText(/Баланс: 1970/).count()===1);
  }
  check('new subjects leave no React exception',counters.errors.length===0,counters.errors.join(' | '));
  return;
 }
 if(playstationGiftQA){
  await page.getByRole('button',{name:/Магазин/}).last().click();
  const shop=page.getByRole('heading',{name:'Сокровища острова 🎁'});
  await shop.waitFor();
  const reward=page.locator('.mw-reward').filter({hasText:'30 минут PlayStation'});
  await reward.waitFor();
  const bank=page.getByRole('region',{name:'Копилка игрового времени'});
  await bank.waitFor();
  check('30-minute gift shown at original 60-coin price',await reward.getByText('🪙 60').count()===1);
  await bank.locator('.playbank-hours').getByText('1 ч',{exact:true}).waitFor({timeout:9000});
  check('wallet shows banked hours separately from daily spending limit',await bank.locator('.playbank-hours').innerText()==='1 ч'&&await bank.getByText('Дневной предел').count()>0);
  if(role==='parent'){
   const parentOrders=page.getByRole('heading',{name:'История заказов'}).locator('..');
   const old=parentOrders.locator('.mw-cloud-line').filter({hasText:'30 минут PlayStation'});
   await old.getByRole('button',{name:'✓'}).click();
   await bank.getByText('90 мин',{exact:true}).waitFor({timeout:8000});
   check('one approved shop gift adds exactly 30 accumulated minutes',playBalance===90&&await bank.getByText('1 ч 30 мин').count()===1);
   check('gift approval is recorded as approved',giftOrders.some(x=>x.status==='approved')&&await parentOrders.getByText(/✓ Выдано/).count()>0);
  }else{
   check('pending gift from yesterday does not block a new day',await reward.getByRole('button',{name:'Заказать'}).count()===1);
   await reward.getByRole('button',{name:'Заказать'}).click();
   await reward.getByText(/Сегодня подарок уже запрошен/).waitFor();
   check('first request sent to server',counters.rpc.filter(x=>x.name==='request_reward').length===1&&giftOrders.filter(x=>x.status==='pending').length===2);
   const oldCount=counters.rpc.filter(x=>x.name==='request_reward').length;
   await reward.getByRole('button',{name:/Заказать снова/}).click();
   const warning=reward.getByRole('alert');await warning.waitFor();
   check('repeat request gives immediate warning without reaching server',await warning.innerText().then(x=>x.includes('уже активировал'))&&counters.rpc.filter(x=>x.name==='request_reward').length===oldCount);
   const pending=giftOrders.find(x=>x.status==='pending');pending.status='approved';playBalance+=30;
   await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
   await bank.getByText('90 мин',{exact:true}).waitFor({timeout:10000});
   check('parent-approved 30 minutes accumulate in bank',await bank.getByText('1 ч 30 мин').count()===1);
   await reward.getByRole('button',{name:/Заказать снова/}).click();
   check('approval does not reopen daily claim',counters.rpc.filter(x=>x.name==='request_reward').length===oldCount&&await warning.isVisible());
  }
  check('gift rule does not cause JS crashes',counters.errors.length===0,counters.errors.join(' | '));
  return;
 }
 if(englishResetAudioQA){
  await page.getByRole('button',{name:/Учёба/}).last().click();
  const entry=page.locator('.english-entry');await entry.getByRole('button').click();
  const portal=page.getByRole('dialog',{name:'Английский с Миро'});await portal.waitFor();
  if(role==='parent'){
   check('parent has no controls to reset child lessons',await portal.locator('.english-restart-actions').count()===0);
   await portal.getByRole('button',{name:'Закрыть репетитора'}).click();return
  }
  const first=portal.locator('.english-lesson').first();
  await first.getByText(/Прежний результат в истории: 22\/30/).waitFor({state:'visible',timeout:7000});
  check('previous completed score remains visible in historical report',await first.getByText(/Прежний результат в истории: 22\/30/).count()===1);
  await first.getByRole('button',{name:/Продолжить/}).click();
  await portal.getByText('Вопрос 1 из 30').waitFor();
  check('unfinished answers are intentionally resumed',await portal.locator('.guided-feedback').getByText(/Ещё одна попытка/).count()===1);
  await portal.getByRole('button',{name:/Сначала/}).click();
  const confirm=page.getByRole('alertdialog',{name:'Начать английский урок с начала'});await confirm.waitFor();
  check('restart asks child to confirm clearing draft',await confirm.getByText(/незавершённые ответы будут очищены/).count()===1);
  await confirm.getByRole('button',{name:'Да, начать с нуля'}).click();
  await portal.locator('.guided-feedback').waitFor({state:'hidden',timeout:7000});
  await portal.getByText('Вопрос 1 из 30').waitFor();
  check('restart resets all selected answers',await portal.locator('.guided-feedback').count()===0&&await portal.locator('.english-quiz-meta').innerText().then(x=>x.includes('Разобрано: 0/30')));
  check('old unfinished session was abandoned, completed result preserved',englishSessions.some(x=>x.id.endsWith('77')&&x.status==='abandoned')&&englishSessions.some(x=>x.id.endsWith('76')&&x.status==='completed'&&x.points_awarded===30));
  const play=portal.getByRole('button',{name:'Прослушать пример 1'});
  await play.click();
  await page.waitForFunction(()=>window.__qaAudioStarted>=1,null,{timeout:9000});
  const audio=await page.evaluate(()=>({src:window.__qaAudioSource,duration:window.__qaAudioDuration,count:window.__qaAudioStarted}));
  check('MP3 plays after real touch tap and has nonzero audio duration',audio.duration>.4&&audio.src.includes('/english/audio/')&&audio.count>=1);
  check('no sound error shown after playback',await portal.locator('.english-audio-error').count()===0);
  await portal.getByRole('button',{name:'← К темам'}).click();
  const warning=page.getByRole('alertdialog',{name:'Предупреждение о незавершённом уроке'});
  await warning.getByRole('button',{name:'Выйти и сохранить ответы'}).click();
  const row=portal.locator('.english-lesson').first();
  check('resume and start over controls both available',await row.getByRole('button',{name:/Продолжить/}).count()===1&&await row.getByRole('button',{name:/Начать заново/}).count()===1);
  await row.getByRole('button',{name:/Начать заново/}).click();
  await confirm.getByRole('button',{name:'Да, начать с нуля'}).click();
  await portal.getByText('Вопрос 1 из 30').waitFor();
  check('list restart also resets first question',await portal.locator('.guided-feedback').count()===0);
  const active=englishSessions.find(x=>x.lesson_key==='eng2:to-be'&&x.status==='in_progress');
  const lesson=ENGLISH_LESSONS[0];
  for(let i=0;i<30;i++){
   const order=shuffledEnglishChoices(lesson.questions[i],active.id,i);
   await portal.locator('.english-options button').nth(order.indexOf(lesson.questions[i].correct)).click();
   if(i<29)await portal.getByRole('button',{name:'Следующий →'}).click();
  }
  await portal.getByRole('button',{name:'Завершить урок и получить 30 баллов'}).click();
  await portal.getByText(/Урок завершён. За повторение/).waitFor();
  check('repeated same-day lesson does not award extra 30',englishCredit===30&&englishSessions.some(x=>x.id===active.id&&x.points_awarded===0));
  await portal.getByRole('button',{name:/Повторить весь урок с начала/}).click();
  await confirm.getByRole('button',{name:'Да, начать с нуля'}).click();
  await portal.getByText('Вопрос 1 из 30').waitFor();
  check('restart from completed results begins a blank lesson',await portal.locator('.english-results').count()===0&&await portal.locator('.english-quiz-meta').innerText().then(x=>x.includes('Разобрано: 0/30')));
  check('completed history remains available to parent',englishSessions.some(x=>x.id===active.id&&x.status==='completed')&&englishSessions.some(x=>x.id.endsWith('76')&&x.status==='completed'));
  check('sound and restart create no JS exceptions',counters.errors.length===0,counters.errors.join(' | '));
  return;
 }
 if(englishTutorQA){
  await page.getByRole('button',{name:/Учёба/}).last().click();
  const entry=page.locator('.english-entry');
  check('English tutor entry is integrated in Study tab',await entry.isVisible()&&await entry.getByText('Английский с Миро').count()===1);
  await entry.getByRole('button').click();
  const portal=page.getByRole('dialog',{name:'Английский с Миро'});
  await portal.waitFor({state:'visible'});
  check('English tutor opens independently without leaving app',await portal.isVisible());
  if(role==='parent'){
   await portal.locator('.english-history').waitFor({state:'visible',timeout:5000});
   check('parent can see completed lessons and rewards',await portal.locator('.english-history').getByText('Am, is, are').count()===1&&await portal.locator('.english-history').getByText('+30 🏅').count()===1);
   check('parent cannot begin child lessons',await portal.locator('.english-lesson button').count()===0);
   await portal.getByRole('button',{name:'Закрыть репетитора'}).click();
   check('parent returns to school screen',await entry.isVisible());
  }else{
   check('child sees 18-question diagnostic',await portal.getByRole('button',{name:/Начать диагностику/}).count()===1);
   await portal.getByRole('button',{name:/Начать диагностику/}).click();
   await portal.getByText('Вопрос 1 из 18').waitFor({state:'visible',timeout:4000});
   check('diagnostic starts with 18 questions',await portal.getByText('Вопрос 1 из 18').count()===1);
   for(let i=0;i<18;i++){
    await portal.locator('.english-options button').first().click();
    if(i<17)await portal.getByRole('button',{name:'Следующий →'}).click();
   }
   await portal.getByRole('button',{name:'Узнать свой уровень'}).click();
   await portal.getByText('Диагностика завершена. Миро подготовил план занятий.').waitFor();
   check('diagnostic does not award points',englishCredit===0);
   check('diagnostic report explains individual answers',await portal.locator('.english-review').count()===18);
   await portal.getByRole('button',{name:'К списку тем →'}).click();
   await portal.locator('.english-lesson').first().getByRole('button',{name:/Начать с первого вопроса/}).click();
   await portal.getByText('Вопрос 1 из 30').waitFor({state:'visible',timeout:4000});
   check('English lesson has 30 meaningful questions rather than six',await portal.locator('.english-rule').isVisible()&&await portal.getByText('Вопрос 1 из 30').count()===1);
   await portal.locator('.english-ai').getByRole('button',{name:'Открыть'}).click();
   await portal.getByRole('button',{name:'Поговорим на английском'}).click();
   await portal.locator('.english-chat-msg.assistant').waitFor();
   check('AI English conversation returns a reply',await portal.locator('.english-chat-msg.assistant').innerText().then(x=>x.includes('Hello!')));
   const target=ENGLISH_LESSONS[0];
   const row=englishSessions.find(x=>x.lesson_key===target.id&&x.status==='in_progress');
   if(!row)throw Error('New English 30-question session missing');
   const first=target.questions[0],firstOrder=shuffledEnglishChoices(first,row.id,0);
   await portal.locator('.english-options button').nth(firstOrder.indexOf((first.correct+1)%3)).click();
   await portal.locator('.guided-feedback').getByText(/Ещё одна попытка/).waitFor();
   check('English Miro immediately explains wrong choice with rule and reason',await portal.locator('.guided-feedback').getByText(/Правило/).count()>0&&await portal.locator('.guided-feedback').getByText(/Объяснение/).count()>0);
   check('English cannot skip an uncorrected mistake',await portal.getByRole('button',{name:'Следующий →'}).isDisabled());
   await portal.getByRole('button',{name:'Закрыть репетитора'}).click();
   const warn=page.getByRole('alertdialog',{name:'Предупреждение о незавершённом уроке'});
   await warn.waitFor({state:'visible'});
   check('warning explicitly says 30 points will not be issued on early exit',await warn.getByText(/30 баллов пока не начислятся/).isVisible());
   await warn.getByRole('button',{name:'Продолжить занятие'}).click();
   check('staying returns to unfinished question',await portal.getByText('Вопрос 1 из 30').isVisible());
   await portal.getByRole('button',{name:'← К темам'}).click();
   await warn.waitFor({state:'visible'});
   await warn.getByRole('button',{name:'Выйти и сохранить ответы'}).click();
   await portal.locator('.english-lesson').first().getByRole('button',{name:/Продолжить/}).waitFor({state:'visible',timeout:6000});
   await portal.locator('.english-lesson').first().getByRole('button',{name:/Продолжить/}).click();
   await portal.getByText('Вопрос 1 из 30').waitFor();
   check('incomplete English lesson reopens with original error intact',await portal.locator('.guided-feedback').getByText(/Ещё одна попытка/).count()===1);
   await portal.locator('.english-options button').nth(firstOrder.indexOf(first.correct)).click();
   check('correction is taught without rewriting the first answer',await portal.locator('.guided-feedback').getByText(/Теперь правильно/).count()===1);
   for(let i=1;i<30;i++){
    await portal.getByRole('button',{name:'Следующий →'}).click();
    const q=target.questions[i],order=shuffledEnglishChoices(q,row.id,i);
    await portal.locator('.english-options button').nth(order.indexOf(q.correct)).click();
   }
   await portal.getByRole('button',{name:'Завершить урок и получить 30 баллов'}).click();
   await portal.getByText(/\+30 баллов добавлено в семейный баланс/).waitFor();
   check('completed 15-minute learning lesson awards exactly 30 points',englishCredit===30&&englishSessions.some(x=>x.lesson_key==='eng2:to-be'&&x.points_awarded===30&&x.score===29));
   check('results include 30 explanations and preserve initial error',await portal.locator('.english-review').count()===30&&await portal.locator('.english-review.incorrect').count()===1);
   check('English credit added once to the family server overview',englishCredit===30);
   await portal.getByRole('button',{name:'К списку тем →'}).click();
   check('lesson history recorded on the server',await portal.locator('.english-history').getByText('Am, is, are').count()===1);
   await portal.getByRole('button',{name:'Закрыть репетитора'}).click();
   check('learning did not crash school screen',await entry.isVisible());
   await page.getByRole('button',{name:/Мир/}).last().click();
   await page.getByText(/Баланс: 1730/).waitFor({state:'visible',timeout:6500});
   check('family balance increases by 30 points',await page.getByText(/Баланс: 1730/).count()>0);
  }
  check('English tutor leaves no JS errors',counters.errors.length===0,counters.errors.join(' | '));
  return;
 }
 if(worldConflictQA){
  const editor=page.locator('.world3d-decoration-editor');await editor.locator('summary').click();
  const warning=editor.locator('.world3d-cloud-conflict');await warning.waitFor({state:'visible',timeout:6000});
  check('independent phone and cloud layouts prompt a conflict instead of silent overwrite',await warning.getByText('Найдены два варианта острова').isVisible());
  const key='moymir-world-decor-v1:'+encodeURIComponent(ids.child)+':w1';
  check('existing local layout preserved before a decision',await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').flowerpot?.rotation===45,key));
  if(role==='parent'){
   await warning.getByRole('button',{name:'☁️ Взять из облака'}).click();
   check('choosing cloud restores cloud rotation 90',await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').flowerpot?.rotation===90,key));
  }else{
   await warning.getByRole('button',{name:'📱 Оставить этот телефон'}).click();
   await page.waitForFunction(()=>!document.querySelector('.world3d-cloud-conflict'),undefined,{timeout:5000});
   check('choosing phone uploads local layout to family cloud',decorCloud.get(ids.child+':1')?.layout?.flowerpot?.rotation===45);
  }
  check('conflict solution retains balance and works without render errors',await page.getByText(/Баланс: 1700/).count()>0&&counters.errors.length===0);
  return;
 }
 if(worldDecorQA){
  const editor=page.locator('.world3d-decoration-editor');
  check('decorating controls exist',await editor.count()===1);
  await editor.locator('summary').click();
  check('first world offers five earned decorations',await editor.locator('.world3d-decor-item').count()===5&&await editor.getByRole('button',{name:'Переставить'}).count()===5);
  check('flying original Miro remains on the island',await page.locator('.miro-flight-zone .miro-robot svg').count()===1);
  await editor.locator('.world3d-decor-item').filter({hasText:'Горшок с цветами'}).getByRole('button',{name:'Переставить'}).click();
  check('flowerpot enters placement mode',await editor.getByRole('button',{name:'Отменить перестановку'}).count()===1);
  const canvas=page.locator('.world3d-viewport canvas');
  await canvas.scrollIntoViewIfNeeded();
  const bounds=await canvas.boundingBox();
  if(!bounds)throw Error('3D canvas bounds unavailable');
  const camera=new PerspectiveCamera(37,bounds.width/bounds.height,.1,100);
  camera.position.set(6.3,7.2,9);camera.lookAt(0,.55,0);camera.updateMatrixWorld();
  const hit=new Vector3(-.5,.09,1.10).project(camera);
  const clickX=bounds.x+(1+hit.x)*bounds.width*.5;
  const clickY=bounds.y+(1-hit.y)*bounds.height*.5;
  if(process.env.QA_TOUCH==='1')await page.touchscreen.tap(clickX,clickY);
  else await page.mouse.click(clickX,clickY);
  const key='moymir-world-decor-v1:'+encodeURIComponent(ids.child)+':w1';
  check('position is only previewed until confirmation',await page.evaluate(key=>!localStorage.getItem(key)||!JSON.parse(localStorage.getItem(key)).flowerpot,key));
  check('greenhouse editor lets player rotate 45 degrees',await editor.getByRole('button',{name:'↻ Повернуть 45°'}).count()===1);
  await editor.getByRole('button',{name:'↻ Повернуть 45°'}).click();
  check('confirm location enabled for available lawn',await editor.getByRole('button',{name:'✓ Подтвердить место'}).isEnabled(),await editor.locator('.world3d-preview-hint').innerText());
  await editor.getByRole('button',{name:'✓ Подтвердить место'}).click();
  await editor.locator('.world3d-decor-status').waitFor({state:'visible',timeout:3500});
  const note=await editor.locator('.world3d-decor-status').innerText();
  check('placing flowerpot on empty lawn saved after confirmation',note.includes('сохранено'),note);
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}'),key);
  check('layout saves coordinates and rotation in child-specific first-world key',saved.flowerpot&&Math.abs(saved.flowerpot.x+.5)<.17&&Math.abs(saved.flowerpot.z-1.20)<.17&&saved.flowerpot.rotation===45,JSON.stringify(saved));
  await page.waitForFunction(()=>document.querySelector('.world3d-decoration-editor small')?.textContent?.includes('синхронизированы'),undefined,{timeout:5000});
  check('cloud layout includes same child world and rotation',decorCloud.get(ids.child+':1')?.layout?.flowerpot?.rotation===45);
  check('placing decor leaves family score unchanged',await page.getByText(/Баланс: 1700/).count()>0&&counters.restWrites.every(x=>x.name!=='point_ledger'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByText(/Прежний прогресс подключён/).first().waitFor();
  await page.locator('.world3d-viewport canvas').waitFor();
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}'),key);
  check('decor layout persists after app reload',JSON.stringify(saved)===JSON.stringify(after));
  await page.evaluate(key=>localStorage.removeItem(key),key);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'{}').flowerpot?.rotation===45,key,{timeout:7000});
  check('cloud restores decoration after local cache disappears',await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').flowerpot.rotation===45,key));
  const editor2=page.locator('.world3d-decoration-editor');await editor2.locator('summary').click();
  await editor2.locator('.world3d-decor-item').filter({hasText:'Горшок с цветами'}).getByRole('button',{name:/Вернуть/}).click();
  check('return to original location resets custom layout',await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').flowerpot===undefined,key));
  await page.waitForTimeout(300);
  check('cloud reset also removes moved flowerpot',decorCloud.get(ids.child+':1')?.layout?.flowerpot===undefined);
  if(role==='child'){
   await page.getByRole('button',{name:'🌳 Открыть второй мир'}).click();
   await page.getByRole('button',{name:/Домик на дереве/}).waitFor({state:'visible'});
   const editor3=page.locator('.world3d-decoration-editor');await editor3.locator('summary').click();
   check('second world keeps locked decorations locked',await editor3.getByText(/🔒 480 баллов/).count()>0&&await editor3.getByRole('button',{name:'Переставить'}).count()===0);
  }else check('parent cannot unlock second world without child confirmation',await page.getByRole('button',{name:/Домик на дереве/}).isDisabled());
  check('first world customization does not affect second world',await page.evaluate(()=>{const raw=localStorage.getItem('moymir-world-decor-v1:'+encodeURIComponent('22222222-2222-4222-8222-222222222222')+':w2');return !raw||Object.keys(JSON.parse(raw)).length===0}));
  check('all decor interactions are free of rendering errors',counters.errors.length===0);
  return;
 }
 if(worldMilestoneQA){
  earnedMock+=30;
  await page.locator('.mw-cloud-syncbar button').first().click();
  await page.locator('.miro-flight-zone .miro-speech').waitFor({state:'visible',timeout:12000});
  check('Flying Miro reacts to earned points after the 1600-point building cap',await page.locator('.miro-speech').innerText().then(t=>t.includes('Ура')));
  check('more earned points do not change completed first-world building stages',await page.locator('.world3d-bottom').innerText().then(t=>t.includes('1600 / 1600')));
  check('Miro achievement notification does not throw renderer errors',counters.errors.length===0);
  return;
 }
 // Camera controls should be present for every role, and must not corrupt the 3D scene.
 if(!approvalQA){
  const orbit=page.getByRole('group',{name:'Управление камерой 3D-мира'});
  await page.locator('.world3d-viewport canvas').waitFor({state:'visible',timeout:15000});
  check('3D world camera controls visible',await orbit.count()===1);
  if(process.env.QA_SHOT==='1'&&role==='child'){
   await page.locator('.world3d-viewport').scrollIntoViewIfNeeded();
   await page.waitForTimeout(400);
   await page.screenshot({path:'/tmp/moymir3816_initial_screen.png'});
   await page.waitForTimeout(3000);
   await page.screenshot({path:'/tmp/moymir3816_moving_screen.png'});
  }
  check('3D world camera has zoom in/out, reset and fullscreen',
   await orbit.getByRole('button',{name:'Приблизить 3D-мир'}).count()===1 &&
   await orbit.getByRole('button',{name:'Отдалить 3D-мир'}).count()===1 &&
   await orbit.getByRole('button',{name:'Вернуть первоначальный вид 3D-мира'}).count()===1 &&
   await orbit.getByRole('button',{name:'Развернуть 3D-мир на весь экран'}).count()===1);
  await orbit.getByRole('button',{name:'Приблизить 3D-мир'}).click();
  await orbit.getByRole('button',{name:'Отдалить 3D-мир'}).click();
  await orbit.getByRole('button',{name:'Вернуть первоначальный вид 3D-мира'}).click();
  const canvas=page.locator('.world3d-viewport canvas');
  await canvas.scrollIntoViewIfNeeded();
  const bounds=await canvas.boundingBox();
  if(bounds){
   await page.mouse.move(bounds.x+bounds.width*.45,bounds.y+bounds.height*.45);
   await page.mouse.down();
   await page.mouse.move(bounds.x+bounds.width*.64,bounds.y+bounds.height*.55,{steps:6});
   await page.mouse.up();
  }
  check('3D orbit gesture leaves render healthy',await canvas.isVisible()&&counters.errors.length===0);
  const picker=page.locator('.world3d-object-picker');
  check('3D object picker appears',await picker.count()===1);
  await picker.locator('summary').click();
  check('3D lists only unlocked island decorations',await picker.getByRole('button').count()===8);
  check('original flying Miro restored without a second robot',await page.locator('.miro-flight-zone .miro-robot svg').count()===1&&await page.locator('.miro-world-control').count()===0);
  await page.getByRole('button',{name:'Открыть чат с Миро'}).dispatchEvent('click');
  check('flying Miro uses original assistant dialog',await page.getByRole('dialog',{name:/Миро/}).isVisible());
  await page.getByRole('button',{name:'Уменьшить Миро'}).click();
  check('assistant returns to flying companion',await page.getByRole('dialog',{name:/Миро/}).count()===0);
  const selected=page.getByRole('region',{name:'Осмотр постройки'});
  await picker.getByRole('button',{name:'🐶 Собачка'}).click();
  await page.locator('.world3d-dog-speech').waitFor({state:'visible',timeout:2500});
  check('3D dog reacts with bark and petting action',await selected.getByRole('button',{name:'🐾 Погладить собачку'}).count()===1&&await page.locator('.world3d-dog-speech').isVisible());
  await selected.getByRole('button',{name:'🐾 Погладить собачку'}).click();
  check('3D dog can bark repeatedly without damaging world',await selected.isVisible()&&counters.errors.length===0);
  check('flying Miro reacts to dog interaction',await page.locator('.miro-flight-zone .miro-speech').innerText().then(x=>x.includes('пёс')));
  check('3D dog gets play and rest controls',await selected.getByRole('button',{name:'🎾 Играть с мячиком'}).count()===1&&await selected.getByRole('button',{name:'😴 Дать отдохнуть'}).count()===1);
  await selected.getByRole('button',{name:'🎾 Играть с мячиком'}).click();
  check('ball play makes dog activity visible',await page.locator('.world3d-dog-speech').innerText().then(x=>x.includes('догоняет мячик')));
  await selected.getByRole('button',{name:'😴 Дать отдохнуть'}).click();
  check('dog can rest after playing without resetting progress',await page.locator('.world3d-dog-speech').innerText().then(x=>x.includes('прилегла'))&&counters.errors.length===0);
  if(process.env.QA_SHOT==='1'&&role==='child'){await page.locator('.world3d-viewport').scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.screenshot({path:'/tmp/moymir3816_dog_screen.png'});}
  await picker.getByRole('button',{name:'🏡 Домик на поляне'}).click();
  check('3D house selection shows contextual actions',await selected.isVisible()&&await selected.getByRole('button',{name:'🚪 Закрыть дверь'}).count()===1&&await selected.getByRole('button',{name:'💡 Выключить свет'}).count()===1);
  check('real doorway offers a view into furnished interior',await selected.getByRole('button',{name:'👀 Заглянуть внутрь'}).count()===1);
  await selected.getByRole('button',{name:'👀 Заглянуть внутрь'}).click();
  check('interior viewing keeps the Three.js scene active',await canvas.isVisible()&&counters.errors.length===0);
  if(process.env.QA_SHOT==='1'&&role==='child'){await page.locator('.world3d-viewport').scrollIntoViewIfNeeded();await page.waitForTimeout(900);await page.screenshot({path:'/tmp/moymir3816_house_screen.png'});}
  await selected.getByRole('button',{name:'🚪 Закрыть дверь'}).click();
  check('3D house door can be toggled',await selected.getByRole('button',{name:'🚪 Открыть дверь'}).count()===1);
  await page.waitForFunction(()=>document.querySelector('.miro-flight-zone .miro-speech')?.textContent?.includes('открыл или закрыл дверь'),undefined,{timeout:3000});
  check('flying Miro reacts to door interaction',await page.locator('.miro-flight-zone .miro-speech').innerText().then(x=>x.includes('дверь')));
  await selected.getByRole('button',{name:'💡 Выключить свет'}).click();
  check('3D house lights can be toggled',await selected.getByRole('button',{name:'💡 Включить свет'}).count()===1);
  await picker.getByRole('button',{name:'🌳 Яблоня'}).click();
  check('3D tree inspection works',await selected.getByText('🌳 Яблоня').count()===1);
  await selected.getByRole('button',{name:'↺ Общий вид'}).click();
  await selected.getByRole('button',{name:'Закрыть осмотр и вернуться к общему виду'}).click();
  check('3D inspection closes without changing progress',await selected.count()===0&&await page.locator('.mw-coin').innerText().then(x=>x.includes('1700')));
  // Shoot a real ray through the rendered 3D house rather than using its accessible picker.
  await page.waitForTimeout(1600);
  await canvas.scrollIntoViewIfNeeded();
  const houseBounds=await canvas.boundingBox();
  if(houseBounds){
   const camera=new PerspectiveCamera(37,houseBounds.width/houseBounds.height,.1,100);
   camera.position.set(6.3,7.2,9);
   camera.lookAt(0,.55,0);
   camera.updateMatrixWorld();
   const hit=new Vector3(.8,2.35,.62).project(camera);
   const clickX=houseBounds.x+(1+hit.x)*houseBounds.width*.5;
   const clickY=houseBounds.y+(1-hit.y)*houseBounds.height*.5;
   if(process.env.QA_TOUCH==='1')await page.touchscreen.tap(clickX,clickY);
   else await page.mouse.click(clickX,clickY);
   check('direct 3D model click selects an island object',await selected.count()===1,`projected ${clickX.toFixed(0)} ${clickY.toFixed(0)}`);
  }
  if(worldInspectQA)return;
  if(role==='child'){
   await page.setViewportSize({width:320,height:700});
   const row=await orbit.boundingBox();
   check('3D camera toolbar fits narrow phone screen',!!row&&row.x>=0&&row.x+row.width<=321);
   await page.setViewportSize({width:390,height:860});
  }
 }
 if(approvalQA){
  const queue=page.getByRole('region',{name:'Ждёт вашего решения'});
  check('home queue is parent only',await queue.count()===(role==='parent'?1:0));
  if(role==='parent'&&await queue.count()){
   check('home shows daily completion and overdue task',await queue.getByText('Заправить кровать',{exact:true}).count()===1&&await queue.getByText('Сделать уроки',{exact:true}).count()===1);
   check('home shows requests for play and food',await queue.getByText(/10 мин/).count()===1&&await queue.getByText('Чечевица с морковью и хлебом').count()===1);
   await queue.getByText('Чечевица с морковью и хлебом').locator('..').locator('..').getByRole('button',{name:'Открыть'}).click();
   await page.locator('.mw-notification-target').filter({hasText:'Чечевица с морковью и хлебом'}).waitFor();
   check('food link opens exact card',await page.getByRole('region',{name:'Моя кухня'}).isVisible());
   await page.getByRole('button',{name:'Открыть настройки'}).click();
   await page.getByRole('button',{name:/🔔 Уведомления/}).click();
   await page.getByRole('button',{name:/Илья заправил кровать/}).click();
   await page.locator('.mw-notification-target').filter({hasText:'Заправить кровать'}).waitFor();
   check('notification opens and highlights exact daily card',await page.getByRole('heading',{name:'Проверка заданий'}).isVisible());
   await page.evaluate(id=>window.dispatchEvent(new CustomEvent('moymir-notification-open',{detail:{kind:'task_submitted',source_id:id}})),qaTask);
   await page.locator('.mw-notification-target').filter({hasText:'Сделать уроки'}).waitFor();
   check('Android payload opens exact previous-day submission',true);
   await page.evaluate(id=>window.dispatchEvent(new CustomEvent('moymir-notification-open',{detail:{kind:'reward_requested',source_id:id}})),qaReward);
   await page.locator('.mw-notification-target').filter({hasText:'Семейное кино'}).waitFor();
   check('Android reward payload opens exact request in shop history',true);
   await page.getByRole('navigation',{name:'Навигация'}).getByRole('button',{name:/Мир/}).click();
   await queue.getByRole('article').filter({hasText:'Заправить кровать'}).getByRole('button',{name:'Подтвердить'}).click();
   await queue.getByText('Заправить кровать',{exact:true}).waitFor({state:'detached'});
   check('home confirmation uses existing RPC with exact submission ID',counters.rpc.some(x=>x.name==='review_daily_chore'&&x.body.p_completion===qaDaily&&x.body.p_approve));
  }
  return;
 }
 const myday=page.getByRole('region',{name:'Мой день'});
 check('smart daily planner exists',await myday.count()===1);
 check('three day modes and auto',await myday.getByRole('button',{name:/Утро/}).count()===1&&await myday.getByRole('button',{name:/После школы/}).count()===1&&await myday.getByRole('button',{name:/Вечер/}).count()===1);
 await myday.getByRole('button',{name:/Утро/}).click();
 const todaySubjects=schoolMatrix[new Date(dateToday+'T12:00:00').getDay()]||[];
 const morningCopy=await myday.innerText();
 check('morning reflects real Spanish subjects',todaySubjects.length?todaySubjects.some(subject=>morningCopy.includes(subject)):morningCopy.includes('Hoy no hay clases'));
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
   check('second 3D world retains camera controls',await page.getByRole('group',{name:'Управление камерой 3D-мира'}).count()===1);
   const secondPicker=page.locator('.world3d-object-picker');
   await secondPicker.locator('summary').click();
   check('second world keeps future home locked until earned',await secondPicker.getByRole('button',{name:'🌳 Домик на дереве'}).count()===0);
   await secondPicker.getByRole('button',{name:'🌲 Большое дерево'}).click();
   const secondInspect=page.getByRole('region',{name:'Осмотр постройки'});
   check('second world offers focus on earned parts',await secondInspect.isVisible()&&await secondInspect.getByText('🌲 Большое дерево').count()===1);
   if(process.env.QA_SHOT==='1'){await page.locator('.world3d-viewport').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/moymir3816_treehouse_screen.png'});}
   check('second world keeps original floating Miro with working chat',await page.locator('.miro-flight-zone .miro-robot svg').count()===1&&await page.locator('.miro-world-control').count()===0);
   check('second world does not unlock door/light interactions early',await secondInspect.getByRole('button',{name:/дверь|свет/}).count()===0);
   await secondInspect.getByRole('button',{name:'Закрыть осмотр и вернуться к общему виду'}).click();
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
 check('geography game launcher appears inside study',await page.locator('.geo-entry').count()===1);
 await page.locator('.geo-entry button').click();
 check('geography opens separate fullscreen game',await page.getByRole('dialog',{name:'La misión del clima'}).count()===1);
 check('geography has four missions',await page.locator('.geo-category').count()===4);
 check('geography shows 100 questions and 50 illustrations',await page.getByText('📘 100 preguntas').count()===1&&await page.getByText('🖼️ 50 ilustraciones').count()===1);
 if(role==='child'){
  check('geography starts with 30 minute option',await page.locator('.geo-time-options button.active').textContent().then(x=>x?.includes('30')));
  await page.getByRole('button',{name:'20 min'}).click();
  check('geography allows selecting test time',await page.locator('.geo-time-options button.active').textContent().then(x=>x?.includes('20')));
  await page.locator('.geo-category').first().getByRole('button',{name:/Empezar misión/}).click();
  await page.locator('.geo-options button').first().waitFor({state:'visible'});
  check('shuffled quiz shows correct first answer under C',await page.locator('.geo-options button').nth(2).innerText().then(x=>x.includes('La capa de gases')));
  await page.locator('.geo-options button').nth(2).click();
  await page.getByText('🎉 ¡Correcto!').waitFor({state:'visible',timeout:5000});
  check('shuffled C answer verified and explanation shown',await page.getByText('🎉 ¡Correcto!').count()===1);
  await page.getByRole('button',{name:/Siguiente pregunta/}).click();
  check('second question correct answer now under A',await page.locator('.geo-options button').first().innerText().then(x=>x.includes('La troposfera')));
  check('quiz tracks one submitted answer',geographyAttempts[0]?.answered_count===1 && geographyAttempts[0]?.answers[0]?.choice===2);
  await page.getByRole('button',{name:/Volver a las misiones/}).click();
  await page.locator('.geo-history-item').first().waitFor({state:'visible',timeout:5000});
  check('quiz saved an in-progress attempt',await page.locator('.geo-history-item').count()>=1);
  await page.locator('.geo-history-item').first().click();
  check('report preserves shuffled chosen letter C',await page.locator('.geo-report-row').first().innerText().then(x=>x.includes('C.')&&x.includes('La capa de gases')));
  await page.getByRole('button',{name:/Volver al informe/}).click();
 }else check('parent can see geography reports',await page.getByRole('heading',{name:'Informe de geografía'}).count()===1);
 await page.getByRole('button',{name:'Cerrar juego'}).click();
 check('closing geography returns to school',await page.getByRole('heading',{name:'Учёба'}).count()===1);
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
   // Some weekdays do not contain Mathematics: use today if the next day has no backpack item.
   if(!(await bag.count()))await page.locator('.backpack-hub').getByRole('button',{name:'Сегодня',exact:true}).click();
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
  check('daily task has Bible reference',await growth.locator('.growth-principle strong').innerText().then(x=>/\d+:\d+/.test(x)), 'All biblical books accepted, not just four');
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
 const alarmTime=alarm.locator('input[type=time]');
 const alarmDay=alarm.locator('.miro-alarm-week button').first();
 const alarmEnabled=alarm.locator('.miro-alarm-switch input[type=checkbox]');
 check('alarm controls editable for child and parent',await alarmTime.isEnabled()&&await alarmDay.isEnabled()&&await alarmEnabled.isEnabled());
 await alarmTime.fill('06:45');
 check('alarm time changes in UI',await alarm.locator('.miro-alarm-time').innerText()==='06:45');
 const mondayBefore=await alarmDay.getAttribute('aria-pressed');
 await alarmDay.click();
 check('alarm weekday toggles in UI',(await alarmDay.getAttribute('aria-pressed'))!==mondayBefore);
 await alarmEnabled.check();
 check('alarm enabled from child or parent profile',await alarmEnabled.isChecked());
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

 // A previous parent-only local journal must remain migratable.
 if(role==='parent')await page.evaluate(id=>{
  const key='moymir-health-local-v1:'+id;
  const data=JSON.parse(localStorage.getItem(key)||'{}');
  data.measurements=[{id:'legacy-test-001',date:'2026-08-01',height:148.5,weight:47}];
  localStorage.setItem(key,JSON.stringify(data));
 },ids.child);
 // My Health is reached from settings without adding a seventh bottom tab.
 await page.locator('.mw-settings-tile').filter({hasText:'Моё здоровье'}).getByRole('button').click();
 const health=page.locator('.h-health');
 check('My Health opens from settings',await health.count()===1);
 check('health screen opens from top',await page.locator('.mw-scroll').evaluate(el=>el.scrollTop<5));

 const themeControls=health.getByRole('group',{name:'Тема оформления всего приложения'});
 check('health has three theme options',await themeControls.getByRole('button').count()===3);
 await page.setViewportSize({width:390,height:790});
 await themeControls.getByRole('button',{name:'Тема: День'}).click();
 check('health day mode selected',await health.getAttribute('data-theme')==='day');
 const dayBg=await health.locator('.h-hero').evaluate(el=>getComputedStyle(el).backgroundImage);
 await health.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-health-stage1-day-'+role+'.png'});
 await themeControls.getByRole('button',{name:'Тема: Ночь'}).click();
 const nightBg=await health.locator('.h-hero').evaluate(el=>getComputedStyle(el).backgroundImage);
 check('health night mode selected',await health.getAttribute('data-theme')==='night');
 check('night mode applied to whole application',await page.locator('.mw-root').getAttribute('data-app-theme')==='night');
 await page.waitForTimeout(350);
 check('global night mode darkens app header and nav',await page.locator('.mw-top').evaluate(el=>getComputedStyle(el).backgroundColor)==='rgb(23, 42, 68)'&&await page.locator('.mw-bottom').evaluate(el=>getComputedStyle(el).backgroundColor)==='rgb(23, 42, 68)');
 check('night and day have distinct rendered backgrounds',dayBg!==nightBg);
 check('dark theme text has readable contrast',await health.locator('.h-card-heading h2').first().evaluate(el=>getComputedStyle(el).color)==='rgb(246, 250, 255)');
 check('health theme saved locally',await page.evaluate(id=>localStorage.getItem('moymir-app-theme-v1')==='night',ids.child));
 await health.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-health-stage1-night-'+role+'.png'});
 await themeControls.getByRole('button',{name:'Тема: Авто'}).click();
 await page.emulateMedia({colorScheme:'dark'});
 await page.waitForFunction(()=>document.querySelector('.h-health')?.getAttribute('data-theme')==='night',{timeout:4000});
 check('automatic theme follows Android dark preference',await health.getAttribute('data-theme')==='night');
 await page.emulateMedia({colorScheme:'light'});
 await page.waitForFunction(()=>document.querySelector('.h-health')?.getAttribute('data-theme')==='day',{timeout:4000});
 check('automatic theme follows Android light preference',await health.getAttribute('data-theme')==='day');
 check('automatic theme is persisted',await page.evaluate(id=>localStorage.getItem('moymir-app-theme-v1')==='auto',ids.child));
 await page.setViewportSize({width:320,height:700});
 check('theme fits compact Android screen',await health.evaluate(el=>el.scrollWidth<=el.clientWidth+1),await health.evaluate(el=>'scroll='+el.scrollWidth+',client='+el.clientWidth));
 await page.setViewportSize({width:390,height:790});


 check('Miro avatar shared with world',await health.locator('.h-miro svg').count()===1);
 check('sleep times on dashboard',await health.getByText(role==='parent'?'21:00':'21:15').count()>0&&await health.getByText('06:45').count()>0);
 check('five health habits visible',await health.locator('.h-habit').count()===5);
 await health.getByRole('checkbox',{name:'Подвигался утром'}).check();
 check('habit preserved in family history',await health.getByRole('checkbox',{name:'Подвигался утром'}).isChecked()&&healthDaily.some(x=>x.habits?.includes('morning')));
 check('nutrition does not award coins',await page.locator('.mw-coin').innerText().then(x=>x.includes('1700')));

 await health.getByRole('checkbox',{name:'Подвигался утром'}).uncheck();
 await health.locator('.h-navigation button').filter({hasText:'Зарядка'}).click();
 const exercise=health.getByRole('region',{name:'Зарядка с Миро'});
 const audioRequests=[];page.on('request',req=>{if(req.url().includes('/health/')&&req.url().endsWith('.mp3'))audioRequests.push(req.url())});
 check('animated game stage present',await exercise.locator('.ex-scene .ex-diagram svg').count()===1);
 check('Miro is original shared robot',await exercise.locator('.ex-miro svg').count()===1);
 check('seven exercise steps visible',await exercise.locator('.ex-track button').count()===7);
 check('full warmup seven minutes',await exercise.getByTestId('exercise-timer').innerText()==='00:40');
 await exercise.getByRole('button',{name:/Легче/}).click();
 check('easier exercise option works',await exercise.getByTestId('exercise-timer').innerText()==='00:25');
 await exercise.getByRole('button',{name:/Обычно/}).click();
 await exercise.getByRole('button',{name:/Начать \/ продолжить/}).click();
 await page.waitForTimeout(1450);
 check('game timer actually counts down',await exercise.getByTestId('exercise-timer').innerText()!=='00:40');
 check('movement figure animates when running',await exercise.locator('.ex-diagram.ex-animated').count()===1);
 check('same Miro avatar moves arms',await exercise.locator('.ex-miro.ex-miro-active .miro-arm-left').evaluate(el=>getComputedStyle(el).animationName)!=='none');
 check('offline music and voice requested',audioRequests.some(x=>x.includes('/health/morning.mp3'))&&audioRequests.some(x=>x.includes('/health/voice_intro.mp3')));
 await exercise.getByRole('button',{name:/Пауза/}).click();
 const pausedTimer=await exercise.getByTestId('exercise-timer').innerText();
 await page.waitForTimeout(1100);
 check('pause freezes exercise timer',await exercise.getByTestId('exercise-timer').innerText()===pausedTimer);
 await exercise.getByRole('button',{name:/Пропустить шаг/}).click();
 check('skip moves to next exercise',await exercise.getByText('Круги плечами').count()>0);
 await exercise.getByRole('button',{name:/Мне нужен отдых/}).click();
 check('rest stops workout',await exercise.getByText(/Сегодня можно отдохнуть/).count()===1);
 for(let i=0;i<6;i++)await exercise.getByRole('button',{name:/Пропустить шаг/}).click();
 check('celebration animation on completion',await exercise.locator('.ex-confetti').count()===1);
 check('completion is gentle and optional',await exercise.getByText(/Зарядка закончена/).count()===1);
 await health.locator('.h-navigation button').filter({hasText:'Сегодня'}).click();
 check('skipping the entire workout never falsely awards health habit',!(await health.getByRole('checkbox',{name:'Подвигался утром'}).isChecked()));
 await health.getByRole('checkbox',{name:'Подвигался утром'}).check();
 await health.locator('.h-navigation button').filter({hasText:'Зарядка'}).click();
 await page.setViewportSize({width:320,height:720});
 check('exercise fits small Android screen',await exercise.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await exercise.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-health-stage3-'+role+'.png'});
 await page.setViewportSize({width:390,height:790});
 await health.locator('.h-navigation button').filter({hasText:'Еда'}).click();
 const kitchen=health.locator('.h-kitchen');
 check('7-day menu after redesign',await kitchen.locator('.h-kitchen-week button').count()===7);
 check('four illustrated meals',await kitchen.locator('.h-food-card').count()===4&&await kitchen.locator('.h-food-art').count()===4);
 await kitchen.getByRole('button',{name:'📖 Рецепт'}).first().click();
 check('recipe opens in kitchen',await kitchen.locator('.h-food-recipe').count()===1);
 await kitchen.getByRole('button',{name:'Показать список покупок'}).click();
 check('shopping list derived from menu',await kitchen.locator('.h-food-shopping label').count()>=7);
 if(role==='parent'){
  await kitchen.getByRole('button',{name:'✏️ Редактировать блюда'}).click();
  await kitchen.getByRole('textbox',{name:'🌤️ Завтрак'}).fill('Овсянка с яблоком и молоком');
  await page.waitForTimeout(200);
  check('parent menu writes protected plan',counters.restWrites.some(x=>x.name==='moymir_health_plan'&&x.method==='POST'));
  check('parent menu stored for child',healthPlan?.meals?.some(m=>m.breakfast==='Овсянка с яблоком и молоком'));
  await kitchen.getByRole('button',{name:'✓ Завершить редактирование'}).click();
  await kitchen.getByRole('textbox',{name:'Аллергия или ограничение'}).fill('орехи');
  await kitchen.getByRole('button',{name:'Добавить'}).click();
  check('allergies shared in plan',healthPlan?.allergies?.includes('орехи'));
  await kitchen.getByRole('button',{name:'✓ Утвердить'}).first().click();
  await page.waitForTimeout(220);
  check('parent approves child proposal',healthRequests[0].status==='approved');
  check('approved proposal changes family menu',healthPlan?.meals?.[0]?.lunch==='Чечевица с морковью и хлебом');
 }else{
  check('child cannot edit family meal plan',await kitchen.getByRole('button',{name:/Редактировать блюда/}).count()===0);
  check('child sees parent approved menu',await kitchen.getByText('Овсянка с яблоком и молоком').count()>0);
  await kitchen.getByRole('button',{name:'💡 Предложить'}).first().click();
  await kitchen.locator('.h-food-alternatives>button').first().click();
  await page.waitForTimeout(250);
  check('child meal proposal posted',counters.restWrites.some(x=>x.name==='moymir_health_meal_requests'&&x.method==='POST'));
  await kitchen.getByRole('button',{name:'💡 Предложить'}).last().click();
  check('known allergy filters nut alternatives',await kitchen.locator('.h-food-alternatives>button').filter({hasText:'орех'}).count()===0);
  await kitchen.getByRole('button',{name:'💡 Предложить'}).last().click();

  check('child cannot approve own proposal',await kitchen.getByRole('button',{name:/Утвердить/}).count()===0);
 }
 await health.locator('.h-navigation button').filter({hasText:'Сон'}).click();
 const sleepHub=health.getByRole('region',{name:'Мой сон и самочувствие'});
 check('sleep diary and nightly routine visible',await sleepHub.count()===1&&await sleepHub.locator('.h-sleep-steps>div').count()===4);
 check('weekly sleep history visible',await sleepHub.locator('.h-sleep-week>div').count()===7);
 check('sleep controls restricted to parent',role==='child'?await sleepHub.locator('input[type=time]').count()===0:await sleepHub.locator('input[type=time]').count()===2);
 if(role==='parent'){
  await sleepHub.locator('input[type=time]').first().fill('21:15');
  await page.waitForTimeout(220);
  check('parent bedtime synced via protected plan',healthPlan?.bed_time==='21:15');
 }else{
  check('child sees parent bedtime',await sleepHub.getByText('21:15').count()>0);
 }
 await sleepHub.getByRole('button',{name:'😌 Хорошо'}).click();
 await sleepHub.getByRole('button',{name:'⚡ Бодрый'}).click();
 check('sleep and energy saved in protected daily journal',healthDaily.some(x=>x.sleep_quality==='great'&&x.energy==='high'));
 check('budilnik link available',await sleepHub.getByRole('button',{name:/Открыть будильник Миро/}).count()===1);
 await health.locator('.h-navigation button').filter({hasText:'Сад здоровья'}).click();
 const garden=health.getByRole('region',{name:'Сад здоровья'});
 check('interactive 3D garden created',await garden.locator('canvas').count()===1);
 check('16 accessible garden plots',await garden.locator('.h-garden-slots button').count()===16);
 check('9 garden decorations',await garden.locator('.h-garden-inventory button').count()===9);
 if(role==='child')check('child receives parent 3D garden decoration',await garden.getByRole('button',{name:'Сектор 1 flower'}).count()===1);
 await garden.getByRole('button',{name:role==='parent'?'Сектор 1 пустой':'Сектор 2 пустой'}).click();
 check('garden placement saved in family garden table',counters.restWrites.some(x=>x.name==='moymir_health_garden'&&x.method==='POST'));
 check('garden keeps flower on plot',await garden.getByRole('button',{name:role==='parent'?'Сектор 1 flower':'Сектор 2 flower'}).count()===1);
 await garden.getByRole('button',{name:'☁️ Дождик'}).click();
 check('garden weather decorative mode',await garden.locator('.h-garden-rain').count()===1);
 await garden.getByRole('button',{name:'▦ Список'}).click();
 check('garden has fallback list for weak phones',await garden.locator('.h-garden-fallback').count()===1);
 await garden.getByRole('button',{name:'🌿 3D'}).click();
 if(role==='child'){
  const quest=garden.getByRole('checkbox',{name:/Прогулялись вместе/});
  await quest.check();
  await page.waitForTimeout(130);
  check('family quest writes daily history',healthDaily.some(x=>x.habits?.includes('family_walk')));
  healthNetworkBlocked=true;
  await garden.getByRole('button',{name:'Сектор 3 пустой'}).click();
  await page.waitForTimeout(180);
  const offlineData=await page.evaluate(([family,child])=>{
   const p='moymir-health-cloud-v1:'+family+':'+child+':';
   return {garden:JSON.parse(localStorage.getItem(p+'garden')||'[]'),queue:JSON.parse(localStorage.getItem(p+'queue')||'[]')}
  },[ids.family,ids.child]);
  check('offline garden placement saved locally',offlineData.garden.some(x=>x.slot===2&&x.kind==='flower'));
  check('offline queue survives network failure',offlineData.queue.some(x=>x.type==='garden'));
  healthNetworkBlocked=false;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await page.waitForFunction(([family,child])=>{
   const k='moymir-health-cloud-v1:'+family+':'+child+':queue';
   return (JSON.parse(localStorage.getItem(k)||'[]')).length===0;
  },[ids.family,ids.child],{timeout:9000});
  check('offline garden queue flushed after reconnection',healthGarden?.placements?.some(x=>x.slot===2&&x.kind==='flower'));
 }
 await garden.locator('.h-garden-canvas').scrollIntoViewIfNeeded();
 await garden.locator('canvas').screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-health-stage6-webgl-'+role+'.png'});

 await page.setViewportSize({width:320,height:720});
 check('garden fits 320px screen',await garden.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await garden.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-health-stage6-garden-'+role+'.png'});
 await page.setViewportSize({width:390,height:790});
 if(role==='parent'){
  await health.locator('.h-navigation button').filter({hasText:'Родителю'}).click();
  check('parent health role preserved',await health.getByRole('button',{name:/Открыть семейный дневник/}).count()===1);
 }else{
  check('child has no parent health tab',await health.getByRole('button',{name:/Родителю/}).count()===0);
 }
 await health.locator('.h-navigation button').filter({hasText:'Я расту'}).click();
 const growthJournal=health.getByRole('region',{name:'Мой дневник роста'});
 check('growth journal visible in both roles',await growthJournal.count()===1);
 check('growth has date, height and weight inputs',await growthJournal.locator('.h-growth-form input').count()===3);
 check('two separate charts available',await growthJournal.locator('.h-growth-plot').count()===2);
 if(role==='parent'){
  check('legacy measurements found',await growthJournal.getByText(/старых записей из родительского журнала/).count()===1);
  await growthJournal.getByRole('button',{name:/Перенести в семейный дневник/}).click();
  await growthJournal.getByText(/Перенесено прежних измерений/).waitFor({timeout:5000});
  check('legacy parent measurement migrated to family',growthMeasurements.some(m=>m.measured_on==='2026-08-01'));
 }else{
  await growthJournal.getByText('148,5 см · 47 кг').waitFor({state:'visible',timeout:6000});
  check('child sees previous measurements from parent',await growthJournal.getByText('148,5 см · 47 кг').count()===1);
 }
 const form=growthJournal.locator('.h-growth-form');
 await form.locator('input[type=date]').fill(role==='parent'?'2026-09-01':dateToday);
 await form.locator('input[type=number]').first().fill(role==='parent'?'150.5':'153.5');
 await form.locator('input[type=number]').last().fill(role==='parent'?'48':'50');
 await growthJournal.getByRole('button',{name:'Сохранить измерение'}).click();
 await page.waitForTimeout(200);
 check('measurements saved through family RLS table',counters.restWrites.some(x=>x.name==='moymir_health_measurements'&&x.method==='POST'));
 check('history rendered',await growthJournal.locator('.h-growth-history').count()>=2);
 check('growth graph contains real points',await growthJournal.locator('.h-growth-plot svg circle').count()>=2);
 const currentRef=growthJournal.locator('.h-growth-history').first();
 await currentRef.getByRole('button',{name:/Исправить измерение/}).click();
 await form.locator('input[type=number]').first().fill('154.5');
 await growthJournal.getByRole('button',{name:'Сохранить исправление'}).click();
 await page.waitForTimeout(180);
 check('record correction writes to protected table',counters.restWrites.some(x=>x.name==='moymir_health_measurements'&&x.method==='PATCH'));
 check('corrected height visible in history',await growthJournal.getByText(/154,5 см/).count()>0);
 await page.setViewportSize({width:320,height:720});
 check('growth graphs and form fit small Android screen',await growthJournal.evaluate(el=>el.scrollWidth<=el.clientWidth+1),await growthJournal.evaluate(el=>'scroll='+el.scrollWidth+',client='+el.clientWidth));
 await growthJournal.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-health-stage2-growth-'+role+'.png'});
 await page.setViewportSize({width:390,height:790});

 page.once('dialog',d=>d.accept());
 await growthJournal.locator('.h-growth-history').first().getByRole('button',{name:/Удалить измерение/}).click();
 await page.waitForTimeout(130);
 check('delete operation guarded by server',counters.restWrites.some(x=>x.name==='moymir_health_measurements'&&x.method==='DELETE'));
 check('weight not involved in rewards',await page.locator('.mw-coin').innerText().then(x=>x.includes('1700')));
 await health.locator('.h-navigation button').filter({hasText:'Сегодня'}).click();
 check('child and parent have growth shortcut',await health.getByRole('button',{name:/Я расту!/}).count()===1);
 await page.getByRole('button',{name:'Открыть настройки'}).click();
 await page.locator('.mw-settings-tile').filter({hasText:'Моё здоровье'}).getByRole('button').click();
 check('health habits survive navigation',await page.locator('.h-health').getByRole('checkbox',{name:'Подвигался утром'}).isChecked());
 check('health saved automatic theme survives navigation',await page.locator('.h-health').getAttribute('data-theme-choice')==='auto');
 // Whole-app theme must be switchable from settings, and visible in every top-level screen.
 await page.getByRole('button',{name:'Открыть настройки'}).click();
 const accessPanel=page.locator('.mw-parent-recovery');
 check('recovery is parent-only',await accessPanel.count()===(role==='parent'?1:0));
 if(role==='parent'){
  await accessPanel.locator('summary').click();
  check('recovery form requires three passwords',await accessPanel.locator('input[type=password]').count()===3);
  check('recovery disabled until filled',await accessPanel.getByRole('button',{name:'Сменить пароль ребёнка'}).isDisabled());
 }
 const globalTheme=page.getByRole('group',{name:'Тема оформления всего приложения'});
 check('full app theme switch available in Settings',await globalTheme.count()===1);
 await globalTheme.getByRole('button',{name:'Тема: Ночь'}).click();
 await page.waitForTimeout(350);
 check('settings are dark after global theme switch',await page.locator('.mw-root').getAttribute('data-app-theme')==='night');
 const darkTop=await page.locator('.mw-top').evaluate(el=>getComputedStyle(el).backgroundColor);
 await page.getByRole('button',{name:/Дела/}).last().click();
 check('dark theme covers tasks',await page.locator('.mw-root').getAttribute('data-app-theme')==='night'&&await page.locator('.mw-scroll').evaluate(el=>getComputedStyle(el).backgroundImage.includes('gradient')));
 await page.getByRole('button',{name:/Учёба/}).last().click();
 check('dark theme covers school',await page.locator('.mw-root').getAttribute('data-app-theme')==='night');
 await page.getByRole('button',{name:/Магазин/}).last().click();
 check('dark theme covers shop',await page.locator('.mw-root').getAttribute('data-app-theme')==='night');
 await page.getByRole('button',{name:/Духовный рост/}).last().click();
 check('dark theme covers spiritual growth',await page.locator('.mw-root').getAttribute('data-app-theme')==='night');
 await page.getByRole('button',{name:/Семья/}).last().click();
 check('dark theme covers family chat',await page.locator('.mw-root').getAttribute('data-app-theme')==='night');
 await page.getByRole('button',{name:/Мир/}).last().click();
 check('dark theme covers world and retains Miro',await page.locator('.mw-root').getAttribute('data-app-theme')==='night'&&await page.locator('.mw-hero-profile img').count()===1);
 check('global theme changes no world points',await page.locator('.mw-coin').innerText().then(x=>x.includes('1700')));
 await page.getByRole('button',{name:'Открыть настройки'}).click();
 await page.getByRole('group',{name:'Тема оформления всего приложения'}).getByRole('button',{name:'Тема: Авто'}).click();
 check('global theme settings survive within same session',await page.locator('.mw-root').getAttribute('data-app-theme-choice')==='auto'&&darkTop==='rgb(23, 42, 68)');
 await page.locator('.mw-settings-tile').filter({hasText:'Моё здоровье'}).getByRole('button').click();

 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.mw-health-shortcut').waitFor({state:'visible',timeout:10000});
 await page.locator('.mw-health-shortcut').click();
 check('health theme survives full app restart',await page.locator('.h-health').getAttribute('data-theme-choice')==='auto');
 check('whole-app theme survives restart',await page.locator('.mw-root').getAttribute('data-app-theme-choice')==='auto');
 check('health habits survive app restart',await page.locator('.h-health').getByRole('checkbox',{name:'Подвигался утром'}).isChecked());


 await page.locator('.h-health').screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-health-'+role+'-3.4.png'});

 check('single-row six bottom tabs',await page.locator('.mw-bottom button').count()===6);
 check('no JS exceptions',counters.errors.length===0,counters.errors.join(' | '));
 await page.screenshot({path:'/Volumes/Дополнительная память/MOY_MIR_2_GAME/docs/qa-'+role+'-2.8.png'});
 if(role==='child'){
  await page.getByRole('button',{name:/Родители/}).first().click();
  check('parent switch shows family account even outside world tab',await page.getByRole('heading',{name:'Семейный аккаунт'}).count()===1);
  await page.getByRole('button',{name:'Выйти',exact:true}).click();
  await page.waitForTimeout(450);
  check('local logout switches to login without network roundtrip',await page.getByRole('heading',{name:'🔐 Подключить прежний «Мой Мир»'}).count()>0);
  check('login fields shown for parent account',await page.getByRole('textbox',{name:'Почта семейного аккаунта'}).count()===1);
 }

 }catch(e){console.log('TEST_EXCEPTION',role,e.message.slice(0,650));failures++}
 await ctx.close();
}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_PATH||'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',args:['--enable-unsafe-swiftshader']});await run('parent',browser);await run('child',browser);await browser.close();console.log('TOTAL_FAILS',failures);process.exitCode=failures?1:0})().catch(e=>{console.error(e);process.exit(1)})
