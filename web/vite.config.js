import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  /** Avoid stale pre-bundle / "Outdated Optimize Dep" (504) after adding deps like socket.io-client */
  optimizeDeps: {
    include: ['socket.io-client']
  },
  server: {
    watch: {
      usePolling: true
    }
  }
})
