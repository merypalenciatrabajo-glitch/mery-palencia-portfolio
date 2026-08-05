import { Link } from 'wouter';

export default function PortfolioFooter() {
  return (
    <footer className="portfolio-footer" data-portfolio-footer>
      <div className="container">
        <div className="portfolio-footer__main">
          <div className="portfolio-footer__brand">
            <Link to="/" aria-label="Mery Palencia, ir al inicio">
              <img src="/logo/logo.svg" alt="Mery Palencia" />
            </Link>
            <p>Ilustración digital, diseño de personajes y arte conceptual con una mirada propia.</p>
          </div>

          <nav className="portfolio-footer__nav" aria-label="Enlaces del pie de página">
            <div>
              <p>Explorar</p>
              <Link to="/">Inicio</Link>
              <Link to="/galeria">Galería</Link>
              <Link to="/blog">Blog</Link>
            </div>
            <div>
              <p>Información</p>
              <a href="/#contact-section">Contacto</a>
              <Link to="/terminos">Términos</Link>
              <Link to="/privacidad">Privacidad</Link>
            </div>
          </nav>
        </div>

        <div className="portfolio-footer__bottom">
          <p>© {new Date().getFullYear()} Mery Palencia.</p>
          <p>Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
