import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/theme.css';
import './index.css';

// Register service worker with auto-update on new version
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Check for updates every 60s
        setInterval(() => reg.update(), 60_000);
      })
      .catch(() => {/* offline optional */});
  });
}

// Handle stale chunk load failures (old SW cache + new Vite deploy = 404 on JS bundles)
// If a dynamic import fails, nuke caches and hard reload once.
window.addEventListener('error', (e) => {
  if (
    e.message?.includes('Failed to fetch dynamically imported module') ||
    e.message?.includes('Loading chunk') ||
    e.message?.includes('Loading CSS chunk')
  ) {
    const reloaded = sessionStorage.getItem('trackex_chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('trackex_chunk_reload', '1');
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .then(() => window.location.reload());
      } else {
        window.location.reload();
      }
    }
  }
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message ?? '';
  if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Loading chunk')) {
    const reloaded = sessionStorage.getItem('trackex_chunk_reload');
    if (!reloaded) {
      sessionStorage.setItem('trackex_chunk_reload', '1');
      if ('caches' in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .then(() => window.location.reload());
      } else {
        window.location.reload();
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
