import { Camera, Instagram, Mail, WandSparkles } from 'lucide-react';
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

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.99c-.002 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0 0 12.055 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.558 0 11.893-5.335 11.896-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

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
        <WhatsAppIcon size={18} />
      </a>
    </aside>
  );
}
