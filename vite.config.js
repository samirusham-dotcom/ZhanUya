import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base must match the GitHub Pages project path: https://alyasska.github.io/ZhanUya/
export default defineConfig({
  base: '/ZhanUya/',
  plugins: [react()],
})
