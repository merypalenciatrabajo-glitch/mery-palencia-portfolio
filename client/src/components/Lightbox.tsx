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

export default function Lightbox({ isOpen, image, title, category, description, extraImages = [], onClose }: LightboxProps) {
  const allImages = [{ url: image, publicId: 'cover' }, ...extraImages];
  const total = allImages.length;

  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIndex(0);
      setDragOffset(0);
    } else {
      document.body.style.overflow = 'unset';
    }
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="relative animate-in fade-in zoom-in-95 duration-300 w-full"
        style={{ maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
          aria-label="Cerrar"
        >
          <X size={28} />
        </button>

        <div
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-y-auto scrollbar-hide flex flex-col"
          style={{ maxHeight: '90vh' }}
        >
          {/* Slider viewport */}
          <div
            className="relative overflow-hidden flex-shrink-0 bg-black"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Track */}
            <div
              className="flex"
              style={{
                transform: `translateX(calc(${translateBase}% + ${dragOffset}px))`,
                transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                willChange: 'transform',
              }}
            >
              {allImages.map((img, i) => (
                <div key={img.publicId} className="flex-none w-full relative overflow-hidden" style={{ height: '420px' }}>
                  {/* Fondo blur de la misma imagen */}
                  <img
                    src={img.url}
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-110"
                    style={{ filter: 'blur(20px)', transform: 'scale(1.15)' }}
                  />
                  {/* Imagen real encima */}
                  <img
                    src={img.url}
                    alt={`${title} ${i + 1}`}
                    className="relative w-full h-full object-contain"
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                {index < total - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                    aria-label="Siguiente"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}

                {/* Contador */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                  {index + 1}/{total}
                </div>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); goTo(i); }}
                      className={`rounded-full transition-all duration-200 ${
                        i === index ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                      }`}
                      aria-label={`Foto ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="px-6 py-4 border-t border-border">
            <div className="space-y-1">
              {category && (
                <span className="inline-block px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold tracking-widest uppercase">
                  {category}
                </span>
              )}
              <h3 className="text-lg font-display text-foreground leading-snug">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
