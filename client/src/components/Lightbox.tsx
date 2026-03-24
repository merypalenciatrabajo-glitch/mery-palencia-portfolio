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
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIndex(0);
    } else {
      document.body.style.overflow = 'unset';
    }
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? next() : prev();
    }
  };

  if (!isOpen) return null;

  const current = allImages[index];

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
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
          aria-label="Cerrar"
        >
          <X size={28} />
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-y-auto scrollbar-hide flex flex-col" style={{ maxHeight: '90vh' }}>

          {/* Slider */}
          <div
            className="relative overflow-hidden flex-shrink-0 bg-black select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              key={current.url}
              src={current.url}
              alt={`${title} ${index + 1}`}
              className="w-full object-cover"
              style={{ maxHeight: '520px', minHeight: '260px' }}
            />

            {/* Flechas — solo si hay más de 1 imagen */}
            {total > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Contador */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                  {index + 1}/{total}
                </div>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                      className={`rounded-full transition-all duration-200 ${
                        i === index
                          ? 'w-2 h-2 bg-white'
                          : 'w-1.5 h-1.5 bg-white/50'
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
