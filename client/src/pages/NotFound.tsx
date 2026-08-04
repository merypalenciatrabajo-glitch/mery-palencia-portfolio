import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import Seo from "@/components/Seo";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main id="main-content" className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Seo
        title="Página no encontrada"
        description="La página solicitada no existe o fue movida."
        path="/404"
        noIndex
      />
      <Card className="w-full max-w-lg shadow-lg border-border bg-card">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-destructive" aria-hidden="true" />
            </div>
          </div>

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
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
