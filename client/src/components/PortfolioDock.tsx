import { BookOpen, Home, Images, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home, matches: (path: string) => path === '/' },
  { to: '/galeria', label: 'Galería', icon: Images, matches: (path: string) => path === '/galeria' },
  { to: '/blog', label: 'Blog', icon: BookOpen, matches: (path: string) => path.startsWith('/blog') },
];

const itemClass =
  'group flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-medium outline-none transition-[color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-secondary/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0';

export default function PortfolioDock() {
  const [location] = useLocation();
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('[data-portfolio-footer]');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.08 },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [location]);

  return (
    <header
      className={`portfolio-dock fixed left-1/2 z-40 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-[1.65rem] border border-border/80 p-1.5 transition-[opacity,transform] duration-300 ${
        footerVisible ? 'pointer-events-none translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      aria-hidden={footerVisible}
      inert={footerVisible || undefined}
    >
      <div className="portfolio-dock__content flex items-center gap-1 overflow-x-auto rounded-[1.25rem] px-1 py-0.5">
        <Link
          to="/"
          aria-label="Mery Palencia, ir al inicio"
          className="hidden h-11 shrink-0 items-center px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
        >
          <img src="/logo/logo.svg" alt="Mery Palencia" className="h-8 w-auto max-w-[9.5rem] object-contain" />
        </Link>

        <span className="mx-1 hidden h-7 w-px shrink-0 bg-border sm:block" aria-hidden="true" />

        <nav className="flex items-center gap-1" aria-label="Navegación principal">
          {navItems.map(({ to, label, icon: Icon, matches }) => {
            const active = matches(location);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`${itemClass} ${
                  active
                    ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_24%,transparent)]'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <span className="mx-1 h-7 w-px shrink-0 bg-border" aria-hidden="true" />

        <a href="/#contact-section" className={`${itemClass} text-muted-foreground`} aria-label="Contactar">
          <Mail size={19} strokeWidth={1.8} aria-hidden="true" />
          <span className="hidden lg:inline">Contactar</span>
        </a>
      </div>
    </header>
  );
}
