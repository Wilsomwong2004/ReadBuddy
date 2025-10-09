import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        settings: resolve(__dirname,'settings.html'),
        notes: resolve(__dirname, 'notes.html'),
        content: resolve(__dirname, 'src/content.js'),
        background: resolve(__dirname, 'src/background.js'),
        readability: resolve(__dirname, 'src/readability.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      },
    },
    outDir: "dist",
  },
  plugins: [react(), tailwindcss()],
});