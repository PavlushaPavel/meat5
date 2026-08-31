// Первой строкой и не ниже: сброс по ?reset=1 обязан отработать до того,
// как zustand поднимет сохранённый прогресс (см. lib/reset.ts).
import './lib/reset'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
