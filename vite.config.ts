import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base = '/meat5/' — приложение живёт в подпапке GitHub Pages, и та же база нужна
// в dev и preview: если разводить их, preview отдаёт index.html вместо бандла,
// экран остаётся пустым, а проверки при этом «проходят». Проверено.
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  base: '/meat5/',
  build: { target: 'es2022', assetsInlineLimit: 0 },
}))
