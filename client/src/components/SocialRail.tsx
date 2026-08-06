import { Camera, Instagram, Mail, MessageCircleMore, WandSparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CONTACT_EMAIL } from '@/lib/publicContactConfig';

function safePublicUrl(value: string | undefined): string {
  try {
    const url = new URL(value?.trim() ?? '');
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

const instagramProfiles = [
  {
    label: 'Mery Photo Art',
    description: 'Fotografía y arte',
    href: safePublicUrl(import.meta.env.VITE_INSTAGRAM_PHOTO_URL)
      || 'https://www.instagram.com/meryphotoart?igsh=bm5ocjN5aGJmaXRt',
    icon: Camera,
  },
  {
    label: 'Edición MP',
    description: 'Edición y procesos',
    href: safePublicUrl(import.meta.env.VITE_INSTAGRAM_EDITING_URL)
      || 'https://www.instagram.com/edicion_mp?igsh=bnNsZGFvc3FvcGc0',
    icon: WandSparkles,
  },
];

const whatsappUrl = safePublicUrl(import.meta.env.VITE_WHATSAPP_URL)
  || 'https://wa.me/573164757898';

export default function SocialRail() {
  const [footerVisible, setFooterVisible] = useState(false);
  const [instagramOpen, setInstagramOpen] = useState(false);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let intersectionObserver: IntersectionObserver | undefined;

    const observeFooter = () => {
      const footer = document.querySelector('[data-portfolio-footer]');
      if (!footer) return false;

      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          setFooterVisible(entry.isIntersecting);
          if (entry.isIntersecting) setInstagramOpen(false);
        },
        { threshold: 0.08 },
      );
      intersectionObserver.observe(footer);
      return true;
    };

    const mutationObserver = new MutationObserver(() => {
      if (observeFooter()) mutationObserver.disconnect();
    });

    if (!observeFooter()) {
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!instagramOpen) return undefined;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !railRef.current?.contains(event.target)) {
        setInstagramOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInstagramOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [instagramOpen]);

  return (
    <aside
      ref={railRef}
      className={`portfolio-social-rail ${footerVisible ? 'portfolio-social-rail--hidden' : ''}`}
      aria-label="Contacto y redes sociales"
      aria-hidden={footerVisible}
      inert={footerVisible || undefined}
    >
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="portfolio-social-rail__link"
        aria-label="Enviar correo"
      >
        <Mail size={17} strokeWidth={1.8} aria-hidden="true" />
      </a>

      <div className="portfolio-social-rail__instagram">
        <button
          type="button"
          className={`portfolio-social-rail__link ${instagramOpen ? 'portfolio-social-rail__link--active' : ''}`}
          aria-label="Ver perfiles de Instagram"
          aria-expanded={instagramOpen}
          aria-controls="portfolio-instagram-profiles"
          onClick={() => setInstagramOpen((current) => !current)}
        >
          <Instagram size={17} strokeWidth={1.8} aria-hidden="true" />
        </button>

        {instagramOpen && (
          <div
            id="portfolio-instagram-profiles"
            className="portfolio-social-rail__profiles"
            aria-label="Perfiles de Instagram"
          >
            <p className="portfolio-social-rail__profiles-title">Instagram</p>
            {instagramProfiles.map(({ label, description, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="portfolio-social-rail__profile"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setInstagramOpen(false)}
              >
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      <a
        href={whatsappUrl}
        className="portfolio-social-rail__link"
        aria-label="Contactar por WhatsApp"
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircleMore size={18} strokeWidth={1.8} aria-hidden="true" />
      </a>
    </aside>
  );
}
