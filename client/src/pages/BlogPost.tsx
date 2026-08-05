import { useRoute, Link } from 'wouter';
import { Calendar, ArrowLeft, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useBlogPosts } from '@/hooks/useFirestore';
import NotFound from './NotFound';
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

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  readTime: number;
  image: string;
  author: string;
  published: boolean;
  videoUrl?: string;
}

/**
 * PÁGINA INDIVIDUAL DE ARTÍCULO
 * Muestra el contenido completo del artículo con navegación
 */

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v');
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export default function BlogPost() {
  const [match, params] = useRoute('/blog/:id');
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [loadRevision, setLoadRevision] = useState(0);
  const { data: allPosts } = useBlogPosts();

  useEffect(() => {
    if (!params?.id) return;
    setPost(undefined);
    setLoadError(false);
    if (!isFirebaseConfigured) {
      setLoadError(true);
      return;
    }
    getDoc(doc(db, 'blogPosts', params.id))
      .then((snap) => {
        const data = snap.data();
        if (snap.exists() && data?.published === true) {
          setPost({ id: snap.id, ...data } as BlogPost);
        } else {
          setPost(null);
        }
      })
      .catch(() => setLoadError(true));
  }, [params?.id, loadRevision]);

  if (!match) return <NotFound />;
  if (loadError) {
    return (
      <main id="main-content" className="min-h-screen bg-background flex items-center justify-center p-6">
        <ContentStatus
          kind="error"
          title="No pudimos cargar el artículo"
          description="Comprueba tu conexión e inténtalo nuevamente."
          onRetry={() => setLoadRevision((current) => current + 1)}
        />
      </main>
    );
  }
  if (post === undefined) {
    return (
      <main id="main-content" className="min-h-screen bg-background flex items-center justify-center">
        <p role="status" className="text-muted-foreground">Cargando artículo…</p>
      </main>
    );
  }
  if (post === null) return <NotFound />;

  const relatedPosts = allPosts.filter(
    (p) => p.id !== post.id && p.category === post.category
  ).slice(0, 3);

  const getCategoryLabel = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.label || categoryId;
  };

  return (
    <div className="portfolio-page portfolio-page-enter min-h-screen bg-background">
      <Seo
        title={post.title}
        description={post.excerpt}
        path={`/blog/${post.id}`}
        image={cloudinaryImage(post.image, { width: 1200 })}
        imageAlt={post.title}
        type="article"
      />
      <PortfolioDock />

      <main id="main-content">
      {/* HERO CON IMAGEN */}
      <section className="relative h-96 md:h-[500px] overflow-hidden">
        <img
          src={cloudinaryImage(post.image, { width: 1600 })}
          srcSet={cloudinarySrcSet(post.image, [720, 1080, 1440, 1920])}
          sizes="100vw"
          alt={post.title}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <article className="portfolio-section bg-background">
        <div className="container max-w-3xl">
          {/* Meta información */}
          <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap items-center gap-4">
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
            <h1 className="text-5xl md:text-6xl font-display text-foreground leading-tight">
              {post.title}
            </h1>

            {/* Autor */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <div className="portfolio-surface flex h-12 w-12 items-center justify-center rounded-xl p-2">
                <img src="/logo/logo.svg" alt="" aria-hidden="true" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="font-medium text-foreground">{post.author}</p>
                <p className="text-sm text-muted-foreground">Ilustradora Digital</p>
              </div>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="prose prose-lg max-w-none text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            {post.content.split('\n\n').map((paragraph, index) => {
              // Detectar encabezados (comienzan con ##)
              if (paragraph.startsWith('##')) {
                const heading = paragraph.replace('## ', '');
                return (
                  <h2 key={index} className="text-3xl font-display text-foreground mt-8 mb-4">
                    {heading}
                  </h2>
                );
              }

              // Detectar listas numeradas
              if (paragraph.match(/^\d+\./)) {
                const items = paragraph.split('\n').filter(line => line.trim());
                return (
                  <ol key={index} className="list-decimal list-inside space-y-3 my-6 text-lg text-foreground/90">
                    {items.map((item, i) => (
                      <li key={i} className="leading-relaxed">
                        {item.replace(/^\d+\.\s*/, '')}
                      </li>
                    ))}
                  </ol>
                );
              }

              // Párrafos normales
              return (
                <p key={index} className="text-lg text-foreground/80 leading-relaxed mb-6">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* VIDEO YOUTUBE */}
          {post.videoUrl && getYouTubeEmbedUrl(post.videoUrl) && (
            <div className="mt-10">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-soft-lg">
                <iframe
                  src={getYouTubeEmbedUrl(post.videoUrl)!}
                  title={post.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          )}

          {/* COMPARTIR */}
          <div className="mt-12 pt-8 border-t border-border flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Compartir:</span>
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `${post.title} - ${post.excerpt}`;
                if (navigator.share) {
                  navigator.share({ title: post.title, text, url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert('Enlace copiado al portapapeles');
                }
              }}
              className="portfolio-button portfolio-button--secondary"
            >
              <Share2 size={18} />
              Compartir
            </button>
          </div>
        </div>
      </article>

      {/* ARTÍCULOS RELACIONADOS */}
      {relatedPosts.length > 0 && (
        <section className="portfolio-section bg-card border-t border-border">
          <div className="container max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-display text-foreground mb-12">
              Artículos Relacionados
            </h2>

            <div className="space-y-8">
              {relatedPosts.map((relatedPost, index) => (
                <Link key={relatedPost.id} to={`/blog/${relatedPost.id}`} className="group block animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-lg" style={{ animationDelay: `${index * 100}ms` }}>
                    <article className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-8 border-b border-border last:border-b-0 hover:opacity-80 transition-opacity">
                      <div className="md:col-span-1">
                        <div className="relative overflow-hidden rounded-lg shadow-soft group-hover:shadow-soft-lg transition-all">
                          <img
                            src={cloudinaryImage(relatedPost.image, { width: 600 })}
                            srcSet={cloudinarySrcSet(relatedPost.image, [320, 480, 600])}
                            sizes="(min-width: 768px) 33vw, 100vw"
                            alt={relatedPost.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        <span className="portfolio-tag">
                          {getCategoryLabel(relatedPost.category)}
                        </span>
                        <h3 className="text-xl font-display text-foreground group-hover:text-accent transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {relatedPost.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-accent font-medium pt-2 group-hover:gap-3 transition-all">
                          Leer más
                          <ArrowLeft size={18} className="rotate-180" />
                        </div>
                      </div>
                    </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="portfolio-section bg-card">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            ¿Inspirado? Vamos a crear algo juntos
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
