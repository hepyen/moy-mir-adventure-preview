const {buildSync}=require('esbuild');
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
const build=await require('esbuild').build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {CalendarNotice} from './src/features/CalendarNotice';createRoot(document.getElementById('root')).render(<><button id="main">Главный экран</button><CalendarNotice family="synthetic-family" child="synthetic-child"/></>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic',outfile:'qa.js',plugins:[{name:'mock-db',setup(b){b.onResolve({filter:/^\.\.\/lib\/supabase$/},()=>({path:'mock',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:`export const supabase={from(table){const q={select(){return q},eq(){return q},gte(){return q},order(){return q},limit(){return q},in(){return q},insert(v){q.receipt=v;return q},abortSignal(signal){if(table==='moymir_family_calendar')return Promise.resolve({data:[{id:'test-event',revision:window.rev||1,title:'Тестовое событие',event_date:'2099-01-01',event_time:null,note:''}],error:null});if(!q.receipt)return Promise.resolve({data:window.receipts||[],error:null});window.attempts=(window.attempts||0)+1;if(window.mode==='hang')return new Promise(resolve=>signal.addEventListener('abort',()=>resolve({error:{code:'timeout'}}),{once:true}));if(window.mode==='fail')return Promise.resolve({error:{code:'42501'}});window.receipts=[...(window.receipts||[]),q.receipt];return Promise.resolve({error:null})}};return q}}`,loader:'js'}));}}]});
const js=build.outputFiles.find(f=>f.path.endsWith('.js')).text;
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'});
try{
const page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
await page.route('https://calendar-qa.invalid/**',r=>r.fulfill({contentType:'text/html',body:'<div id="root"></div><script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>'}));
await page.addInitScript(()=>{window.mode='hang'});
await page.goto('https://calendar-qa.invalid/');
await page.getByText('✓ Я прочитал',{exact:true}).tap();
await page.getByRole('dialog').waitFor({state:'hidden',timeout:1500});
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('moymir-calendar-pending-v1:synthetic-family:synthetic-child')).length),1);
console.log('PASS immediate dismissal with hanging server; receipt queued');
await page.reload();await page.waitForTimeout(700);assert.equal(await page.getByRole('dialog').count(),0);
console.log('PASS pending receipt survives restart');
await page.evaluate(()=>{window.mode='ok';window.dispatchEvent(new Event('online'))});
await page.waitForFunction(()=>!localStorage.getItem('moymir-calendar-pending-v1:synthetic-family:synthetic-child'),{},{timeout:18000});
console.log('PASS retry saves actual receipt');
await page.evaluate(()=>{window.rev=2;window.mode='fail';window.dispatchEvent(new Event('online'))});
await page.getByText('✓ Я прочитал',{exact:true}).tap({timeout:12000});
await page.getByRole('dialog').waitFor({state:'hidden',timeout:1500});
console.log('PASS revised event appears; server rejection does not lock UI');
await page.evaluate(()=>{window.rev=3;window.dispatchEvent(new Event('online'))});
await page.getByText('Позже · вернуться в приложение',{exact:true}).tap({timeout:12000});
await page.getByRole('dialog').waitFor({state:'hidden',timeout:1500});
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('moymir-calendar-pending-v1:synthetic-family:synthetic-child')).some(x=>x.revision===3)),false);
console.log('PASS defer without fake read receipt');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
