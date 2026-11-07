import {defineConfig} from 'vite';
export default defineConfig(({mode})=>({base:mode==='android'?'/':'/moy-mir-adventure-preview/'}));
