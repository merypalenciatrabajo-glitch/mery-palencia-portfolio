import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Images, SlidersHorizontal } from 'lucide-react';
import Lightbox from '@/components/Lightbox';
import { useGalleryPage } from '@/hooks/useFirestore';
import Seo from '@/components/Seo';
import ContentStatus from '@/components/ContentStatus';
import { cloudinaryImage, cloudinarySrcSet } from '@/lib/images';
import PortfolioDock from '@/components/PortfolioDock';
import PortfolioFooter from '@/components/PortfolioFooter';

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
  const { data: items, loading, error, retry } = useGalleryPage();

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
    <div className="portfolio-page portfolio-collection-page portfolio-page-enter min-h-screen bg-background">
      <Seo
        title="Galería"
        description="Galería de fotografía, ilustración digital, trabajos análogos y material creativo de Mery Palencia."
        path="/galeria"
      />
      <PortfolioDock />

      <main id="main-content">
      {/* HERO */}
      <section className="portfolio-collection-hero">
        <div className="container grid gap-7 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="portfolio-eyebrow mb-3">Fotografía & Arte</p>
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-foreground sm:text-6xl md:text-7xl">
              Archivo visual
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              Una selección de fotografía, ilustración y piezas creativas reunidas en un solo espacio.
            </p>
          </div>

          <div className="portfolio-collection-summary" aria-live="polite">
            <Images size={21} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <strong>{loading ? '—' : items.length}</strong>
              <span>{items.length === 1 ? 'obra publicada' : 'obras publicadas'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS */}
      {!loading && availableCategories.length > 0 && (
        <section className="portfolio-filter-section">
          <div className="container flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <SlidersHorizontal size={17} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="hidden text-sm text-muted-foreground sm:inline">Organizar colección</span>
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="portfolio-button portfolio-button--secondary min-h-11 px-4 py-2 text-sm"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                aria-controls="gallery-category-menu"
              >
                <span>{activeCategory ? getCategoryLabel(activeCategory) : 'Todas las categorías'}</span>
                <ChevronDown size={15} className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div
                  id="gallery-category-menu"
                  role="menu"
                  aria-label="Categorías de la galería"
                  className="portfolio-surface absolute left-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl p-1"
                >
                  <button
                    role="menuitemradio"
                    aria-checked={activeCategory === null}
                    onClick={() => { setActiveCategory(null); setDropdownOpen(false); }}
                    className={`portfolio-button--menu min-h-11 w-full px-4 py-2.5 text-left text-sm ${activeCategory === null ? 'text-accent font-medium' : 'text-foreground'}`}
                  >
                    Todas las categorías
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      role="menuitemradio"
                      aria-checked={activeCategory === cat}
                      onClick={() => { setActiveCategory(cat); setDropdownOpen(false); }}
                      className={`portfolio-button--menu min-h-11 w-full px-4 py-2.5 text-left text-sm ${activeCategory === cat ? 'text-accent font-medium' : 'text-foreground'}`}
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
                className="portfolio-button portfolio-button--quiet min-h-11 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            )}
            </div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="portfolio-section pt-8 md:pt-12">
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" role="status" aria-label="Cargando galería">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <ContentStatus
              kind="error"
              title="No pudimos cargar la galería"
              description="Comprueba tu conexión e inténtalo nuevamente."
              onRetry={retry}
            />
          ) : filteredItems.length === 0 ? (
            <ContentStatus
              kind="empty"
              title="Aún no hay trabajos disponibles"
              description={activeCategory ? 'No hay trabajos publicados en esta categoría.' : 'La galería se actualizará cuando haya obras publicadas.'}
            />
          ) : (
            <div className="portfolio-gallery-grid">
              {filteredItems.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className={`portfolio-gallery-card group ${index % 7 === 0 ? 'portfolio-gallery-card--feature' : ''}`}
                  onClick={() => openLightbox(item)}
                  aria-label={`Abrir ${item.title}`}
                >
                  <div className="relative h-full overflow-hidden rounded-[1.35rem]">
                    <img
                      src={cloudinaryImage(item.image, { width: 600 })}
                      srcSet={cloudinarySrcSet(item.image, [320, 480, 600, 900])}
                      sizes="(min-width: 768px) 33vw, 50vw"
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full min-h-[16rem] w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                    />
                    {/* Overlay protector — bloquea clic derecho y arrastre */}
                    <div
                      className="absolute inset-0 z-10"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                    <div className="portfolio-gallery-card__veil absolute inset-0 z-20" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 z-30 p-5 text-left sm:p-6">
                      <span className="portfolio-gallery-card__category">
                        {getCategoryLabel(item.category)}
                      </span>
                      <h2 className="portfolio-gallery-card__title mt-2 line-clamp-2 text-lg leading-tight sm:text-xl">
                        {item.title}
                      </h2>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      </main>

      <PortfolioFooter />

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
