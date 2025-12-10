import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Global error handlers for startup debugging
window.addEventListener('error', (event) => {
  document.body.innerHTML = `<div style="color:red; padding: 20px; background:white;"><h1>Global Error</h1><pre>${event.message}</pre></div>`
})
window.addEventListener('unhandledrejection', (event) => {
  document.body.innerHTML = `<div style="color:red; padding: 20px; background:white;"><h1>Unhandled Rejection</h1><pre>${event.reason}</pre></div>`
})

try {
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element not found')

  createRoot(root).render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  )
} catch (e) {
  document.body.innerHTML = `<div style="color:red; padding: 20px; background:white;"><h1>Startup Error</h1><pre>${e instanceof Error ? e.message + '\n' + e.stack : String(e)}</pre></div>`
}
