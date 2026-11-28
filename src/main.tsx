import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ProgressProvider } from './lib/useProgress'
import { primeVoices } from './lib/audio'
import './styles.css'

primeVoices()

const container = document.getElementById('root')
if (!container) throw new Error('Root element missing')

createRoot(container).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
)
