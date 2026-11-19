// Build self-contained MP3 pronunciation examples for Android WebView: native audio playback,
// independent of speechSynthesis voices installed on the phone.
import {buildSync} from 'esbuild'
import {createRequire} from 'node:module'
import {mkdtempSync,rmSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
const tmp=mkdtempSync(join(tmpdir(),'moymir-audio-'))
try{
 const target=join(tmp,'lessons.cjs')
 writeFileSync(target,buildSync({entryPoints:[resolve('src/english/lessons.ts')],platform:'node',format:'cjs',bundle:true,write:false}).outputFiles[0].contents)
 const {LESSONS}=createRequire(import.meta.url)(target)
 const phrases=[...new Set(LESSONS.flatMap(x=>x.examples.map(e=>e.split(' — ')[0].trim())))]
 const outDir=resolve('public/english/audio');mkdirSync(outDir,{recursive:true})
 const entries={}
 for(let i=0;i<phrases.length;i++){
  const phrase=phrases[i],name=createHash('sha256').update('en-GB|'+phrase).digest('hex').slice(0,16)+'.mp3'
  const destination=join(outDir,name),aiff=join(tmp,'voice.aiff')
  if(!existsSync(destination)){
   const a=spawnSync('/usr/bin/say',['-v','Daniel','-r','145','-o',aiff,phrase],{encoding:'utf8'})
   if(a.status!==0)throw Error('say failed '+phrase+' '+a.stderr)
   const b=spawnSync('/opt/homebrew/bin/ffmpeg',['-hide_banner','-loglevel','error','-y','-i',aiff,'-c:a','libmp3lame','-q:a','5','-ac','1',destination],{encoding:'utf8'})
   if(b.status!==0)throw Error('mp3 encoding failed '+phrase+' '+b.stderr)
  }
  if(statSync(destination).size<2000)throw Error('MP3 not generated '+phrase)
  entries[phrase]='/english/audio/'+name
  process.stdout.write(`${i+1}/${phrases.length} ${phrase}: ${statSync(destination).size} bytes\n`)
 }
 writeFileSync('src/english/exampleAudio.ts',`/** Pre-rendered British English examples: included offline in the app. */\nexport const ENGLISH_AUDIO_EXAMPLES:Record<string,string>=${JSON.stringify(entries,null,2)}\nexport const exampleAudioUrl=(phrase:string)=>ENGLISH_AUDIO_EXAMPLES[phrase.trim()]??null\n`)
 console.log('AUDIO_DONE '+phrases.length+' distinct examples')
}finally{rmSync(tmp,{recursive:true,force:true})}
