import {readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const directory=process.argv[2]||'dist';
const names=readdirSync(resolve(directory,'assets')).filter(f=>f.endsWith('.js'));
const bundle=names.map(f=>readFileSync(resolve(directory,'assets',f),'utf8')).join('\n');
const publicKey=/sb_publishable_[A-Za-z0-9_]+/.exec(bundle)?.[0]||'';
if(!bundle.includes('ueqtitxbvsnqmbudwxwu.supabase.co')||!publicKey||publicKey.length<30)
 throw Error('FATAL OTA BUILD: no Supabase project URL or public client key in final JS');
if(/sb_secret_[A-Za-z0-9_]+/.test(bundle))throw Error('Secret Supabase key exposed in frontend');
console.log('CLIENT CONFIG VERIFIED: URL and publishable key are present in final assets.');
