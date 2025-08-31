import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,  // כדי שלא יתנגש עם השרת בפורט 3000
    open: true   // פתיחה אוטומטית בדפדפן
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})