import { useRoute } from 'wouter';
import { Calendar, ArrowLeft, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useBlogPosts } from '@/hooks/useFirestore';
import NotFound from './NotFound';
import ThemeToggle from '@/components/ThemeToggle';

const categories = [
  { id: 'proceso', label: 'Proceso Creativo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' },
  { id: 'industria', label: 'Industria', color: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100' },
  { id: 'tips', label: 'Tips & Herramientas', color: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' },
  { id: 'experiencia', label: 'Experiencia', color: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100' },
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
  const { data: allPosts } = useBlogPosts();

  useEffect(() => {
    if (!params?.id) return;
    getDoc(doc(db, 'blogPosts', params.id)).then((snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() } as BlogPost);
        // Incrementar contador de vistas
        updateDoc(doc(db, 'blogPosts', params.id), { views: increment(1) });
      } else {
        setPost(null);
      }
    });
  }, [params?.id]);

  if (!match) return <NotFound />;
  if (post === undefined) return null; // loading
  if (post === null) return <NotFound />;

  const relatedPosts = allPosts.filter(
    (p) => p.id !== post.id && p.category === post.category
  ).slice(0, 3);

  const getCategoryLabel = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.label || categoryId;
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border sticky top-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm z-40">
        <div className="container py-6 flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/'}
            className="text-2xl font-display text-foreground hover:text-accent transition-colors"
          >
            Mery Palencia
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/blog'}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
              Volver al Blog
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO CON IMAGEN */}
      <section className="relative h-96 md:h-[500px] overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <article className="py-16 md:py-24 bg-background dark:bg-slate-950">
        <div className="container max-w-3xl">
          {/* Meta información */}
          <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap items-center gap-4">
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
            <h1 className="text-5xl md:text-6xl font-display text-foreground leading-tight">
              {post.title}
            </h1>

            {/* Autor */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/30 to-orange-100 flex items-center justify-center">
                <span className="text-lg font-display text-accent">MP</span>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-muted transition-colors text-foreground"
            >
              <Share2 size={18} />
              Compartir
            </button>
          </div>
        </div>
      </article>

      {/* ARTÍCULOS RELACIONADOS */}
      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-slate-950 border-t border-border">
          <div className="container max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-display text-foreground mb-12">
              Artículos Relacionados
            </h2>

            <div className="space-y-8">
              {relatedPosts.map((relatedPost, index) => (
                <div key={relatedPost.id} className="group block animate-in fade-in slide-in-from-bottom-4 duration-500 cursor-pointer" style={{ animationDelay: `${index * 100}ms` }} onClick={() => window.location.href = `/blog/${relatedPost.id}`}>
                    <article className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-8 border-b border-border last:border-b-0 hover:opacity-80 transition-opacity">
                      <div className="md:col-span-1">
                        <div className="relative overflow-hidden rounded-lg shadow-soft group-hover:shadow-soft-lg transition-all">
                          <img
                            src={relatedPost.image}
                            alt={relatedPost.title}
                            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(relatedPost.category)}`}>
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
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-orange-50/30 to-white dark:from-orange-950/10 dark:to-slate-950">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            ¿Inspirado? Vamos a crear algo juntos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Si te interesa mi trabajo o quieres discutir un proyecto, no dudes en contactarme.
          </p>
          <button
            onClick={() => window.location.href = '/#contact-section'}
            className="inline-block px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-all duration-300"
          >
            Solicitar Comisión
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-foreground/5 dark:bg-slate-950 border-t border-border py-12">
        <div className="container text-center space-y-4">
          <h3 className="text-2xl font-display text-foreground">
            Mery Palencia
          </h3>
          <p className="text-muted-foreground">
            Ilustradora Digital | Diseño de Personajes | Arte Conceptual
          </p>
          <p className="text-sm text-muted-foreground">
            © 2024 Mery Palencia. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
