import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface LightboxProps {
  isOpen: boolean;
  image: string;
  title: string;
  category?: string;
  description?: string;
  extraImages?: { url: string; publicId: string }[];
  onClose: () => void;
}

/**
 * Parsea texto y convierte @menciones y #hashtags en links clickeables.
 * @usuario → https://instagram.com/usuario (nueva pestaña)
 * #hashtag → https://instagram.com/explore/tags/hashtag (nueva pestaña)
 */
function parseTextWithLinks(text: string): React.ReactNode[] {
  const parts = text.split(/(@[\w.]+|#[\w]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <a
          key={i}
          href={`https://instagram.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-accent font-semibold hover:underline"
        >
          {part}
        </a>
      );
    }
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <a
          key={i}
          href={`https://instagram.com/explore/tags/${tag}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-accent font-semibold hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function Lightbox({ isOpen, image, title, category, description, extraImages = [], onClose }: LightboxProps) {
  const allImages = [{ url: image, publicId: 'cover' }, ...extraImages];
  const total = allImages.length;

  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setIndex(0);
      setDragOffset(0);
      requestAnimationFrame(() => closeButtonRef.current?.focus());

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1));
        if (e.key === 'ArrowRight') setIndex((current) => Math.min(total - 1, current + 1));
        if (e.key !== 'Tab' || !dialogRef.current) return;

        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = previousOverflow;
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose, total]);

  const goTo = (i: number) => {
    setDragOffset(0);
    setIndex(Math.max(0, Math.min(i, total - 1)));
  };

  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = e.touches[0].clientY - touchStartYRef.current;

    if (isHorizontalRef.current === null) {
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
    }

    if (!isHorizontalRef.current) return;
    e.stopPropagation();

    // Resist at edges
    let offset = dx;
    if ((index === 0 && dx > 0) || (index === total - 1 && dx < 0)) {
      offset = dx * 0.25;
    }
    setDragOffset(offset);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    setDragging(false);
    setDragOffset(0);
    if (isHorizontalRef.current && Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
    }
  };

  if (!isOpen) return null;

  // translateX = -(index * 100%) + dragOffset mapped to percentage of container
  const translateBase = -(index * 100);

  return (
    <div
      className="portfolio-lightbox-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        className="relative w-full max-w-5xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="portfolio-lightbox-panel relative grid max-h-[92svh] overflow-y-auto rounded-[1.75rem] md:grid-cols-[minmax(0,1fr)_20rem] md:overflow-hidden"
        >
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="portfolio-button portfolio-button--icon portfolio-button--secondary absolute right-4 top-4 z-40 text-white"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>

          {/* Slider viewport */}
          <div
            className="relative h-[55svh] min-h-[20rem] overflow-hidden bg-black md:h-[82svh] md:max-h-[760px]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Track */}
            <div
              className="flex h-full"
              style={{
                transform: `translateX(calc(${translateBase}% + ${dragOffset}px))`,
                transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'transform',
              }}
            >
              {allImages.map((img, i) => (
                <div key={img.publicId} className="flex-none w-full h-full relative">
                  {/* Fondo blur */}
                  <img
                    src={img.url}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'blur(24px)', transform: 'scale(1.15)', zIndex: 0 }}
                  />
                  <div className="absolute inset-0 bg-black/30" style={{ zIndex: 1 }} />
                  {/* Imagen real centrada */}
                  <img
                    src={img.url}
                    alt={`${title} ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ zIndex: 2 }}
                  />
                </div>
              ))}
            </div>

            {/* Flechas */}
            {total > 1 && (
              <>
                {index > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="portfolio-button portfolio-button--icon absolute left-3 top-1/2 -translate-y-1/2 border-white/15 bg-black/45 text-white hover:border-primary/40 hover:bg-black/60"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                {index < total - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="portfolio-button portfolio-button--icon absolute right-3 top-1/2 -translate-y-1/2 border-white/15 bg-black/45 text-white hover:border-primary/40 hover:bg-black/60"
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}

                {/* Contador */}
                <div className="portfolio-lightbox-counter absolute left-4 top-4" aria-live="polite">
                  {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </div>

                {/* Dots */}
                <div className="portfolio-lightbox-pagination absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); goTo(i); }}
                      className="portfolio-lightbox-dot flex h-11 w-11 items-center justify-center rounded-full"
                      aria-label={`Foto ${i + 1}`}
                      aria-current={i === index ? 'true' : undefined}
                    >
                      <span className={`rounded-full transition-all duration-200 ${
                        i === index ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                      }`} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <aside className="flex flex-col border-t border-border/70 p-6 pt-20 md:overflow-y-auto md:border-l md:border-t-0 md:p-7 md:pt-24">
            <div className="space-y-4">
              {category && (
                <span className="portfolio-tag">
                  {category}
                </span>
              )}
              <h3 id="lightbox-title" className="text-2xl font-display leading-tight text-foreground">{title}</h3>
              {description && (
                <p className="text-[0.95rem] leading-7 text-muted-foreground">
                  {parseTextWithLinks(description)}
                </p>
              )}
            </div>
            {total > 1 && (
              <p className="mt-auto hidden border-t border-border/60 pt-5 text-xs leading-relaxed text-muted-foreground md:block">
                Usa las flechas o desliza la imagen para recorrer la serie.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
