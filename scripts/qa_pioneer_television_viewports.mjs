import {chromium} from 'playwright-core';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
const sizes=[[1920,1080],[1280,720],[960,540]];
for(const [width,height] of sizes){
 const page=await browser.newPage({viewport:{width,height}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4191/',{waitUntil:'networkidle'});
 const home=await page.evaluate(()=>({body:document.querySelector('.pn-shell').scrollHeight,height:document.querySelector('.pn-shell').clientHeight,levels:[...document.querySelectorAll('.pn-level')].map(x=>Math.ceil(x.getBoundingClientRect().bottom))}));
 await page.locator('.pn-level.open').first().click();
 await page.locator('.pn-option').first().waitFor();
 const metrics=await page.evaluate(()=>{
  const selectors=['.pn-head','.pn-question-status','.pn-question-wrap','.pn-answers','.pn-hints','.pn-ladder','.pn-exit','.pn-option'];
  const boxes=Object.fromEntries(selectors.map(x=>{const el=document.querySelector(x),r=el?.getBoundingClientRect();return[x,r?{top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height)}:null]}));
  return{viewport:{w:innerWidth,h:innerHeight},scrollHeight:document.querySelector('.pn-shell').scrollHeight,clientHeight:document.querySelector('.pn-shell').clientHeight,boxes};
 });
 console.log('SIZE',width+'x'+height,'HOME',JSON.stringify(home),'GAME',JSON.stringify(metrics));
 if(home.levels.at(-1)>height||metrics.boxes['.pn-hints'].bottom>height||metrics.boxes['.pn-answers'].bottom>height||metrics.boxes['.pn-option'].height<42)throw Error('TV screen clips content at '+width+'x'+height);
 await page.screenshot({path:'/tmp/pioneer-tv-'+width+'.png'});
 await page.locator('.pn-hints button').filter({hasText:'50:50'}).click();
 await page.getByRole('alertdialog').waitFor();
 const before=await page.locator('.pn-option:not(:disabled)').count();
 await page.getByRole('button',{name:/Отмена · Остаться/}).click();
 if(await page.locator('.pn-option:not(:disabled)').count()!==before)throw Error('Cancel consumes 50/50');
 await page.locator('.pn-hints button').filter({hasText:'50:50'}).click();
 await page.getByRole('button',{name:'Использовать'}).click();
 if(await page.locator('.pn-option:not(:disabled)').count()!==2)throw Error('50/50 confirm failed');
 await page.locator('.pn-exit').click();
 await page.getByRole('alertdialog').waitFor();
 if(!await page.getByText('Вы точно хотите выйти из игры?').isVisible())throw Error('Exit confirmation absent');
 await page.getByRole('button',{name:'Да, выйти'}).click();
 await page.locator('.pn-hero h1').waitFor({timeout:5000});
 if(errors.length)throw Error(errors.join(';'));
 await page.close();
}
console.log('ALL TV VIEWPORT & CONFIRMATION TESTS PASS');await browser.close();
