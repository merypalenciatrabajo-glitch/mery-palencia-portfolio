import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import SocialRail from "./components/SocialRail";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="portfolio-page flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4" role="status" aria-label="Cargando página">
            <img src="/logo/logo.svg" alt="" aria-hidden="true" className="h-14 w-auto animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Cargando</span>
          </div>
        </div>
      }
    >
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/blog"} component={Blog} />
        <Route path={"/blog/:id"} component={BlogPost} />
        <Route path={"/galeria"} component={GalleryPage} />
        <Route path={"/terminos"}><LegalPage kind="terms" /></Route>
        <Route path={"/privacidad"}><LegalPage kind="privacy" /></Route>
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable={false}
      >
          <a
            href="#main-content"
            className="portfolio-button portfolio-button--primary fixed left-4 top-4 z-[100] -translate-y-24 font-semibold focus:translate-y-0"
          >
            Saltar al contenido principal
          </a>
          <SocialRail />
          <Toaster />
          <Router />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
