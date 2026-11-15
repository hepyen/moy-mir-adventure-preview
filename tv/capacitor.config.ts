import type {CapacitorConfig} from '@capacitor/cli';
const config:CapacitorConfig={
 appId:'com.moymir.pioneerquiz.tv',
 appName:'Кто хочет стать пионером',
 webDir:'dist',
 android:{allowMixedContent:false},
 server:{androidScheme:'https'}
};
export default config;
