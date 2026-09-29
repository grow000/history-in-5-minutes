import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' — чтобы сборка открывалась с любого адреса (в т.ч. GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
})
