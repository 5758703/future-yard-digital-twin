import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: { rollupOptions: { output: { manualChunks: { three: ['three'], vue: ['vue'], icons: ['lucide-vue-next'] } } } },
})
