import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 61481,
    host: true
  },
  base: '/leetcode-438-find-all-anagrams-in-a-string/'
})
