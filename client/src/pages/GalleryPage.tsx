import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Lightbox from '@/components/Lightbox';
import { useGalleryPage } from '@/hooks/useFirestore';

const CATEGORY_LABELS: Record<string, string> = {
  'fotografia-paisaje': 'Fotografía paisaje',
  'fotografia-infantil': 'Fotografía infantil',
  'fotografia-moda': 'Fotografía de moda',
  'fotografia-documental': 'Fotografía documental',
  'ilustracion-digital': 'Ilustración digital',
  'material-digital': 'Material digital',
  'trabajos-analogos': 'Trabajos análogos',
  'otros': 'Otros',
};

// Aliases de categorías antiguas → nueva clave predefinida
const CATEGORY_ALIASES: Record<string, string> = {
  'otro': 'otros',
  'personajes': 'ilustracion-digital',
  'escenarios': 'ilustracion-digital',
  'props': 'material-digital',
  'abstracto': 'ilustracion-digital',
};

const normalizeCategory = (cat: string) => CATEGORY_ALIASES[cat] ?? cat;

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openLightbox = (item: GalleryItem) => {
    setSelected(item);
    setLightboxOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  // Orden fijo de categorías predefinidas (sin "otros", va siempre al final)
  const CATEGORY_ORDER = [
    'fotografia-paisaje',
    'fotografia-infantil',
    'fotografia-moda',
    'fotografia-documental',
    'ilustracion-digital',
    'material-digital',
    'trabajos-analogos',
  ];

  // Categorías en dropdown: predefinidas con ítems → custom → "otros" al final
  const availableCategories = useMemo(() => {
    const inItems = new Set(items.map((i) => normalizeCategory(i.category)));
    const predefined = CATEGORY_ORDER.filter((k) => inItems.has(k));
    const custom = [...inItems].filter((k) => k !== 'otros' && !CATEGORY_LABELS[k]);
    const hasOtros = inItems.has('otros');
    return [...predefined, ...custom, ...(hasOtros ? ['otros'] : [])];
  }, [items]);

  const filteredItems = useMemo(() => {
    const result = activeCategory
      ? items.filter((i) => normalizeCategory(i.category) === activeCategory)
      : items;
    return [...result].sort((a, b) => a.order - b.order);
  }, [items, activeCategory]);

  const getCategoryLabel = (cat: string) => CATEGORY_LABELS[normalizeCategory(cat)] ?? cat;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 backdrop-blur-sm z-40 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#52D5C1]/30 after:to-transparent" style={{backgroundColor: '#062126e6'}}>
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
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative py-8 md:py-12" style={{background: 'linear-gradient(135deg, #062126 0%, #0a3540 100%)'}}>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#FCFCFC] pointer-events-none" />
        <div className="container text-center space-y-2">
          <p className="text-sm tracking-widest text-muted-foreground uppercase">
            Fotografía & Arte
          </p>
          <h1 className="text-4xl md:text-5xl font-display text-foreground">
            Galería
          </h1>
          <p className="subtitle text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Explora todos mis trabajos y obras
          </p>
        </div>
      </section>

      {/* FILTROS */}
      {!loading && availableCategories.length > 0 && (
        <section className="relative py-6 bg-[#FCFCFC]">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#52D5C1]/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#52D5C1]/40 to-transparent pointer-events-none" />
          <div className="container flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Filtrar por:</span>
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2 border border-[#52D5C1]/40 rounded-lg bg-white text-sm text-[#062126] hover:border-[#52D5C1] transition-colors"
              >
                <span>{activeCategory ? getCategoryLabel(activeCategory) : 'Todas las categorías'}</span>
                <ChevronDown size={15} className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[220px] bg-white border border-[#52D5C1]/30 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={() => { setActiveCategory(null); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#80FAE3]/20 ${activeCategory === null ? 'text-[#52D5C1] font-medium' : 'text-[#062126]'}`}
                  >
                    Todas las categorías
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#80FAE3]/20 ${activeCategory === cat ? 'text-[#52D5C1] font-medium' : 'text-[#062126]'}`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Limpiar
              </button>
            )}
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="relative py-8 md:py-12">
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-secondary/30 pointer-events-none" />
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground text-lg py-20">
              No hay trabajos en esta categoría aún.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredItems.map((item) => (
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
                  <h3 className="mt-3 text-base font-display text-[#062126] group-hover:text-[#52D5C1] transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#062126]/60 mt-0.5">{getCategoryLabel(item.category)}</p>
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
