import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Calendar } from 'lucide-react';
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
    <div className="portfolio-page portfolio-page-enter min-h-screen bg-background">
      <Seo
        title="Blog de ilustración"
        description="Procesos creativos, técnicas y reflexiones sobre ilustración digital, diseño de personajes y la industria creativa."
        path="/blog"
      />
      <PortfolioDock />

      <main id="main-content">
      {/* HERO DEL BLOG */}
      <section className="portfolio-section bg-background">
        <div className="container">
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="portfolio-eyebrow">
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
      <section className="portfolio-section bg-card">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            ¿Listo para trabajar juntos?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Si te interesa mi trabajo o quieres discutir un proyecto, no dudes en contactarme.
          </p>
          <Link
            to="/#contact-section"
            className="portfolio-button portfolio-button--primary"
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
