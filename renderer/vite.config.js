import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    root: new URL('.', import.meta.url).pathname,
    css: { postcss: './renderer/postcss.config.js' },
    build: { outDir: '../dist/renderer', emptyOutDir: true },
})