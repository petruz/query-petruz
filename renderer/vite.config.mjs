import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rendererRoot = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(rendererRoot, '..')

export default defineConfig({
    plugins: [react()],
    root: rendererRoot,
    css: { postcss: resolve(rendererRoot, 'postcss.config.js') },
    build: { outDir: resolve(projectRoot, 'dist/renderer'), emptyOutDir: true },
})