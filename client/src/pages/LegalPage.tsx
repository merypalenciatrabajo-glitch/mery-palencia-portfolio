import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import PortfolioDock from '@/components/PortfolioDock';
import PortfolioFooter from '@/components/PortfolioFooter';
import Seo from '@/components/Seo';

type LegalKind = 'terms' | 'privacy';

const content = {
  terms: {
    eyebrow: 'Información legal',
    title: 'Términos y condiciones',
    description: 'Condiciones generales de uso del portafolio de Mery Palencia.',
    path: '/terminos',
    sections: [
      {
        title: 'Uso del sitio',
        body: 'Este sitio presenta el trabajo creativo, los servicios y la información profesional de Mery Palencia. Puedes navegar y compartir enlaces al portafolio para fines personales o informativos, siempre que no alteres su contenido ni atribuyas la obra a otra persona.',
      },
      {
        title: 'Propiedad intelectual',
        body: 'Las ilustraciones, fotografías, textos, identidad visual y demás materiales publicados pertenecen a Mery Palencia o se utilizan con la autorización correspondiente. Su publicación en este sitio no concede permiso para copiarlos, modificarlos, venderlos o reutilizarlos sin autorización escrita.',
      },
      {
        title: 'Comisiones y proyectos',
        body: 'Los precios, tiempos, revisiones, licencias de uso y entregables de cada comisión se confirman por escrito antes de comenzar. En caso de diferencia, prevalecen las condiciones específicas acordadas para ese proyecto.',
      },
      {
        title: 'Enlaces externos',
        body: 'El portafolio puede enlazar a redes sociales o servicios de terceros. Mery Palencia no controla sus políticas, disponibilidad ni contenido.',
      },
    ],
  },
  privacy: {
    eyebrow: 'Protección de datos',
    title: 'Política de privacidad',
    description: 'Cómo se utilizan los datos enviados desde el formulario de contacto.',
    path: '/privacidad',
    sections: [
      {
        title: 'Datos que recibimos',
        body: 'Cuando envías una solicitud se reciben el nombre, correo electrónico, tipo de proyecto y mensaje que proporcionas voluntariamente.',
      },
      {
        title: 'Finalidad',
        body: 'Esta información se utiliza únicamente para responder tu consulta, evaluar el proyecto solicitado y mantener la comunicación relacionada con ese encargo. No se vende ni se utiliza para publicidad ajena.',
      },
      {
        title: 'Servicio de correo',
        body: 'El formulario utiliza EmailJS para entregar el mensaje al correo profesional de Mery Palencia. El tratamiento técnico del envío también está sujeto a las condiciones y políticas de ese proveedor.',
      },
      {
        title: 'Conservación y contacto',
        body: 'Los mensajes se conservan durante el tiempo necesario para atender la solicitud y gestionar la relación profesional. Puedes solicitar información, corrección o eliminación escribiendo al correo de contacto publicado en este sitio.',
      },
    ],
  },
} satisfies Record<LegalKind, {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
  sections: Array<{ title: string; body: string }>;
}>;

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const page = content[kind];

  return (
    <div className="portfolio-page portfolio-page-enter min-h-screen bg-background text-foreground">
      <Seo title={page.title} description={page.description} path={page.path} />
      <PortfolioDock />

      <main id="main-content" className="container py-20 pb-16 md:py-28">
        <div className="mx-auto max-w-4xl">
          <Link to="/" className="portfolio-legal-back">
            <ArrowLeft size={17} aria-hidden="true" />
            Volver al portafolio
          </Link>

          <header className="mb-12 border-b border-border/70 pb-10">
            <p className="portfolio-eyebrow mb-4">{page.eyebrow}</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{page.description}</p>
            <p className="mt-6 text-xs uppercase tracking-[0.16em] text-muted-foreground">Actualizado el 5 de agosto de 2026</p>
          </header>

          <div className="portfolio-legal-content">
            {page.sections.map((section, index) => (
              <section key={section.title} className="portfolio-legal-section">
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <PortfolioFooter />
    </div>
  );
}
