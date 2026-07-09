import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base is relative so the built site works from any path (including file://)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    open: true,
  },
})
