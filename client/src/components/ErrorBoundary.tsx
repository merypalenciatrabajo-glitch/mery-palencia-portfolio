import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private reloadSite = () => {
    const refreshedUrl = new URL(window.location.href);
    refreshedUrl.searchParams.set('_actualizado', String(Date.now()));
    window.location.replace(refreshedUrl.toString());
  };

  render() {
    if (this.state.hasError) {
      return (
        <main id="main-content" className="flex min-h-screen items-center justify-center bg-background p-6">
          <section className="portfolio-surface flex w-full max-w-xl flex-col items-center rounded-[1.75rem] p-8 text-center sm:p-10">
            <AlertTriangle
              size={38}
              className="mb-6 flex-shrink-0 text-destructive"
            />

            <p className="portfolio-eyebrow mb-3">No pudimos abrir esta sección</p>
            <h1 className="mb-3 text-2xl font-semibold tracking-[-0.03em]">Actualiza el sitio para continuar</h1>
            <p className="mb-7 max-w-md leading-7 text-muted-foreground">
              Es posible que haya una versión nueva disponible. Tus datos y tu navegación no se han perdido.
            </p>

            {import.meta.env.DEV && this.state.error && <div className="mb-6 w-full overflow-auto rounded-xl bg-muted p-4 text-left">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error.stack}
              </pre>
            </div>}

            <button
              onClick={this.reloadSite}
              className={cn("portfolio-button portfolio-button--primary")}
            >
              <RotateCcw size={16} />
              Actualizar sitio
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
