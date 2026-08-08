import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base is relative so the built site works from any path (including file://)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    open: true,
    // Don't watch files that can be locked by other apps → EBUSY watcher crash
    // (raw intents source, and large media like galaxyhome.mp4).
    watch: { ignored: ['**/college_chatbot_intents.json', '**/*.mp4', '**/*.mov', '**/*.webm', '**/*.mkv'] },
  },
})
