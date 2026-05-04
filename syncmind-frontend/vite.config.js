import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Map global and process so simple-peer doesn't crash
    global: 'window',
    'process.env': {}
  },
  resolve: {
    // Natively point the missing Node modules to our installed polyfills
    alias: {
      'simple-peer': 'simple-peer/simplepeer.min.js',
      stream: 'stream-browserify',
      events: 'events',
      util: 'util',
      buffer: 'buffer'
    }
  }
})
