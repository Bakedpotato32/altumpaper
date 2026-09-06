import React from 'react'
import ReactDOM from 'react-dom/client'
import 'katex/dist/katex.min.css'
import './index.css'
import App from './App'

// Capture any browser error and show it on screen instead of a white page
window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding:20px;font-family:sans-serif;color:#b91c1c;background:#fef2f2;min-height:100vh;">
        <h3 style="font-weight:bold;margin-bottom:8px;">App Error:</h3>
        <pre style="white-space:pre-wrap;font-size:12px;background:#fff;padding:12px;border-radius:8px;border:1px solid #fca5a5;">${e.message}\n\nat ${e.filename}:${e.lineno}</pre>
      </div>
    `;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
