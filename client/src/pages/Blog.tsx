import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Calendar } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useFirestore';
import Seo from '@/components/Seo';
import ContentStatus from '@/components/ContentStatus';
import { cloudinaryImage, cloudinarySrcSet } from '@/lib/images';


const categories = [
  { id: 'proceso', label: 'Proceso Creativo', color: 'bg-blue-900/40 text-blue-300' },
  { id: 'industria', label: 'Industria', color: 'bg-purple-900/40 text-purple-300' },
  { id: 'tips', label: 'Tips & Herramientas', color: 'bg-teal-900/40 text-teal-300' },
  { id: 'experiencia', label: 'Experiencia', color: 'bg-orange-900/40 text-orange-300' },
];

/**
 * PÁGINA DE BLOG
 * Listado de artículos con filtrado por categoría
 * Diseño minimalista coherente con el portafolio
 */

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: blogPosts, loading, error, retry } = useBlogPosts();
  const [location] = useLocation();
  const isActive = (path: string) => location === path;

  const filteredPosts = selectedCategory
    ? blogPosts.filter(post => post.published && post.category === selectedCategory)
    : blogPosts.filter(post => post.published);

  const getCategoryLabel = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.label || categoryId;
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '';
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Blog de ilustración"
        description="Procesos creativos, técnicas y reflexiones sobre ilustración digital, diseño de personajes y la industria creativa."
        path="/blog"
      />
      {/* HEADER */}
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur-sm z-40">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex min-h-11 min-w-11 items-center hover:opacity-80 transition-opacity" aria-label="Ir al inicio">
            <img src="/logo/logo.svg" alt="" aria-hidden="true" className="w-auto" style={{ height: '44px' }} />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navegación principal">
            <Link to="/" className="inline-flex min-h-11 items-center px-2 font-medium transition-colors text-foreground hover:text-accent">
              Inicio
            </Link>
            <Link to="/blog" aria-current="page" className={`inline-flex min-h-11 items-center px-2 font-medium transition-colors ${isActive('/blog') ? 'text-accent border-b-2 border-accent' : 'text-foreground hover:text-accent'}`}>
              Blog
            </Link>
            <Link to="/galeria" className={`inline-flex min-h-11 items-center px-2 font-medium transition-colors ${isActive('/galeria') ? 'text-accent border-b-2 border-accent' : 'text-foreground hover:text-accent'}`}>
              Galería
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
      {/* HERO DEL BLOG */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-sm tracking-widest text-muted-foreground uppercase">
              Blog & Artículos
            </p>
            <h1 className="text-5xl md:text-6xl font-display text-foreground leading-tight">
              Procesos Creativos & Reflexiones
            </h1>
            <p className="text-xl text-muted-foreground">
              Comparto mis experiencias, técnicas y pensamientos sobre la ilustración digital y la industria creativa.
            </p>
          </div>
        </div>
      </section>

      {/* FILTROS DE CATEGORÍA */}
      <section className="py-12 bg-card border-b border-border">
        <div className="container">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-foreground hover:bg-muted'
              }`}
              aria-pressed={selectedCategory === null}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-foreground hover:bg-muted'
                }`}
                aria-pressed={selectedCategory === category.id}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* LISTADO DE ARTÍCULOS */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          {loading ? (
            <div className="space-y-8" role="status" aria-label="Cargando artículos">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="aspect-square animate-pulse rounded-lg bg-muted" />
                  <div className="space-y-4 py-3 md:col-span-2">
                    <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <ContentStatus
              kind="error"
              title="No pudimos cargar los artículos"
              description="Comprueba tu conexión e inténtalo nuevamente."
              onRetry={retry}
            />
          ) : filteredPosts.length === 0 ? (
            <ContentStatus
              kind="empty"
              title="Aún no hay artículos publicados"
              description={selectedCategory ? 'No hay artículos disponibles en esta categoría.' : 'Vuelve pronto para leer nuevas publicaciones.'}
            />
          ) : (
            <div className="space-y-12">
              {filteredPosts.map((post, index) => (
                <Link key={post.id} to={`/blog/${post.id}`} className="group block animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg" style={{ animationDelay: `${index * 100}ms` }}>
                    <article className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pb-12 border-b border-border last:border-b-0 hover:opacity-80 transition-opacity">
                      {/* Imagen */}
                      <div className="md:col-span-1 order-2 md:order-1">
                        <div className="relative overflow-hidden rounded-lg shadow-soft group-hover:shadow-soft-lg transition-all duration-300">
                          <img
                            src={cloudinaryImage(post.image, { width: 720 })}
                            srcSet={cloudinarySrcSet(post.image, [360, 540, 720, 960])}
                            sizes="(min-width: 768px) 33vw, 100vw"
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="md:col-span-2 order-1 md:order-2 space-y-4">
                        {/* Categoría y Meta */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`}>
                            {getCategoryLabel(post.category)}
                          </span>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              {new Date(post.date).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Título */}
                        <h2 className="text-2xl md:text-3xl font-display text-foreground group-hover:text-accent transition-colors">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {post.excerpt}
                        </p>

                        {/* CTA */}
                        <div className="flex items-center gap-2 text-accent font-medium pt-2 group-hover:gap-3 transition-all">
                          Leer artículo
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            ¿Listo para trabajar juntos?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Si te interesa mi trabajo o quieres discutir un proyecto, no dudes en contactarme.
          </p>
          <Link
            to="/#contact-section"
            className="inline-flex min-h-11 items-center px-8 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-all duration-300 cursor-pointer"
          >
            Solicitar Comisión
          </Link>
        </div>
      </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container text-center space-y-4">
          <h3 className="text-2xl font-display text-foreground">
            Mery Palencia
          </h3>
          <p className="text-muted-foreground">
            Ilustradora Digital | Diseño de Personajes | Arte Conceptual
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mery Palencia. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
