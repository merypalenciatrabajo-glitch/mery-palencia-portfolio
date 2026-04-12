import { useEffect, useState } from "react";

export const SCRIPT_SRC =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.8/dist/unicornStudio.umd.js";

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init: () => void;
      destroy?: () => void;
      // Each scene returned by init has pause/play
      scenes?: Array<{ pause?: () => void; play?: () => void }>;
    };
    __unicornStudioLoaded?: boolean;
  }
}

interface UseUnicornStudioReturn {
  ready: boolean;
  error: boolean;
}

function reinitUnicornStudio() {
  const us = window.UnicornStudio;
  if (!us) return;
  // Destruir instancias previas para evitar duplicados al volver a la página
  if (typeof us.destroy === "function") {
    try { us.destroy(); } catch (_) {}
  }
  us.init();
}

export function useUnicornStudio(): UseUnicornStudioReturn {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const callInit = () => {
      reinitUnicornStudio();
      if (isMounted) setReady(true);
    };

    // Script already loaded — reinit with a small delay so the DOM element is mounted
    if (window.__unicornStudioLoaded === true && window.UnicornStudio) {
      const t = setTimeout(callInit, 50);
      return () => {
        isMounted = false;
        clearTimeout(t);
      };
    }

    // Script tag already in DOM but not yet loaded
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );

    if (existingScript) {
      const handleLoad = () => {
        window.__unicornStudioLoaded = true;
        if (isMounted) callInit();
      };
      const handleError = () => {
        if (isMounted) setError(true);
      };
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);
      return () => {
        isMounted = false;
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    // Inject new script
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      window.__unicornStudioLoaded = true;
      if (!isMounted) return;
      callInit();
    };

    script.onerror = () => {
      if (isMounted) setError(true);
    };

    document.head.appendChild(script);

    return () => {
      isMounted = false;
    };
  }, []);

  return { ready, error };
}
