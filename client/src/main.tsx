import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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
