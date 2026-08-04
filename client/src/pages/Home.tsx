import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Mail, Instagram, Linkedin, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Lightbox from '@/components/Lightbox';
import { useGallery, useCommissions, useProcessSteps } from '@/hooks/useFirestore';
import Seo from '@/components/Seo';
import ContentStatus from '@/components/ContentStatus';
import { contactFormSchema, firstContactError, sendContactMessage } from '@/lib/contact';
import { cloudinaryImage, cloudinarySrcSet } from '@/lib/images';

const EMAILJS_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const CONTACT_EMAIL = /^\S+@\S+\.\S+$/.test(import.meta.env.VITE_CONTACT_EMAIL?.trim() ?? '')
  ? import.meta.env.VITE_CONTACT_EMAIL.trim()
  : '';

function safePublicUrl(value: string | undefined): string {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

const INSTAGRAM_URL = safePublicUrl(import.meta.env.VITE_INSTAGRAM_URL);
const LINKEDIN_URL = safePublicUrl(import.meta.env.VITE_LINKEDIN_URL);

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
        className="absolute left-1 sm:left-0 top-[45%] -translate-y-1/2 sm:-translate-x-4 z-10 w-11 h-11 rounded-full bg-card shadow-soft border border-border flex items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300"
        aria-label="Anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => step(1)}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        className="absolute right-1 sm:right-0 top-[45%] -translate-y-1/2 sm:translate-x-4 z-10 w-11 h-11 rounded-full bg-card shadow-soft border border-border flex items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300"
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
            <button
              type="button"
              key={`${item.id}-${index}`}
              className="group flex-none text-left"
              style={{ width: `${CARD_WIDTH}px` }}
              onClick={() => onItemClick(item)}
              onFocus={() => (pausedRef.current = true)}
              onBlur={() => (pausedRef.current = false)}
              tabIndex={index < items.length ? 0 : -1}
              aria-hidden={index >= items.length}
              aria-label={`Ver ${item.title}`}
            >
              <div className="relative overflow-hidden rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <img
                  src={cloudinaryImage(item.image, { width: 520 })}
                  srcSet={cloudinarySrcSet(item.image, [320, 520, 780])}
                  sizes="260px"
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const gallery = useGallery();
  const commissions = useCommissions();
  const process = useProcessSteps();
  const galleryItems = gallery.data;
  const commissionTiers = commissions.data;
  const processSteps = process.data;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ id: string; title: string; image: string; category?: string; description?: string; extraImages?: { url: string; publicId: string }[] } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project: '',
    message: '',
    website: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'unavailable'>('idle');
  const [formFeedback, setFormFeedback] = useState('');
  const contactConfigured = Boolean(EMAILJS_SERVICE && EMAILJS_TEMPLATE && EMAILJS_PUBLIC_KEY);

  const openLightbox = (item: { id: string; title: string; image: string; category?: string; description?: string; extraImages?: { url: string; publicId: string }[] }) => {
    setSelectedImage(item);
    setLightboxOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formStatus !== 'idle' && formStatus !== 'sending') {
      setFormStatus('idle');
      setFormFeedback('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = contactFormSchema.safeParse(formData);
    if (!validation.success) {
      setFormStatus('error');
      setFormFeedback(firstContactError(validation.error));
      return;
    }
    if (validation.data.website) {
      setFormStatus('sent');
      return;
    }
    if (!contactConfigured) {
      setFormStatus('unavailable');
      setFormFeedback('El formulario aún no tiene configurado su servicio de correo.');
      return;
    }

    setFormStatus('sending');
    setFormFeedback('Enviando tu solicitud…');
    try {
      await sendContactMessage(validation.data, {
        serviceId: EMAILJS_SERVICE,
        templateId: EMAILJS_TEMPLATE,
        publicKey: EMAILJS_PUBLIC_KEY,
      });
      setFormStatus('sent');
      setFormFeedback('¡Mensaje enviado! Te responderé pronto.');
      setFormData({ name: '', email: '', project: '', message: '', website: '' });
    } catch {
      setFormStatus('error');
      setFormFeedback('No pudimos enviar el mensaje. Revisa tu conexión e inténtalo nuevamente.');
    }
  };

  return (
    <div className="min-h-screen">
      <Seo
        title="Mery Palencia"
        description="Portafolio de Mery Palencia: ilustración digital, diseño de personajes, arte conceptual y comisiones personalizadas."
      />
      {/* HEADER CON BOTÓN DE TEMA */}
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur-sm z-40">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex min-h-11 min-w-11 items-center" aria-label="Ir al inicio">
            <img src="/logo/logo.svg" alt="" aria-hidden="true" className="w-auto" style={{ height: '44px' }} />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navegación principal">
            <Link to="/blog" className="inline-flex min-h-11 items-center px-2 text-foreground hover:text-accent transition-colors font-medium">
              Blog
            </Link>
            <Link to="/galeria" className="inline-flex min-h-11 items-center px-2 text-foreground hover:text-accent transition-colors font-medium">
              Galería
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
      {/* HERO SECTION */}
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-black" aria-labelledby="home-title">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{ backgroundImage: "url('/hero/illustration-background.webp')", zIndex: 1 }}
          aria-hidden="true"
        />
        {/* Gradiente inferior para proteger los botones de la luz */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', zIndex: 2 }}
        />
        {/* Contenido del hero — parte superior de la pantalla */}
        <div className="relative min-h-[calc(100svh-4rem)] flex flex-col items-center justify-start py-12 sm:py-16 md:py-20 container" style={{ zIndex: 3 }}>
          <div className="max-w-3xl w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 id="home-title" className="sr-only">Mery Palencia, ilustradora digital</h1>
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              Ilustración Digital
            </p>
            <div className="flex justify-center">
              <img src="/logo/logo.svg" alt="" aria-hidden="true" className="w-full max-w-[700px] max-h-[220px] sm:max-h-[280px] mx-auto" />
            </div>
            <p className="text-lg text-foreground/70 leading-relaxed max-w-lg mx-auto">
              Transformo ideas en ilustraciones cautivadoras. Cada proyecto es una oportunidad para crear algo único y memorable que refleje tu visión.
            </p>
            <div className="grid w-full grid-cols-2 gap-3 pt-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
              <Button
                size="lg"
                className="min-h-11 w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg sm:w-auto"
                onClick={() => document.getElementById('commission-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Comisiones
                <ArrowRight className="ml-2" size={20} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 w-full border-accent text-foreground hover:bg-accent/10 rounded-lg sm:w-auto"
                onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Contactar
              </Button>
              <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-11 w-full border-accent text-foreground hover:bg-accent/10 rounded-lg sm:w-auto"
                >
                <Link to="/blog">
                  Leer Blog
                </Link>
              </Button>
              <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-11 w-full border-accent text-foreground hover:bg-accent/10 rounded-lg sm:w-auto"
                >
                <Link to="/galeria">
                  Ver Galería
                </Link>
              </Button>
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

          {gallery.loading ? (
            <div className="flex gap-6 overflow-hidden" role="status" aria-label="Cargando trabajos destacados">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="w-[260px] flex-none">
                  <div className="aspect-square animate-pulse rounded-xl bg-muted" />
                  <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : gallery.error ? (
            <ContentStatus kind="error" title="No pudimos cargar los trabajos" description="Comprueba tu conexión e inténtalo nuevamente." onRetry={gallery.retry} />
          ) : galleryItems.length === 0 ? (
            <ContentStatus kind="empty" title="Aún no hay trabajos destacados" description="Las obras destacadas aparecerán aquí cuando sean publicadas." />
          ) : (
            <InfiniteCarousel items={galleryItems} onItemClick={openLightbox} />
          )}

          <div className="text-center mt-12">
            <Link
              to="/galeria"
              className="inline-flex min-h-11 items-center gap-2 px-6 py-3 border border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-lg font-medium transition-colors duration-300"
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

          {process.loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Cargando proceso creativo">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : process.error ? (
            <ContentStatus kind="error" title="No pudimos cargar el proceso creativo" description="Comprueba tu conexión e inténtalo nuevamente." onRetry={process.retry} />
          ) : processSteps.length === 0 ? (
            <ContentStatus kind="empty" title="Proceso creativo en preparación" description="Esta sección se publicará cuando estén definidos todos los pasos." />
          ) : (
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
          )}
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

          {commissions.loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3" role="status" aria-label="Cargando niveles de comisiones">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-96 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : commissions.error ? (
            <ContentStatus kind="error" title="No pudimos cargar las comisiones" description="Comprueba tu conexión e inténtalo nuevamente." onRetry={commissions.retry} />
          ) : commissionTiers.length === 0 ? (
            <ContentStatus kind="empty" title="Comisiones no disponibles por el momento" description="Vuelve más adelante para consultar nuevas opciones." />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {commissionTiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                  tier.featured
                    ? 'bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent shadow-soft-lg md:scale-105'
                    : 'bg-transparent border-2 border-accent hover:bg-accent/5'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {tier.featured && (
                  <div className="inline-block px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full mb-4">
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
          )}
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

            <form onSubmit={handleFormSubmit} noValidate aria-busy={formStatus === 'sending'} className="space-y-6 bg-muted p-5 sm:p-8 rounded-xl shadow-soft">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-2">
                    Nombre
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    minLength={2}
                    maxLength={80}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    maxLength={160}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-project" className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Proyecto
                </label>
                <input
                  id="contact-project"
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleFormChange}
                  required
                  minLength={3}
                  maxLength={120}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background"
                  placeholder="Ej: Portada de libro, Personaje para videojuego, etc."
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-2">
                  Mensaje
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={5}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background resize-none"
                  placeholder="Cuéntame sobre tu proyecto, estilo preferido, presupuesto, etc."
                />
              </div>

              <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="contact-website">Sitio web</label>
                <input
                  id="contact-website"
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleFormChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <Button
                type="submit"
                disabled={formStatus === 'sending' || !contactConfigured}
                className="w-full min-h-11 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-3 disabled:opacity-60"
              >
                {formStatus === 'sending' ? (
                  <><Loader2 className="mr-2 animate-spin" size={18} aria-hidden="true" /> Enviando…</>
                ) : 'Enviar Solicitud'}
              </Button>
              <div aria-live="polite" aria-atomic="true">
                {!contactConfigured && formStatus === 'idle' && (
                  <p className="text-center text-sm text-amber-300">El formulario estará disponible cuando se configure el servicio de correo.</p>
                )}
                {formFeedback && (
                  <p className={`text-center text-sm ${formStatus === 'sent' ? 'text-green-400' : formStatus === 'sending' ? 'text-muted-foreground' : 'text-red-400'}`}>
                    {formFeedback}
                  </p>
                )}
              </div>
            </form>

            {/* Redes Sociales */}
            {(INSTAGRAM_URL || LINKEDIN_URL || CONTACT_EMAIL) && (
            <div className="mt-12 text-center space-y-6">
              <p className="text-muted-foreground">
                O conecta conmigo en redes sociales
              </p>
              <div className="flex justify-center gap-6">
                {INSTAGRAM_URL && <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>}
                {LINKEDIN_URL && <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>}
                {CONTACT_EMAIL && <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                  aria-label="Email"
                >
                  <Mail size={20} />
                </a>}
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      </main>

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
              © {new Date().getFullYear()} Mery Palencia. Todos los derechos reservados.
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
