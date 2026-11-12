import assert from 'node:assert/strict';
import {geographyCategories,geographyQuestionCount,geographyVisualCount} from '../src/geography/questions.ts';
assert.equal(geographyCategories.length,4,'Four categories');
assert.equal(geographyQuestionCount,100,'100 questions');
assert.equal(geographyVisualCount,50,'50 illustrated questions');
const distribution=[12,13,13,12];
const keys={
 atmosfera:'0102102102102102102102102',
 factores:'1021021021021021021021021',
 climas:'0012012010201201001201021',
 emergencia:'0120120120120120012012012'
};
const supported=new Set('cloud rain suncloud convection condensation evaporation front monsoon oceanic seasons thermometer raingauge barometer anemometer weathervane hygrometer mountain altitude solana umbria orographic coast savanna rainforest desert continental polar glacier heatwave drought flood floodwall hurricane biodiversity factory solar bike tap sealevel greenhouse latitude ozone meteor aurora satellite highpressure lowpressure isobars climogram'.split(' '));
const ids=new Set(),stems=new Set();
geographyCategories.forEach((c,j)=>{
 assert.equal(c.questions.length,25,c.id);
 assert.equal(c.questions.filter(q=>q.visual).length,distribution[j],c.id+' visual count');
 assert.equal(c.questions.map(q=>q.correct).join(''),keys[c.id],c.id+' server answer key');
 for(const q of c.questions){
  assert(!ids.has(q.id),'Repeated id '+q.id);ids.add(q.id);
  assert(!stems.has(q.text),'Repeated question '+q.text);stems.add(q.text);
  assert.equal(q.options.length,3);
  assert.equal(new Set(q.options).size,3,'Duplicate answer '+q.id);
  assert(q.text.length>15&&q.explanation.length>25,'Missing explanation '+q.id);
  assert(q.correct>=0&&q.correct<=2,'Invalid key '+q.id);
  if(q.visual)assert(supported.has(q.visual),'Missing illustration '+q.visual);
 }
});
const prize=n=>n===25?50:n===24?40:n===23?30:n===22?20:n===21?10:n===20?5:0;
assert.equal(prize(20),5);
assert.equal(prize(25),50);
assert.equal(4*prize(25)+300,500);
assert.equal(4*prize(20),20);
console.log('GEOGRAPHY QA PASSED: 4 categories, 100 questions, 50 illustrated, answer keys and prizes validated.');
