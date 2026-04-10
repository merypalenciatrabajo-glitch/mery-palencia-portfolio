import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Mail, Instagram, Linkedin, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Lightbox from '@/components/Lightbox';
import { useGallery, useCommissions, useProcessSteps, useHeroImage } from '@/hooks/useFirestore';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE = 'service_portfolio';
const EMAILJS_TEMPLATE = 'template_b80smad';
const EMAILJS_PUBLIC_KEY = 'ZLrXjIYd_3R2ZklPB';

const C = {
  dark: '#062126',
  teal: '#52D5C1',
  white: '#FCFCFC',
  mint: '#80FAE3',
};

type GalleryItem = { id: string; title: string; image: string; category?: string; description?: string; extraImages?: { url: string; publicId: string }[] };

function InfiniteCarousel({ items, onItemClick }: { items: GalleryItem[]; onItemClick: (item: GalleryItem) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const SPEED = 0.5;
  const CARD_WIDTH = 260;
  const GAP = 24;
  const STEP = CARD_WIDTH + GAP;
  const repeated = [...items, ...items, ...items];

  useEffect(() => {
    if (items.length === 0) return;
    const totalWidth = items.length * STEP;
    const animate = () => {
      if (!pausedRef.current) {
        offsetRef.current += SPEED;
        if (offsetRef.current >= totalWidth) offsetRef.current -= totalWidth;
        if (trackRef.current) trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
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
      setTimeout(() => { if (trackRef.current) trackRef.current.style.transition = ''; }, 400);
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
    if (!isDraggingRef.current && Math.abs(deltaX) < Math.abs(deltaY)) { pausedRef.current = false; return; }
    isDraggingRef.current = true;
    e.preventDefault();
    const totalWidth = items.length * STEP;
    let newOffset = offsetRef.current - deltaX;
    if (newOffset < 0) newOffset += totalWidth;
    if (newOffset >= totalWidth * 2) newOffset -= totalWidth;
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${newOffset}px)`;
    offsetRef.current = newOffset;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => { isDraggingRef.current = false; pausedRef.current = false; };

  return (
    <div className="relative">
      <button onClick={() => step(-1)} onMouseEnter={() => (pausedRef.current = true)} onMouseLeave={() => (pausedRef.current = false)}
        className="absolute left-0 top-[45%] -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full shadow-soft border flex items-center justify-center transition-all duration-300"
        style={{backgroundColor: C.white, borderColor: `${C.teal}40`, color: C.dark}}
        aria-label="Anterior"><ChevronLeft size={20} /></button>
      <button onClick={() => step(1)} onMouseEnter={() => (pausedRef.current = true)} onMouseLeave={() => (pausedRef.current = false)}
        className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full shadow-soft border flex items-center justify-center transition-all duration-300"
        style={{backgroundColor: C.white, borderColor: `${C.teal}40`, color: C.dark}}
        aria-label="Siguiente"><ChevronRight size={20} /></button>
      <div className="overflow-hidden">
        <div ref={trackRef} className="flex" style={{ gap: `${GAP}px`, willChange: 'transform' }}
          onMouseEnter={() => (pausedRef.current = true)} onMouseLeave={() => (pausedRef.current = false)}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          {repeated.map((item, index) => (
            <div key={`${item.id}-${index}`} className="group cursor-pointer flex-none" style={{ width: `${CARD_WIDTH}px` }} onClick={() => onItemClick(item)}>
              <div className="relative overflow-hidden rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300">
                <img src={item.image} alt={item.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">Ver Detalle</span>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-display transition-colors truncate" style={{color: C.dark}}>{item.title}</h3>
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
  const { imageUrl: heroImageUrl, position: heroPosition, loading: heroLoading } = useHeroImage();
  const FALLBACK_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663465006084/aYyNo4PkGRweszF78jfNEU/hero-illustration-h59MrgKS7TnNgq7RSR34Vn.webp";

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', project: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const openLightbox = (item: GalleryItem) => { setSelectedImage(item); setLightboxOpen(true); };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        from_name: formData.name, from_email: formData.email,
        project: formData.project, message: formData.message,
      }, EMAILJS_PUBLIC_KEY);
      setFormStatus('sent');
      setFormData({ name: '', email: '', project: '', message: '' });
    } catch (err) {
      console.error(err);
      setFormStatus('error');
    }
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: C.dark}}>

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{backgroundColor: `${C.dark}e6`, borderBottom: `1px solid ${C.teal}20`}}>
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display" style={{color: C.white}}>Mery Palencia</h1>
          <div className="flex items-center gap-6">
            <Link to="/blog" className="text-sm font-medium transition-colors" style={{color: `${C.white}99`}}>Blog</Link>
            <Link to="/galeria" className="text-sm font-medium transition-colors" style={{color: `${C.white}99`}}>Galería</Link>
            <Link to="/galeria" className="px-5 py-2 text-sm font-semibold rounded-full transition-colors"
              style={{backgroundColor: C.teal, color: C.dark}}>
              Contactar
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — gradiente radial teal → oscuro */}
      <section className="pt-16 pb-24 md:pt-24 md:pb-36" style={{background: `radial-gradient(ellipse at 65% 50%, ${C.teal}55 0%, ${C.dark} 65%)`}}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="space-y-4">
                <p className="text-xs tracking-widest uppercase font-medium" style={{color: C.teal}}>Ilustración Digital</p>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display leading-tight" style={{color: C.white}}>Mery Palencia</h1>
                <p className="subtitle text-xl md:text-2xl" style={{color: `${C.white}99`}}>
                  Ilustradora digital especializada en arte conceptual y diseño de personajes
                </p>
              </div>
              <p className="text-lg leading-relaxed max-w-md" style={{color: `${C.white}80`}}>
                Transformo ideas en ilustraciones cautivadoras. Cada proyecto es una oportunidad para crear algo único y memorable.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button className="px-6 py-3 rounded-full font-semibold text-sm transition-all"
                  style={{backgroundColor: C.teal, color: C.dark}}
                  onClick={() => document.getElementById('commission-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Ver Comisiones →
                </button>
                <button className="px-6 py-3 rounded-full font-medium text-sm border transition-all"
                  style={{borderColor: `${C.white}50`, color: C.white, backgroundColor: 'transparent'}}
                  onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Contactar
                </button>
                <Link to="/blog">
                  <button className="px-6 py-3 rounded-full font-medium text-sm border transition-all"
                    style={{borderColor: `${C.white}50`, color: C.white, backgroundColor: 'transparent'}}>
                    Blog
                  </button>
                </Link>
              </div>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
              <div className="relative rounded-2xl overflow-hidden aspect-video" style={{boxShadow: `0 25px 60px ${C.dark}80`}}>
                {!heroLoading && (
                  <img src={heroImageUrl ?? FALLBACK_HERO} alt="Mery Palencia"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: heroImageUrl ? `${heroPosition.x}% ${heroPosition.y}%` : 'center' }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍA — fondo teal vibrante */}
      <section className="py-20 md:py-32" style={{backgroundColor: C.teal}}>
        <div className="container">
          <div className="space-y-3 mb-16 text-center">
            <p className="text-xs tracking-widest uppercase font-medium" style={{color: `${C.dark}99`}}>Trabajos Destacados</p>
            <h2 className="text-4xl md:text-5xl font-display" style={{color: C.dark}}>Galería de Arte</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{color: `${C.dark}80`}}>
              Explora una selección de mis trabajos más recientes.
            </p>
          </div>
          <InfiniteCarousel items={galleryItems} onItemClick={openLightbox} />
          <div className="text-center mt-12">
            <Link to="/galeria" className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-all"
              style={{backgroundColor: C.dark, color: C.white}}>
              Ver galería completa <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESO — oscuro */}
      <section className="py-20 md:py-32" style={{backgroundColor: C.dark}}>
        <div className="container">
          <div className="space-y-3 mb-16 text-center">
            <p className="text-xs tracking-widest uppercase font-medium" style={{color: C.teal}}>Mi Método</p>
            <h2 className="text-4xl md:text-5xl font-display" style={{color: C.white}}>Proceso Creativo</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{color: `${C.white}70`}}>
              Desde la idea inicial hasta la obra final, cada paso es cuidadosamente ejecutado.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div key={step.number} className="p-6 rounded-xl space-y-3" style={{backgroundColor: `${C.white}08`, border: `1px solid ${C.teal}20`}}>
                <span className="text-4xl font-display" style={{color: `${C.teal}40`}}>{step.number}</span>
                <h3 className="text-xl font-display" style={{color: C.white}}>{step.title}</h3>
                <p className="leading-relaxed" style={{color: `${C.white}70`}}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMISIONES — oscuro */}
      <section id="commission-section" className="py-20 md:py-32" style={{backgroundColor: C.dark}}>
        <div className="container">
          <div className="space-y-3 mb-16 text-center">
            <p className="text-xs tracking-widest uppercase font-medium" style={{color: C.teal}}>Servicios</p>
            <h2 className="text-4xl md:text-5xl font-display" style={{color: C.white}}>Niveles de Comisiones</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{color: `${C.white}70`}}>
              Opciones flexibles para proyectos de cualquier escala.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {commissionTiers.map((tier, index) => (
              <div key={tier.id} className="rounded-2xl p-8 transition-all duration-300"
                style={{
                  backgroundColor: tier.featured ? `${C.teal}15` : `${C.white}06`,
                  border: `2px solid ${tier.featured ? C.teal : `${C.teal}25`}`,
                  transform: tier.featured ? 'scale(1.05)' : 'scale(1)',
                }}>
                {tier.featured && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4"
                    style={{backgroundColor: C.teal, color: C.dark}}>Más Popular</span>
                )}
                <h3 className="text-2xl font-display mb-2" style={{color: C.white}}>{tier.name}</h3>
                <p className="text-3xl font-display mb-4" style={{color: C.teal}}>{tier.price}</p>
                <p className="mb-6 leading-relaxed text-sm" style={{color: `${C.white}70`}}>{tier.description}</p>
                <div className="space-y-2 mb-8">
                  {tier.includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor: C.teal}} />
                      <span className="text-sm" style={{color: `${C.white}80`}}>{item}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 rounded-full font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: tier.featured ? C.teal : 'transparent',
                    color: tier.featured ? C.dark : C.teal,
                    border: `2px solid ${C.teal}`,
                  }}
                  onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Solicitar Comisión
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO — oscuro */}
      <section id="contact-section" className="py-20 md:py-32" style={{backgroundColor: C.dark}}>
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-3 mb-12 text-center">
              <p className="text-xs tracking-widest uppercase font-medium" style={{color: C.teal}}>Ponte en Contacto</p>
              <h2 className="text-4xl md:text-5xl font-display" style={{color: C.white}}>Solicita una Comisión</h2>
              <p className="text-lg" style={{color: `${C.white}70`}}>Cuéntame sobre tu proyecto y te responderé en 24-48 horas.</p>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-5 p-8 rounded-2xl"
              style={{backgroundColor: `${C.white}08`, border: `1px solid ${C.teal}20`}}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: `${C.white}cc`}}>Nombre</label>
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} required
                    className="w-full px-4 py-3 rounded-lg outline-none transition-all text-sm"
                    style={{backgroundColor: `${C.white}10`, border: `1px solid ${C.teal}30`, color: C.white}}
                    placeholder="Tu nombre" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{color: `${C.white}cc`}}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleFormChange} required
                    className="w-full px-4 py-3 rounded-lg outline-none transition-all text-sm"
                    style={{backgroundColor: `${C.white}10`, border: `1px solid ${C.teal}30`, color: C.white}}
                    placeholder="tu@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: `${C.white}cc`}}>Tipo de Proyecto</label>
                <input type="text" name="project" value={formData.project} onChange={handleFormChange} required
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all text-sm"
                  style={{backgroundColor: `${C.white}10`, border: `1px solid ${C.teal}30`, color: C.white}}
                  placeholder="Ej: Portada de libro, Personaje para videojuego..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: `${C.white}cc`}}>Mensaje</label>
                <textarea name="message" value={formData.message} onChange={handleFormChange} required rows={5}
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all text-sm resize-none"
                  style={{backgroundColor: `${C.white}10`, border: `1px solid ${C.teal}30`, color: C.white}}
                  placeholder="Cuéntame sobre tu proyecto, estilo preferido, presupuesto..." />
              </div>
              <button type="submit" disabled={formStatus === 'sending'}
                className="w-full py-3 rounded-full font-semibold text-sm transition-all disabled:opacity-60"
                style={{backgroundColor: C.teal, color: C.dark}}>
                {formStatus === 'sending' ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
              {formStatus === 'sent' && <p className="text-center text-sm" style={{color: C.mint}}>¡Mensaje enviado! Te responderé pronto.</p>}
              {formStatus === 'error' && <p className="text-center text-sm text-red-400">Hubo un error al enviar. Intenta de nuevo.</p>}
            </form>
            <div className="mt-10 text-center space-y-5">
              <p style={{color: `${C.white}60`}}>O conecta conmigo en redes sociales</p>
              <div className="flex justify-center gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-all"
                  style={{backgroundColor: `${C.white}10`, color: C.white}} aria-label="Instagram">
                  <Instagram size={18} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-all"
                  style={{backgroundColor: `${C.white}10`, color: C.white}} aria-label="LinkedIn">
                  <Linkedin size={18} />
                </a>
                <a href="mailto:mery@example.com"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full transition-all"
                  style={{backgroundColor: `${C.white}10`, color: C.white}} aria-label="Email">
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{backgroundColor: `${C.dark}`, borderTop: `1px solid ${C.teal}20`}} className="py-10">
        <div className="container text-center space-y-3">
          <h3 className="text-xl font-display" style={{color: C.white}}>Mery Palencia</h3>
          <p className="text-sm" style={{color: C.teal}}>Ilustradora Digital · Diseño de Personajes · Arte Conceptual</p>
          <p className="text-xs" style={{color: `${C.white}30`}}>© 2024 Mery Palencia. Todos los derechos reservados.</p>
        </div>
      </footer>

      {selectedImage && (
        <Lightbox isOpen={lightboxOpen} image={selectedImage.image} title={selectedImage.title}
          category={selectedImage.category} description={selectedImage.description}
          extraImages={selectedImage.extraImages} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
