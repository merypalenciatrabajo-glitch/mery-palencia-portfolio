import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import Seo from "@/components/Seo";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main id="main-content" className="portfolio-page min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Seo
        title="Página no encontrada"
        description="La página solicitada no existe o fue movida."
        path="/404"
        noIndex
      />
      <section className="portfolio-surface w-full max-w-lg rounded-[1.75rem] px-6 py-10 text-center">
          <img src="/logo/logo.svg" alt="Mery Palencia" className="mx-auto mb-7 h-16 w-auto max-w-[13rem] object-contain" />

          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>

          <h2 className="text-xl font-semibold text-foreground mb-4">
            Página no encontrada
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            La página que buscas no existe.
            <br />
            Es posible que haya sido movida o eliminada.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="portfolio-button--primary px-6"
            >
              <Home className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
      </section>
    </main>
  );
}
