import { X, Expand, Shrink } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setExpanded(false);
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const isVertical = isOverflowing; // reuse same flag: naturalHeight > naturalWidth

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (img) {
      setIsOverflowing(img.naturalHeight > img.naturalWidth);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative animate-in fade-in zoom-in-95 duration-300 w-full flex flex-col"
        style={{ maxWidth: isVertical ? '420px' : '720px', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Cerrar"
        >
          <X size={28} />
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-y-auto flex flex-col">
          {/* Image container */}
          <div className="relative overflow-hidden flex-shrink-0">
            <img
              ref={imgRef}
              src={image}
              alt={title}
              onLoad={handleImageLoad}
              className="w-full h-auto block"
              style={{
                maxHeight: isVertical ? (expanded ? '85vh' : '520px') : '480px',
                objectFit: isVertical ? 'cover' : 'contain',
              }}
            />

            {/* Expand / Shrink — only for vertical images that get cropped */}
            {isVertical && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-sm transition-all"
                aria-label={expanded ? 'Reducir' : 'Expandir imagen'}
              >
                {expanded ? <Shrink size={14} /> : <Expand size={14} />}
                {expanded ? 'Reducir' : 'Ver completa'}
              </button>
            )}
          </div>

          {/* Info panel */}
          <div className="px-6 py-4 border-t border-border">
            <div className="space-y-1 min-w-0">
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

          {/* Extra images grid */}
          {extraImages.length > 0 && (
            <div className="px-6 pb-5 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                Más fotos
              </p>
              <div className="grid grid-cols-4 gap-2">
                {extraImages.map((img, i) => (
                  <img
                    key={img.publicId || i}
                    src={img.url}
                    alt={`${title} — foto extra ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
