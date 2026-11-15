import {chromium} from 'playwright-core';
import {readFileSync} from 'node:fs';
const bank=readFileSync('src/pioneer/bank.txt','utf8').trim().split(/\r?\n/).map(line=>line.split('|'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4191/',{waitUntil:'networkidle'});
const seen=new Set(),letters=[];
for(let round=1;round<=5;round++){
 await page.locator('.pn-level.open').first().click();
 for(let i=0;i<10;i++){
  const title=(await page.locator('.pn-question-wrap h1').textContent())?.trim();
  const bankQuestion=bank.find(row=>row[0]===title);
  if(!bankQuestion)throw Error('Unknown question '+title);
  if(seen.has(title))throw Error('Repeated question before five rounds: '+title);
  seen.add(title);
  const options=await page.locator('.pn-option > span:nth-child(2)').allTextContents();
  const idx=options.findIndex(x=>x===bankQuestion[1]);if(idx<0)throw Error('Missing correct answer '+title);
  letters.push(idx);
  await page.locator('.pn-option').nth(idx).click();
  await page.locator('.pn-feedback button').click();
 }
 await page.getByRole('button',{name:/Вернуться к достижениям/}).click();
 console.log('ROUND',round,'unique questions',seen.size);
}
const total=(await page.locator('.pn-hero-stat b').first().textContent())?.trim();
if(total!=='50')throw Error('Expected 50 points after five wins, received '+total);
const stored=JSON.parse(await page.evaluate(()=>localStorage.getItem('moymir-pioneer-tv-2026-v1')));
if(stored.used['1'].length!==50)throw Error('Question cycle does not exhaust 50');
console.log('POSITIONS',letters.reduce((o,v)=>(o[v]=(o[v]||0)+1,o),{}));
await page.locator('.pn-level.open').first().click();
const after=JSON.parse(await page.evaluate(()=>localStorage.getItem('moymir-pioneer-tv-2026-v1')));
if(after.used['1'].length!==10||after.cycles['1']!==2)throw Error('New cycle did not start cleanly');
const title=(await page.locator('.pn-question-wrap h1').textContent())?.trim();
const bankQ=bank.find(row=>row[0]===title);
const options=await page.locator('.pn-option > span:nth-child(2)').allTextContents();
const wrong=options.findIndex(x=>x!==bankQ[1]);
await page.locator('.pn-option').nth(wrong).click();
await page.getByRole('button',{name:/Посмотреть результат/}).click();
await page.getByRole('button',{name:/Вернуться к достижениям/}).click();
const totalAgain=(await page.locator('.pn-hero-stat b').first().textContent())?.trim();
if(totalAgain!=='50')throw Error('Wrong answer increased points: '+totalAgain);
console.log('PASSED 50 UNIQUE / MAX 50 POINTS / NEW CYCLE / WRONG ANSWER AWARD 0');
console.log('BROWSER_ERRORS',errors);
await browser.close();if(errors.length)process.exitCode=1;
