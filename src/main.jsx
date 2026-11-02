import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeGoogleAnalytics } from './utils/googleAnalytics.js'

try {
  if (window.localStorage.getItem('roomly_analytics_consent') === 'accepted') {
    initializeGoogleAnalytics()
  }
} catch {
  // Keep analytics disabled when browser storage is unavailable.
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
