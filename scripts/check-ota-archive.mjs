import {readFileSync} from 'node:fs';
import JSZip from 'jszip';

const path=process.argv[2];
if(!path)throw Error('Pass the OTA zip path');
const zip=await JSZip.loadAsync(readFileSync(path));
const htmlFile=zip.file('index.html');
if(!htmlFile)throw Error('Missing index.html at archive root');
const html=await htmlFile.async('string');
if(html.includes('/moy-mir-adventure-preview/')||html.includes('github.io'))throw Error('Wrong GitHub Pages base in OTA');
const expectedVersion=process.argv[3];
if(!/<title>Мой Мир 3\.8\.\d+/.test(html)||expectedVersion&&!html.includes('Мой Мир '+expectedVersion))throw Error('Wrong app HTML version');
const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(s=>s.endsWith('.js')||s.endsWith('.css'));
if(!refs.some(s=>s.endsWith('.js'))||!refs.some(s=>s.endsWith('.css')))throw Error('No JS or CSS linked');
for(const ref of refs){
 const relative=ref.replace(/^\.\//,'').replace(/^\//,'');
 if(!relative.startsWith('assets/')||!zip.file(relative))throw Error('Missing or invalid local asset: '+ref);
}
for(const required of ['alarm/sunrise.mp3','alarm/robot.mp3','alarm/meadow.mp3']){
 if(!zip.file(required))throw Error('Missing alarm audio: '+required);
}
console.log('OTA VERIFIED: local Android paths',refs.join(' | '),'ZIP entries',Object.keys(zip.files).length);
