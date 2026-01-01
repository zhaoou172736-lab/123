import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Crucial: Ensures assets are loaded relatively in Electron (file:// protocol)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})