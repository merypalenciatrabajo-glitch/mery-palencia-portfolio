import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { ArrowRight, ChevronLeft, ChevronRight, Check, Info, Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Lightbox from '@/components/Lightbox';
import { useGallery, useCommissions, useProcessSteps } from '@/hooks/useFirestore';
import Seo from '@/components/Seo';
import ContentStatus from '@/components/ContentStatus';
import { contactFormSchema, firstContactError, sendContactMessage } from '@/lib/contact';
import { cloudinaryImage, cloudinarySrcSet } from '@/lib/images';
import PortfolioDock from '@/components/PortfolioDock';
import PortfolioFooter from '@/components/PortfolioFooter';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';

const EMAILJS_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
/**
 * DISEÑO MINIMALISTA CONTEMPORÁNEO
 * - Tipografía contemporánea y jerarquía editorial clara
 * - Paleta oscura con acentos turquesa
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
  const interactionPausedRef = useRef(false);
  const userPausedRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const SPEED = 26; // píxeles por segundo
  const CARD_WIDTH = 260;
  const GAP = 24;
  const STEP = CARD_WIDTH + GAP;

  // We render 3 copies so there's always content on both sides
  const repeated = [...items, ...items, ...items];

  useEffect(() => {
    if (items.length === 0) return;
    const totalWidth = items.length * STEP;
    let previousTime = performance.now();

    const animate = (time: number) => {
      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;

      if (!interactionPausedRef.current && !userPausedRef.current) {
        offsetRef.current += SPEED * (elapsed / 1000);
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
    interactionPausedRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;

    // Only hijack horizontal swipes
    if (!isDraggingRef.current && Math.abs(deltaX) < Math.abs(deltaY)) {
      interactionPausedRef.current = false;
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
    interactionPausedRef.current = false;
  };

  const togglePlayback = () => {
    const nextPaused = !userPausedRef.current;
    userPausedRef.current = nextPaused;
    setIsPaused(nextPaused);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center sm:justify-end">
        <button
          type="button"
          onClick={togglePlayback}
          className="portfolio-button portfolio-button--secondary min-h-11 border-primary/25 px-5 text-sm text-primary"
          aria-label={isPaused ? 'Reanudar carrusel' : 'Pausar carrusel'}
          aria-pressed={isPaused}
        >
          {isPaused ? <Play size={17} /> : <Pause size={17} />}
          <span>{isPaused ? 'Reproducir carrusel' : 'Pausar carrusel'}</span>
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => step(-1)}
          className="portfolio-button portfolio-button--icon portfolio-button--secondary absolute left-1 top-[44%] z-10 -translate-y-1/2 sm:left-0 sm:-translate-x-4"
          aria-label="Anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => step(1)}
          className="portfolio-button portfolio-button--icon portfolio-button--secondary absolute right-1 top-[44%] z-10 -translate-y-1/2 sm:right-0 sm:translate-x-4"
          aria-label="Siguiente"
        >
          <ChevronRight size={20} />
        </button>

        <div className="carousel-viewport overflow-hidden">
        <div
          ref={trackRef}
          className="flex"
          style={{ gap: `${GAP}px`, willChange: 'transform' }}
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
              onFocus={() => (interactionPausedRef.current = true)}
              onBlur={() => (interactionPausedRef.current = false)}
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
              <h3 className="mt-4 truncate text-[0.95rem] font-medium leading-snug tracking-[-0.015em] text-foreground/78 transition-colors group-hover:text-foreground">
                {item.title}
              </h3>
            </button>
          ))}
        </div>
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
    <div className="portfolio-page portfolio-page-enter min-h-screen">
      <Seo
        title="Mery Palencia"
        description="Portafolio de Mery Palencia: ilustración digital, diseño de personajes, arte conceptual y comisiones personalizadas."
      />
      {/* HEADER CON BOTÓN DE TEMA */}
      <PortfolioDock />

      <main id="main-content">
      {/* HERO SECTION */}
      <section className="portfolio-hero portfolio-hero-frame relative overflow-hidden bg-black" aria-labelledby="home-title">
        <AnimatedHeroBackground />
        {/* Gradiente inferior para proteger los botones de la luz */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', zIndex: 2 }}
        />
        {/* Contenido del hero — parte superior de la pantalla */}
        <div className="portfolio-hero-frame relative flex flex-col items-center justify-start py-10 sm:py-12 md:py-14 container" style={{ zIndex: 3 }}>
          <div className="max-w-3xl w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 id="home-title" className="sr-only">Mery Palencia, ilustradora digital</h1>
            <p className="portfolio-eyebrow">
              Ilustración Digital
            </p>
            <div className="flex justify-center">
              <div className="hero-logo" aria-hidden="true">
                <img src="/logo/logo.svg" alt="" className="hero-logo__sheet" />
              </div>
            </div>
            <p className="text-lg text-foreground/70 leading-relaxed max-w-lg mx-auto">
              Transformo ideas en ilustraciones cautivadoras. Cada proyecto es una oportunidad para crear algo único y memorable que refleje tu visión.
            </p>
            <div className="flex w-full justify-center pt-2">
              <Button
                size="lg"
                className="portfolio-button--primary"
                onClick={() => document.getElementById('commission-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Comisiones
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍA SECTION */}
      <section className="portfolio-section bg-background">
        <div className="container">
          <div className="portfolio-section-heading space-y-4 text-center">
            <p className="portfolio-eyebrow">
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

          <div className="mt-10 text-center">
            <Link
              to="/galeria"
              className="portfolio-button portfolio-button--secondary"
            >
              Ver galería completa
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESO SECTION */}
      <section className="portfolio-section border-y border-border/60 bg-card/20 backdrop-blur-sm">
        <div className="container">
          <div className="portfolio-section-heading space-y-4 text-center">
            <p className="portfolio-eyebrow">
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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5" role="status" aria-label="Cargando proceso creativo">
              {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-[1.5rem] bg-muted" />)}
            </div>
          ) : process.error ? (
            <ContentStatus kind="error" title="No pudimos cargar el proceso creativo" description="Comprueba tu conexión e inténtalo nuevamente." onRetry={process.retry} />
          ) : processSteps.length === 0 ? (
            <ContentStatus kind="empty" title="Proceso creativo en preparación" description="Esta sección se publicará cuando estén definidos todos los pasos." />
          ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
            {processSteps.map((step, index) => (
              <div
                key={step.number}
                className="portfolio-process-card group animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="portfolio-process-number">{String(step.number).padStart(2, '0')}</span>
                  <span className="h-px w-10 bg-primary/30 transition-all duration-300 group-hover:w-14 group-hover:bg-primary/70" aria-hidden="true" />
                </div>
                <h3 className="mt-8 text-xl font-display text-foreground">{step.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-7 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* COMISIONES SECTION */}
      <section id="commission-section" className="portfolio-section bg-background">
        <div className="container">
          <div className="portfolio-section-heading space-y-4 text-center">
            <p className="portfolio-eyebrow">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {commissionTiers.map((tier, index) => (
              <div
                key={tier.id}
                className={`portfolio-commission-card animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                  tier.featured
                    ? 'portfolio-commission-card--featured'
                    : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex min-h-8 items-start justify-between gap-4">
                  <h3 className="text-2xl font-display text-foreground">{tier.name}</h3>
                  {tier.featured && <span className="portfolio-tag shrink-0">Recomendado</span>}
                </div>
                <p className="mt-5 text-[1.65rem] font-display font-semibold leading-tight tracking-[-0.03em] text-primary">{tier.price}</p>
                <p className="mt-4 min-h-[4.5rem] leading-7 text-muted-foreground">{tier.description}</p>

                <div className="mb-8 mt-7 flex-1 space-y-4 border-t border-border/60 pt-6">
                  {tier.includes.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="mt-0.5 shrink-0 text-primary" size={18} strokeWidth={2} aria-hidden="true" />
                      <span className="leading-6 text-foreground/90">{item}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  variant={tier.featured ? 'default' : 'outline'}
                  className="w-full"
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
      <section id="contact-section" className="portfolio-section border-y border-border/60 bg-card/20 pb-36 backdrop-blur-sm md:pb-40">
        <div className="container">
            <div className="mx-auto max-w-3xl">
            <div className="portfolio-section-heading space-y-4 text-center">
              <p className="portfolio-eyebrow">
                Ponte en Contacto
              </p>
              <h2 className="text-4xl md:text-5xl font-display text-foreground">
                Solicita una Comisión
              </h2>
              <p className="text-lg text-muted-foreground">
                Cuéntame sobre tu proyecto y te responderé en 24-48 horas.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} noValidate aria-busy={formStatus === 'sending'} className="portfolio-contact-form space-y-6 rounded-[1.75rem] p-6 sm:p-8 md:p-10">
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
                    className="portfolio-field"
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
                    className="portfolio-field"
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
                  className="portfolio-field"
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
                  className="portfolio-field min-h-36 resize-none"
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
                className="w-full portfolio-button--primary disabled:opacity-60"
              >
                {formStatus === 'sending' ? (
                  <><Loader2 className="mr-2 animate-spin" size={18} aria-hidden="true" /> Enviando…</>
                ) : contactConfigured ? 'Enviar Solicitud' : 'Envío no disponible'}
              </Button>
              <div aria-live="polite" aria-atomic="true">
                {!contactConfigured && formStatus === 'idle' && (
                  <p className="portfolio-form-notice"><Info size={17} aria-hidden="true" />El formulario estará disponible cuando se configure el servicio de correo.</p>
                )}
                {formFeedback && (
                  <p className={`text-center text-sm ${formStatus === 'sent' ? 'text-green-400' : formStatus === 'sending' ? 'text-muted-foreground' : 'text-red-400'}`}>
                    {formFeedback}
                  </p>
                )}
              </div>
            </form>

          </div>
        </div>
      </section>

      </main>

      <PortfolioFooter />

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
