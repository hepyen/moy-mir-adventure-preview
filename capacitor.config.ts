import type {CapacitorConfig} from '@capacitor/cli';
const config:CapacitorConfig={
 appId:'com.moymir.adventure',appName:'Мой Мир',webDir:'dist',
 android:{allowMixedContent:false},
 server:{androidScheme:'https'},
 plugins:{
   PushNotifications:{presentationOptions:['badge','sound','alert']},
   CapacitorUpdater:{autoUpdate:false,appReadyTimeout:20000}
 }
};
export default config;
