import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Lightbox from '@/components/Lightbox';
import { useGalleryPage } from '@/hooks/useFirestore';

const C = { dark: '#062126', teal: '#52D5C1', white: '#FCFCFC', mint: '#80FAE3' };

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

const CATEGORY_ALIASES: Record<string, string> = {
  'otro': 'otros', 'personajes': 'ilustracion-digital',
  'escenarios': 'ilustracion-digital', 'props': 'material-digital', 'abstracto': 'ilustracion-digital',
};

const normalizeCategory = (cat: string) => CATEGORY_ALIASES[cat] ?? cat;

type GalleryItem = {
  id: string; title: string; image: string; category: string;
  description: string; order: number; extraImages: { url: string; publicId: string }[];
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const CATEGORY_ORDER = ['fotografia-paisaje','fotografia-infantil','fotografia-moda','fotografia-documental','ilustracion-digital','material-digital','trabajos-analogos'];

  const availableCategories = useMemo(() => {
    const inItems = new Set(items.map(i => normalizeCategory(i.category)));
    const predefined = CATEGORY_ORDER.filter(k => inItems.has(k));
    const custom = [...inItems].filter(k => k !== 'otros' && !CATEGORY_LABELS[k]);
    return [...predefined, ...custom, ...(inItems.has('otros') ? ['otros'] : [])];
  }, [items]);

  const filteredItems = useMemo(() => {
    const result = activeCategory ? items.filter(i => normalizeCategory(i.category) === activeCategory) : items;
    return [...result].sort((a, b) => a.order - b.order);
  }, [items, activeCategory]);

  const getCategoryLabel = (cat: string) => CATEGORY_LABELS[normalizeCategory(cat)] ?? cat;

  return (
    <div className="min-h-screen" style={{backgroundColor: C.dark}}>

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{backgroundColor: `${C.dark}e6`, borderBottom: `1px solid ${C.teal}20`}}>
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display" style={{color: C.white}}>Mery Palencia</Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium" style={{color: `${C.white}80`}}>Inicio</Link>
            <Link to="/blog" className="text-sm font-medium" style={{color: isActive('/blog') ? C.teal : `${C.white}80`}}>Blog</Link>
            <Link to="/galeria" className="text-sm font-medium" style={{color: isActive('/galeria') ? C.teal : `${C.white}80`}}>Galería</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="py-8 md:py-10" style={{background: `radial-gradient(ellipse at 50% 80%, ${C.teal}35 0%, ${C.dark} 65%)`}}>
        <div className="container text-center space-y-3">
          <p className="text-xs tracking-widest uppercase font-medium" style={{color: C.teal}}>Fotografía & Arte</p>
          <h1 className="text-4xl md:text-5xl font-display" style={{color: C.white}}>Galería</h1>
          <p className="text-lg max-w-xl mx-auto" style={{color: `${C.white}70`}}>Explora todos mis trabajos y obras</p>
        </div>
      </section>

      {/* FILTROS */}
      {!loading && availableCategories.length > 0 && (
        <section className="py-5" style={{backgroundColor: `${C.white}06`, borderTop: `1px solid ${C.teal}20`, borderBottom: `1px solid ${C.teal}20`}}>
          <div className="container flex items-center gap-3">
            <span className="text-sm" style={{color: `${C.white}60`}}>Filtrar por:</span>
            <div ref={dropdownRef} className="relative">
              <button onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                style={{backgroundColor: `${C.white}08`, border: `1px solid ${C.teal}30`, color: C.white}}>
                <span>{activeCategory ? getCategoryLabel(activeCategory) : 'Todas las categorías'}</span>
                <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{color: C.teal}} />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[220px] rounded-xl overflow-hidden shadow-xl"
                  style={{backgroundColor: '#0d3540', border: `1px solid ${C.teal}30`}}>
                  <button onClick={() => { setActiveCategory(null); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm transition-colors"
                    style={{color: activeCategory === null ? C.teal : `${C.white}80`, backgroundColor: activeCategory === null ? `${C.teal}15` : 'transparent'}}>
                    Todas las categorías
                  </button>
                  {availableCategories.map(cat => (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm transition-colors"
                      style={{color: activeCategory === cat ? C.teal : `${C.white}80`, backgroundColor: activeCategory === cat ? `${C.teal}15` : 'transparent'}}>
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)} className="text-xs underline underline-offset-2 transition-colors"
                style={{color: `${C.white}50`}}>
                Limpiar
              </button>
            )}
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="py-8 md:py-10" style={{backgroundColor: C.dark}}>
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl animate-pulse" style={{backgroundColor: `${C.white}10`}} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-center py-20 text-lg" style={{color: `${C.white}50`}}>No hay trabajos en esta categoría aún.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredItems.map(item => (
                <div key={item.id} className="group cursor-pointer" onClick={() => { setSelected(item); setLightboxOpen(true); }}>
                  <div className="relative overflow-hidden rounded-xl">
                    <img src={item.image} alt={item.title}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">Ver Detalle</span>
                    </div>
                  </div>
                  <h3 className="mt-3 text-sm font-display truncate transition-colors" style={{color: `${C.white}90`}}>{item.title}</h3>
                  <p className="text-xs mt-0.5" style={{color: C.teal}}>{getCategoryLabel(item.category)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{backgroundColor: '#041a1e'}} className="py-14">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-2">
              <h3 className="text-2xl font-display" style={{color: C.white}}>Mery Palencia</h3>
              <p className="text-sm font-medium" style={{color: C.teal}}>Ilustradora Digital · Diseño de Personajes · Arte Conceptual</p>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-sm transition-colors" style={{color: `${C.white}80`}}>Inicio</Link>
              <Link to="/blog" className="text-sm transition-colors" style={{color: `${C.white}80`}}>Blog</Link>
              <Link to="/galeria" className="text-sm transition-colors" style={{color: `${C.white}80`}}>Galería</Link>
            </div>
          </div>
          <div className="mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
            style={{borderTop: `1px solid ${C.teal}25`}}>
            <p className="text-sm" style={{color: `${C.white}60`}}>© 2024 Mery Palencia. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium" style={{color: `${C.white}60`}}>Instagram</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium" style={{color: `${C.white}60`}}>LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>

      {selected && (
        <Lightbox isOpen={lightboxOpen} image={selected.image} title={selected.title}
          category={selected.category} description={selected.description}
          extraImages={selected.extraImages} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
