import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
const port=5258;
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--mode','android','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe']});
let output='';
server.stderr.on('data',b=>output+=String(b));
server.stdout.on('data',b=>output+=String(b));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 let ready=false;
 for(let attempt=0;attempt<35;attempt++){
  await sleep(200);
  try{const r=await fetch('http://127.0.0.1:'+port+'/');if(r.ok){ready=true;break}}catch{}
 }
 if(!ready)throw Error('Preview did not start: '+output);
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const errors=[];
 const missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)missing.push(r.url()+' '+r.status())});
 const response=await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'networkidle',timeout:30000});
 await page.waitForTimeout(1500);
 const root=await page.locator('#root').innerText();
 if(response.status()!==200||!root.includes('МОЙ МИР')||!root.includes('3.8.0')||errors.length||missing.length)throw Error(JSON.stringify({code:response.status(),root:root.slice(0,300),errors,missing}));
 console.log('PASS: Android-root build mobile browser opened My World 3.8.0, UI rendered, no JS errors, no missing assets');
 await page.screenshot({path:'docs/qa-android-3.8.0.png'});
 await context.close();
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
