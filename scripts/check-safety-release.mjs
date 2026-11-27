import {readFileSync} from 'node:fs';
const manifest=readFileSync('android/app/src/main/AndroidManifest.xml','utf8');
const allowed=new Set(['SCHEDULE_EXACT_ALARM','RECEIVE_BOOT_COMPLETED','WAKE_LOCK','VIBRATE','POST_NOTIFICATIONS','USE_FULL_SCREEN_INTENT','FOREGROUND_SERVICE','FOREGROUND_SERVICE_MEDIA_PLAYBACK','INTERNET']);
const permissions=[...manifest.matchAll(/<uses-permission\s+android:name="android\.permission\.([^"]+)"/g)].map(x=>x[1]);
for(const name of permissions)if(!allowed.has(name))throw new Error('New permission requires manual review: '+name);
for(const m of manifest.matchAll(/<(service|receiver|provider)\b[^>]*android:exported="true"/g))throw new Error('Exported component requires review: '+m[1]);
const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
if(lock.packages['node_modules/leaflet']?.version!=='1.9.4')throw new Error('Map dependency version changed; review required');
console.log('PASS safety release: source manifest permissions, exported components, map dependency pin');
