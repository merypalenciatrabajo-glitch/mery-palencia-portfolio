import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Calendar } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useFirestore';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

const categories = [
  { id: 'proceso', label: 'Proceso Creativo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' },
  { id: 'industria', label: 'Industria', color: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100' },
  { id: 'tips', label: 'Tips & Herramientas', color: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' },
  { id: 'experiencia', label: 'Experiencia', color: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100' },
];

/**
 * PÁGINA DE BLOG
 * Listado de artículos con filtrado por categoría
 * Diseño minimalista coherente con el portafolio
 */

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { theme } = useTheme();
  const { data: blogPosts } = useBlogPosts();
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

  const getCategoryDarkStyle = (categoryId: string) => {
    if (theme !== 'dark') return {};
    const darkColors: Record<string, string> = {
      'proceso': '#3e8ff2',
      'industria': '#7833d7',
      'tips': '#0fc8cc',
      'experiencia': '#ff0080'
    };
    return { backgroundColor: darkColors[categoryId] || '#ffffff' };
  };

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
            <Link to="/blog" className={`font-medium transition-colors ${isActive('/blog') ? 'text-accent border-b-2 border-accent pb-0.5' : 'text-foreground hover:text-accent'}`}>
              Blog
            </Link>
            <Link to="/galeria" className={`font-medium transition-colors ${isActive('/galeria') ? 'text-accent border-b-2 border-accent pb-0.5' : 'text-foreground hover:text-accent'}`}>
              Galería
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO DEL BLOG */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-white via-white to-orange-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-orange-950/20">
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
      <section className="py-12 bg-white dark:bg-slate-950 border-b border-border">
        <div className="container">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-accent text-white'
                  : 'bg-secondary text-foreground hover:bg-muted'
              }`}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-accent text-white'
                    : 'bg-secondary text-foreground hover:bg-muted'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* LISTADO DE ARTÍCULOS */}
      <section className="py-16 md:py-24 bg-background dark:bg-slate-950">
        <div className="container">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No hay artículos en esta categoría aún.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredPosts.map((post, index) => (
                <div key={post.id} className="group block animate-in fade-in slide-in-from-bottom-4 duration-500 cursor-pointer" style={{ animationDelay: `${index * 100}ms` }} onClick={() => window.location.href = `/blog/${post.id}`}>
                    <article className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pb-12 border-b border-border last:border-b-0 hover:opacity-80 transition-opacity">
                      {/* Imagen */}
                      <div className="md:col-span-1 order-2 md:order-1">
                        <div className="relative overflow-hidden rounded-lg shadow-soft group-hover:shadow-soft-lg transition-all duration-300">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="md:col-span-2 order-1 md:order-2 space-y-4">
                        {/* Categoría y Meta */}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(post.category)}`} style={getCategoryDarkStyle(post.category)}>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-orange-50/30 to-white dark:from-orange-950/10 dark:to-slate-950">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            ¿Listo para trabajar juntos?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Si te interesa mi trabajo o quieres discutir un proyecto, no dudes en contactarme.
          </p>
          <button
            onClick={() => window.location.href = '/#contact-section'}
            className="inline-block px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-all duration-300 cursor-pointer"
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
