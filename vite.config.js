import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // ADD THIS SECTION TO FIX THE PORT
  server: {
    port: 5173, // Replace with your desired port (e.g., 8080, 3000, etc.)
    strictPort: true, // Optional: Prevents Vite from using a fallback port
  },
})