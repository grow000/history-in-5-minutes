import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' — чтобы сборка открывалась с любого адреса (в т.ч. GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Данные курсов и библиотеки — отдельными файлами: грузятся параллельно и кэшируются
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('leaflet')) return 'leaflet'
            return 'vendor'
          }
          const m = id.match(/src[\\/]data[\\/]topics[\\/](?:b\d+r?-(rus\d+)|w\d+r?-(world\d+))/)
          if (m) return `course-${m[1] ?? m[2]}`
        },
      },
    },
  },
})
