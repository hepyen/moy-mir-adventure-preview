import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('./tv',import.meta.url)),base:'./',build:{outDir:'dist',emptyOutDir:true,assetsInlineLimit:0}});
