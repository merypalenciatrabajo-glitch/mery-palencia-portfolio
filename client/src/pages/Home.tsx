import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Mail, Instagram, Linkedin, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Lightbox from '@/components/Lightbox';
import { useGallery, useCommissions, useProcessSteps } from '@/hooks/useFirestore';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE = 'service_portfolio';
const EMAILJS_TEMPLATE = 'template_b80smad';
const EMAILJS_PUBLIC_KEY = 'ZLrXjIYd_3R2ZklPB';

/**
 * DISEÑO MINIMALISTA CONTEMPORÁNEO
 * - Tipografía como protagonista (Playfair Display + Lora + Inter)
 * - Paleta neutral cálida (blanco roto, grises suaves, terracota suave)
 * - Espacio negativo generoso
 * - Gradientes sutiles
 * - Interacciones elegantes
 */


type GalleryItem = { id: string; title: string; image: string; category?: string; description?: string; extraImages?: { url: string; publicId: string }[] };

function InfiniteCarousel({
  items,
  onItemClick,
}: {
  items: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const SPEED = 0.5; // px per frame
  const CARD_WIDTH = 260;
  const GAP = 24;
  const STEP = CARD_WIDTH + GAP;

  // We render 3 copies so there's always content on both sides
  const repeated = [...items, ...items, ...items];

  useEffect(() => {
    if (items.length === 0) return;
    const totalWidth = items.length * STEP;

    const animate = () => {
      if (!pausedRef.current) {
        offsetRef.current += SPEED;
        // When we've scrolled one full set, jump back silently
        if (offsetRef.current >= totalWidth) {
          offsetRef.current -= totalWidth;
        }
        if (trackRef.current) {
          trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items.length]);

  const step = (dir: 1 | -1) => {
    offsetRef.current += dir * STEP;
    const totalWidth = items.length * STEP;
    if (offsetRef.current < 0) offsetRef.current += totalWidth;
    if (offsetRef.current >= totalWidth * 2) offsetRef.current -= totalWidth;
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.4s ease';
      trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
      setTimeout(() => {
        if (trackRef.current) trackRef.current.style.transition = '';
      }, 400);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isDraggingRef.current = false;
    pausedRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;

    // Only hijack horizontal swipes
    if (!isDraggingRef.current && Math.abs(deltaX) < Math.abs(deltaY)) {
      pausedRef.current = false;
      return;
    }
    isDraggingRef.current = true;
    e.preventDefault();

    const totalWidth = items.length * STEP;
    let newOffset = offsetRef.current - deltaX;
    if (newOffset < 0) newOffset += totalWidth;
    if (newOffset >= totalWidth * 2) newOffset -= totalWidth;

    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${newOffset}px)`;
    }
    // Update offset continuously so touchend picks up the right position
    offsetRef.current = newOffset;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    pausedRef.current = false;
  };

  return (
    <div className="relative">
      <button
        onClick={() => step(-1)}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        className="absolute left-0 top-[45%] -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-card shadow-soft border border-border flex items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300"
        aria-label="Anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => step(1)}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-card shadow-soft border border-border flex items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300"
        aria-label="Siguiente"
      >
        <ChevronRight size={20} />
      </button>

      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex"
          style={{ gap: `${GAP}px`, willChange: 'transform' }}
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {repeated.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="group cursor-pointer flex-none"
              style={{ width: `${CARD_WIDTH}px` }}
              onClick={() => onItemClick(item)}
            >
              <div className="relative overflow-hidden rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                    Ver Detalle
                  </span>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-display text-foreground group-hover:text-accent transition-colors truncate">
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: galleryItems } = useGallery();
  const { data: commissionTiers } = useCommissions();
  const { data: processSteps } = useProcessSteps();

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;

    const pauseScenes = () => {
      const scenes = (window.UnicornStudio as any)?.scenes;
      if (!Array.isArray(scenes)) return;
      scenes.forEach((s: any) => { try { s.pause?.(); } catch (_) {} });
    };

    const playScenes = () => {
      const scenes = (window.UnicornStudio as any)?.scenes;
      if (!Array.isArray(scenes)) return;
      scenes.forEach((s: any) => { try { s.play?.(); } catch (_) {} });
    };

    const doInit = () => {
      if (cancelled || !window.UnicornStudio?.init) return;
      window.UnicornStudio.init();

      const el = heroRef.current;
      if (!el) return;

      // Esperar 500ms para que el SDK registre las escenas antes de observar
      setTimeout(() => {
        if (cancelled) return;
        observer = new IntersectionObserver((entries) => {
          clearTimeout(pauseTimer);
          if (entries[0]?.isIntersecting) {
            playScenes();
          } else {
            // Pequeño delay antes de pausar para evitar flicker en scroll rápido
            pauseTimer = setTimeout(pauseScenes, 200);
          }
        }, { threshold: 0 });
        observer.observe(el);
      }, 500);
    };

    if (window.UnicornStudio?.init) {
      const t = setTimeout(doInit, 100);
      return () => { cancelled = true; clearTimeout(t); clearTimeout(pauseTimer); observer?.disconnect(); };
    } else {
      const iv = setInterval(() => {
        if (window.UnicornStudio?.init) { clearInterval(iv); setTimeout(doInit, 100); }
      }, 100);
      return () => { cancelled = true; clearInterval(iv); clearTimeout(pauseTimer); observer?.disconnect(); };
    }
  }, []);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ id: string; title: string; image: string; category?: string; description?: string; extraImages?: { url: string; publicId: string }[] } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const openLightbox = (item: { id: string; title: string; image: string; category?: string; description?: string; extraImages?: { url: string; publicId: string }[] }) => {
    setSelectedImage(item);
    setLightboxOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      await emailjs.send(
        EMAILJS_SERVICE,
        EMAILJS_TEMPLATE,
        {
          from_name: formData.name,
          from_email: formData.email,
          project: formData.project,
          message: formData.message,
        },
        EMAILJS_PUBLIC_KEY
      );
      setFormStatus('sent');
      setFormData({ name: '', email: '', project: '', message: '' });
    } catch (err) {
      console.error(err);
      setFormStatus('error');
    }
  };

  return (
    <div className="min-h-screen">
      {/* HEADER CON BOTÓN DE TEMA */}
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur-sm z-40">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/logo/logo.svg" alt="Mery Palencia" className="w-auto" style={{ height: '44px' }} />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-foreground hover:text-accent transition-colors font-medium">
              Blog
            </Link>
            <Link to="/galeria" className="text-foreground hover:text-accent transition-colors font-medium">
              Galería
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative overflow-hidden bg-black" style={{ height: 'calc(100vh - 57px)' }}>
        {/* Canvas WebGL UnicornStudio — siempre en DOM, pause/play por visibilidad */}
        <div
          data-us-project="4v8wXufmDdV5npLSJDVK"
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none', zIndex: 1 }}
        />
        {/* Gradiente inferior para proteger los botones de la luz */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', zIndex: 2 }}
        />
        {/* Contenido del hero — parte superior de la pantalla */}
        <div className="relative h-full flex flex-col items-center justify-start pt-16 md:pt-20 container" style={{ zIndex: 3 }}>
          <div className="max-w-3xl w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              Ilustración Digital
            </p>
            <div className="flex justify-center">
              <img src="/logo/logo.svg" alt="Mery Palencia" className="w-auto mx-auto" style={{ maxHeight: '280px', maxWidth: '700px' }} />
            </div>
            <p className="text-lg text-foreground/70 leading-relaxed max-w-lg mx-auto">
              Transformo ideas en ilustraciones cautivadoras. Cada proyecto es una oportunidad para crear algo único y memorable que refleje tu visión.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                onClick={() => document.getElementById('commission-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Comisiones
                <ArrowRight className="ml-2" size={20} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-accent text-foreground hover:bg-accent/10 rounded-lg"
                onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Contactar
              </Button>
              <Link to="/blog">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent text-foreground hover:bg-accent/10 rounded-lg"
                >
                  Leer Blog
                </Button>
              </Link>
              <Link to="/galeria">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent text-foreground hover:bg-accent/10 rounded-lg"
                >
                  Ver Galería
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍA SECTION */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container">
          <div className="space-y-4 mb-16 text-center">
            <p className="text-sm tracking-widest text-muted-foreground uppercase">
              Trabajos Destacados
            </p>
            <h2 className="text-4xl md:text-5xl font-display text-foreground">
              Galería de Arte
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explora una selección de mis trabajos más recientes. Haz clic en cualquier imagen para ampliarla.
            </p>
          </div>

          <InfiniteCarousel items={galleryItems} onItemClick={openLightbox} />

          <div className="text-center mt-12">
            <Link
              to="/galeria"
              className="inline-flex items-center gap-2 px-6 py-3 border border-accent text-accent hover:bg-accent hover:text-white rounded-lg font-medium transition-colors duration-300"
            >
              Ver galería completa
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESO SECTION */}
      <section className="py-20 md:py-32 bg-card">
        <div className="container">
          <div className="space-y-4 mb-16 text-center">
            <p className="text-sm tracking-widest text-muted-foreground uppercase">
              Mi Método
            </p>
            <h2 className="text-4xl md:text-5xl font-display text-foreground">
              Proceso Creativo
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desde la idea inicial hasta la obra final, cada paso es cuidadosamente ejecutado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div
                key={step.number}
                className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="text-5xl font-display text-accent/20">
                      {step.number}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-display text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="h-12 w-0.5 bg-gradient-to-b from-accent/40 to-transparent ml-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMISIONES SECTION */}
      <section id="commission-section" className="py-20 md:py-32 bg-background">
        <div className="container">
          <div className="space-y-4 mb-16 text-center">
            <p className="text-sm tracking-widest text-muted-foreground uppercase">
              Servicios
            </p>
            <h2 className="text-4xl md:text-5xl font-display text-foreground">
              Niveles de Comisiones
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Opciones flexibles para proyectos de cualquier escala. Todos los paquetes incluyen revisiones y archivos de alta calidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {commissionTiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                  tier.featured
                    ? 'bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent shadow-soft-lg scale-105 md:scale-110'
                    : 'bg-transparent border-2 border-accent hover:bg-accent/5'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {tier.featured && (
                  <div className="inline-block px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full mb-4">
                    Más Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-display text-foreground mb-2">
                  {tier.name}
                </h3>
                <p className="text-3xl font-display text-accent mb-4">
                  {tier.price}
                </p>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {tier.description}
                </p>
                
                <div className="space-y-3 mb-8">
                  {tier.includes.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-accent dot-animate" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  className={`w-full rounded-lg ${
                    tier.featured
                      ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
                      : 'border border-accent bg-accent/5 text-accent hover:bg-accent/10'
                  }`}
                  onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Solicitar Comisión
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO SECTION */}
      <section id="contact-section" className="py-20 md:py-32 bg-card">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4 mb-12 text-center">
              <p className="text-sm tracking-widest text-muted-foreground uppercase">
                Ponte en Contacto
              </p>
              <h2 className="text-4xl md:text-5xl font-display text-foreground">
                Solicita una Comisión
              </h2>
              <p className="text-lg text-muted-foreground">
                Cuéntame sobre tu proyecto y te responderé en 24-48 horas.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 bg-muted p-8 rounded-xl shadow-soft">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Proyecto
                </label>
                <input
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background"
                  placeholder="Ej: Portada de libro, Personaje para videojuego, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mensaje
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background resize-none"
                  placeholder="Cuéntame sobre tu proyecto, estilo preferido, presupuesto, etc."
                />
              </div>

              <Button
                type="submit"
                disabled={formStatus === 'sending'}
                className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg py-3 disabled:opacity-60"
              >
                {formStatus === 'sending' ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
              {formStatus === 'sent' && (
                <p className="text-center text-sm text-green-600 dark:text-green-400">
                  ¡Mensaje enviado! Te responderé pronto.
                </p>
              )}
              {formStatus === 'error' && (
                <p className="text-center text-sm text-red-500">
                  Hubo un error al enviar. Intenta de nuevo.
                </p>
              )}
            </form>

            {/* Redes Sociales */}
            <div className="mt-12 text-center space-y-6">
              <p className="text-muted-foreground">
                O conecta conmigo en redes sociales
              </p>
              <div className="flex justify-center gap-6">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary hover:bg-accent hover:text-white transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary hover:bg-accent hover:text-white transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="mailto:mery@example.com"
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary hover:bg-accent hover:text-white transition-all duration-300"
                  aria-label="Email"
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PIE DE PÁGINA */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container">
          <div className="text-center space-y-4">
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
        </div>
      </footer>

      {/* LIGHTBOX */}
      {selectedImage && (
        <Lightbox
          isOpen={lightboxOpen}
          image={selectedImage.image}
          title={selectedImage.title}
          category={selectedImage.category}
          description={selectedImage.description}
          extraImages={selectedImage.extraImages}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
