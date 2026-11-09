import {readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
const svg=readFileSync('public/alarm/miro-from-world.svg','utf8');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'});
try{
 const page=await browser.newPage({viewport:{width:640,height:730},deviceScaleFactor:1});
 await page.setContent('<html><body style="margin:0;background:transparent"><div style="width:640px;height:730px;display:flex;align-items:center;justify-content:center">'+svg+'</div></body></html>');
 await page.locator('svg').evaluate(e=>{e.style.width='640px';e.style.height='730px'});
 await page.locator('div').screenshot({path:'android/app/src/main/res/drawable/miro_alarm_robot.png',omitBackground:true});
 console.log('Generated native Android alarm robot PNG from exact in-world Miro SVG');
}finally{await browser.close()}
