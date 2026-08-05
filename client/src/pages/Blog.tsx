import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Calendar, FileText, SlidersHorizontal } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useFirestore';
import Seo from '@/components/Seo';
import ContentStatus from '@/components/ContentStatus';
import { cloudinaryImage, cloudinarySrcSet } from '@/lib/images';
import PortfolioDock from '@/components/PortfolioDock';
import PortfolioFooter from '@/components/PortfolioFooter';


const categories = [
  { id: 'proceso', label: 'Proceso Creativo' },
  { id: 'industria', label: 'Industria' },
  { id: 'tips', label: 'Tips & Herramientas' },
  { id: 'experiencia', label: 'Experiencia' },
];

/**
 * PÁGINA DE BLOG
 * Listado de artículos con filtrado por categoría
 * Diseño minimalista coherente con el portafolio
 */

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: blogPosts, loading, error, retry } = useBlogPosts();

  const filteredPosts = selectedCategory
    ? blogPosts.filter(post => post.published && post.category === selectedCategory)
    : blogPosts.filter(post => post.published);

  const getCategoryLabel = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.label || categoryId;
  };

  return (
    <div className="portfolio-page portfolio-collection-page portfolio-page-enter min-h-screen bg-background">
      <Seo
        title="Blog de ilustración"
        description="Procesos creativos, técnicas y reflexiones sobre ilustración digital, diseño de personajes y la industria creativa."
        path="/blog"
      />
      <PortfolioDock />

      <main id="main-content">
      {/* HERO DEL BLOG */}
      <section className="portfolio-collection-hero">
        <div className="container grid gap-7 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="portfolio-eyebrow mb-3">Blog & Artículos</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl md:text-7xl">
              Procesos, oficio y reflexiones
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Experiencias, técnicas y pensamientos sobre ilustración digital y vida creativa.
            </p>
          </div>

          <div className="portfolio-collection-summary" aria-live="polite">
            <FileText size={21} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <strong>{loading ? '—' : blogPosts.filter((post) => post.published).length}</strong>
              <span>artículos publicados</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS DE CATEGORÍA */}
      <section className="portfolio-filter-section">
        <div className="container">
          <div className="portfolio-filter-scroll">
            <SlidersHorizontal size={17} className="mr-1 shrink-0 text-primary" aria-hidden="true" />
            <span className="mr-1 shrink-0 text-sm text-muted-foreground">Filtrar por</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`portfolio-button min-h-11 rounded-full px-4 py-2 text-sm ${
                selectedCategory === null
                  ? 'portfolio-button--primary'
                  : 'portfolio-button--secondary'
              }`}
              aria-pressed={selectedCategory === null}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`portfolio-button min-h-11 rounded-full px-4 py-2 text-sm ${
                  selectedCategory === category.id
                    ? 'portfolio-button--primary'
                    : 'portfolio-button--secondary'
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
      <section className="portfolio-section bg-background">
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
            <div className="portfolio-blog-grid">
              {filteredPosts.map((post, index) => (
                <Link key={post.id} to={`/blog/${post.id}`} className={`group block animate-in fade-in slide-in-from-bottom-4 duration-500 ${index === 0 ? 'portfolio-blog-link--feature' : ''}`} style={{ animationDelay: `${index * 100}ms` }}>
                    <article className={`portfolio-blog-card ${index === 0 ? 'portfolio-blog-card--feature' : ''}`}>
                      {/* Imagen */}
                      <div className="portfolio-blog-card__media">
                          <img
                            src={cloudinaryImage(post.image, { width: 720 })}
                            srcSet={cloudinarySrcSet(post.image, [360, 540, 720, 960])}
                            sizes="(min-width: 768px) 33vw, 100vw"
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                          />
                      </div>

                      {/* Contenido */}
                      <div className="flex flex-1 flex-col p-6 sm:p-7">
                        {/* Categoría y Meta */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="portfolio-tag">
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
                        <h2 className="portfolio-blog-card__title mt-5 text-2xl leading-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="mt-4 line-clamp-3 leading-7 text-muted-foreground">
                          {post.excerpt}
                        </p>

                        {/* CTA */}
                        <div className="mt-7 flex items-center gap-2 border-t border-border/60 pt-5 text-sm font-semibold text-primary transition-all group-hover:gap-3">
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
      <section className="portfolio-section portfolio-section--cta">
        <div className="portfolio-blog-cta container text-center">
          <p className="portfolio-eyebrow mb-4">Trabajemos juntos</p>
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            ¿Listo para trabajar juntos?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Si te interesa mi trabajo o quieres discutir un proyecto, no dudes en contactarme.
          </p>
          <Link
            to="/#contact-section"
            className="portfolio-button portfolio-button--primary mt-7"
          >
            Solicitar Comisión
          </Link>
        </div>
      </section>

      </main>

      <PortfolioFooter />
    </div>
  );
}
