import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const CHUNK_RELOAD_KEY = 'portfolio:chunk-reload';

// Tras un despliegue, una pestaña antigua puede pedir un chunk que ya no existe.
// Vite permite interceptar ese caso y recargar el HTML actualizado una sola vez.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();

  const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
  if (Date.now() - lastReload < 15_000) return;

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  const refreshedUrl = new URL(window.location.href);
  refreshedUrl.searchParams.set('_actualizado', String(Date.now()));
  window.location.replace(refreshedUrl.toString());
});

window.setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 20_000);

// Protección de imágenes — bloquear clic derecho, arrastrar y atajos de descarga
document.addEventListener('contextmenu', (e) => {
  if ((e.target as HTMLElement).tagName === 'IMG') {
    e.preventDefault();
  }
});

document.addEventListener('dragstart', (e) => {
  if ((e.target as HTMLElement).tagName === 'IMG') {
    e.preventDefault();
  }
});

// Bloquear Ctrl+S / Cmd+S (guardar página)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
  }
  // Bloquear F12 (DevTools) — disuasorio, no infalible
  if (e.key === 'F12') {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
