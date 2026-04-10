import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Calendar } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useFirestore';

const C = { dark: '#062126', teal: '#52D5C1', white: '#FCFCFC', mint: '#80FAE3' };

const categories = [
  { id: 'proceso', label: 'Proceso Creativo' },
  { id: 'industria', label: 'Industria' },
  { id: 'tips', label: 'Tips & Herramientas' },
  { id: 'experiencia', label: 'Experiencia' },
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: blogPosts } = useBlogPosts();
  const [location, navigate] = useLocation();
  const isActive = (path: string) => location === path;

  const filteredPosts = selectedCategory
    ? blogPosts.filter(post => post.published && post.category === selectedCategory)
    : blogPosts.filter(post => post.published);

  const getCategoryLabel = (id: string) => categories.find(c => c.id === id)?.label || id;

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
      <section className="py-16 md:py-24" style={{background: `radial-gradient(ellipse at 30% 50%, ${C.teal}30 0%, ${C.dark} 60%)`}}>
        <div className="container">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs tracking-widest uppercase font-medium" style={{color: C.teal}}>Blog & Artículos</p>
            <h1 className="text-5xl md:text-6xl font-display leading-tight" style={{color: C.white}}>
              Procesos Creativos & Reflexiones
            </h1>
            <p className="text-xl" style={{color: `${C.white}70`}}>
              Comparto mis experiencias, técnicas y pensamientos sobre la ilustración digital y la industria creativa.
            </p>
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section className="py-6" style={{backgroundColor: `${C.white}08`, borderTop: `1px solid ${C.teal}20`, borderBottom: `1px solid ${C.teal}20`}}>
        <div className="container">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium" style={{color: `${C.white}60`}}>Filtrar por:</span>
            <button onClick={() => setSelectedCategory(null)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedCategory === null ? C.teal : 'transparent',
                color: selectedCategory === null ? C.dark : `${C.white}80`,
                border: `1px solid ${selectedCategory === null ? C.teal : `${C.white}20`}`,
              }}>
              Todos
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedCategory === cat.id ? C.teal : 'transparent',
                  color: selectedCategory === cat.id ? C.dark : `${C.white}80`,
                  border: `1px solid ${selectedCategory === cat.id ? C.teal : `${C.white}20`}`,
                }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ARTÍCULOS */}
      <section className="py-16 md:py-24" style={{backgroundColor: C.dark}}>
        <div className="container">
          {filteredPosts.length === 0 ? (
            <p className="text-center py-12" style={{color: `${C.white}60`}}>No hay artículos en esta categoría aún.</p>
          ) : (
            <div className="space-y-8">
              {filteredPosts.map((post, index) => (
                <div key={post.id} className="group cursor-pointer rounded-2xl p-6 transition-all"
                  style={{backgroundColor: `${C.white}05`, border: `1px solid ${C.teal}15`}}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${C.teal}40`}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = `${C.teal}15`}
                  onClick={() => navigate(`/blog/${post.id}`)}>
                  <article className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="md:col-span-1">
                      <div className="relative overflow-hidden rounded-xl">
                        <img src={post.image} alt={post.title}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{backgroundColor: `${C.teal}20`, color: C.teal}}>
                          {getCategoryLabel(post.category)}
                        </span>
                        <div className="flex items-center gap-1 text-xs" style={{color: `${C.white}70`}}>
                          <Calendar size={13} />
                          {new Date(post.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display transition-colors" style={{color: C.white}}>
                        {post.title}
                      </h2>
                      <p className="leading-relaxed" style={{color: `${C.white}70`}}>{post.excerpt}</p>
                      <div className="flex items-center gap-2 text-sm font-medium pt-1" style={{color: C.teal}}>
                        Leer artículo <ArrowRight size={16} />
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20" style={{backgroundColor: C.teal}}>
        <div className="container text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-display" style={{color: C.dark}}>¿Listo para trabajar juntos?</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{color: `${C.dark}80`}}>
            Si te interesa mi trabajo o quieres discutir un proyecto, no dudes en contactarme.
          </p>
          <Link to="/#contact-section"
            className="inline-block px-8 py-3 rounded-full font-semibold text-sm transition-all"
            style={{backgroundColor: C.dark, color: C.white}}>
            Solicitar Comisión
          </Link>
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
    </div>
  );
}
