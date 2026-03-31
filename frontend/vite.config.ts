import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // On intercepte tous les appels qui commencent par /api
      '/api': {
        target: 'http://backend:8000', // "backend" est le nom du service dans ton docker-compose
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})