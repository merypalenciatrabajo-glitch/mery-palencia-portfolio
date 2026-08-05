import { Facebook, Instagram, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CONTACT_EMAIL } from '@/lib/publicContactConfig';

function safePublicUrl(value: string | undefined): string {
  try {
    const url = new URL(value?.trim() ?? '');
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

const socialLinks = [
  {
    label: 'Correo',
    href: `mailto:${CONTACT_EMAIL}`,
    icon: Mail,
    external: false,
  },
  {
    label: 'Instagram',
    href: safePublicUrl(import.meta.env.VITE_INSTAGRAM_URL),
    icon: Instagram,
    external: true,
  },
  {
    label: 'Facebook',
    href: safePublicUrl(import.meta.env.VITE_FACEBOOK_URL),
    icon: Facebook,
    external: true,
  },
];

export default function SocialRail() {
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    let intersectionObserver: IntersectionObserver | undefined;

    const observeFooter = () => {
      const footer = document.querySelector('[data-portfolio-footer]');
      if (!footer) return false;

      intersectionObserver = new IntersectionObserver(
        ([entry]) => setFooterVisible(entry.isIntersecting),
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

  return (
    <aside
      className={`portfolio-social-rail ${footerVisible ? 'portfolio-social-rail--hidden' : ''}`}
      aria-label="Contacto y redes sociales"
      aria-hidden={footerVisible}
      inert={footerVisible || undefined}
    >
      {socialLinks.map(({ label, href, icon: Icon, external }) =>
        href ? (
          <a
            key={label}
            href={href}
            className="portfolio-social-rail__link"
            aria-label={label}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
          >
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
          </a>
        ) : (
          <span
            key={label}
            className="portfolio-social-rail__link portfolio-social-rail__link--disabled"
            aria-label={`${label}, pendiente de configurar`}
            aria-disabled="true"
          >
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
          </span>
        ),
      )}
    </aside>
  );
}
