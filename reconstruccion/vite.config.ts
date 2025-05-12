import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/TecnicasDeAI/',
  server: {
    open: true,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1000, // Aumentar límite a 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          'tensorflow': ['@tensorflow/tfjs'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },
})
