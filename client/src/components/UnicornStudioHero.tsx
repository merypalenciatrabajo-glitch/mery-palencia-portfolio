import { useRef, useEffect } from "react";
import { useUnicornStudio } from "@/hooks/useUnicornStudio";

// Dimensiones nativas del proyecto UnicornStudio
const US_WIDTH = 390;
const US_HEIGHT = 844;

interface UnicornStudioHeroProps {
  className?: string;
}

export default function UnicornStudioHero({ className }: UnicornStudioHeroProps) {
  const { ready, error } = useUnicornStudio();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Escala el widget nativo para que llene el contenedor responsivamente
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const widget = widgetRef.current;
    if (!wrapper || !widget) return;

    const update = () => {
      const scale = wrapper.offsetWidth / US_WIDTH;
      widget.style.transform = `scale(${scale})`;
      widget.style.transformOrigin = "top left";
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  return (
    /*
     * Contenedor externo: ocupa el ancho disponible de la columna.
     * padding-bottom mantiene la proporción nativa 390×844 sin layout shift.
     * overflow-hidden recorta el canvas que UnicornStudio monta internamente.
     */
    <div
      ref={wrapperRef}
      className={[
        "relative rounded-2xl shadow-soft-lg overflow-hidden w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ paddingBottom: `${(US_HEIGHT / US_WIDTH) * 100}%` }}
    >
      {/* Skeleton mientras carga */}
      {!ready && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Fallback si el CDN falla */}
      {error && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Animación no disponible</p>
        </div>
      )}

      {/*
       * El div[data-us-project] tiene las dimensiones nativas exactas (390×844)
       * para que UnicornStudio lo monte correctamente.
       * El ResizeObserver aplica un scale() para que llene el contenedor padre.
       */}
      <div className="absolute top-0 left-0">
        <div
          ref={widgetRef}
          data-us-project="4v8wXufmDdV5npLSJDVK"
          style={{ width: `${US_WIDTH}px`, height: `${US_HEIGHT}px` }}
        />
      </div>
    </div>
  );
}
