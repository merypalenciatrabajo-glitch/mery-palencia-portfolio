import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import Lightbox from '@/components/Lightbox';
import ThemeToggle from '@/components/ThemeToggle';
import { useGalleryPage } from '@/hooks/useFirestore';

type GalleryItem = {
  id: string;
  title: string;
  image: string;
  category: string;
  description: string;
  order: number;
  extraImages: { url: string; publicId: string }[];
};

export default function GalleryPage() {
  const { data: items, loading } = useGalleryPage();
  const location = useLocation();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const openLightbox = (item: GalleryItem) => {
    setSelected(item);
    setLightboxOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm z-40">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display text-foreground hover:text-accent transition-colors">
            Mery Palencia
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="font-medium transition-colors text-foreground hover:text-accent">
              Inicio
            </Link>
            <Link
              to="/blog"
              className={`font-medium transition-colors ${
                isActive('/blog') ? 'text-accent border-b-2 border-accent pb-0.5' : 'text-foreground hover:text-accent'
              }`}
            >
              Blog
            </Link>
            <Link
              to="/galeria"
              className={`font-medium transition-colors ${
                isActive('/galeria') ? 'text-accent border-b-2 border-accent pb-0.5' : 'text-foreground hover:text-accent'
              }`}
            >
              Galería
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-white via-white to-orange-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/20">
        <div className="container text-center space-y-4">
          <p className="text-sm tracking-widest text-muted-foreground uppercase">
            Ilustración Digital
          </p>
          <h1 className="text-5xl md:text-6xl font-display text-foreground">
            Galería
          </h1>
          <p className="subtitle text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
            Explora todas mis ilustraciones y obras de arte digital
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="py-16 md:py-24">
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground text-lg py-20">
              No hay ilustraciones disponibles aún.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                  onClick={() => openLightbox(item)}
                >
                  <div className="relative overflow-hidden rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                        Ver Detalle
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-3 text-base font-display text-foreground group-hover:text-accent transition-colors truncate">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      {selected && (
        <Lightbox
          isOpen={lightboxOpen}
          image={selected.image}
          title={selected.title}
          category={selected.category}
          description={selected.description}
          extraImages={selected.extraImages}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
