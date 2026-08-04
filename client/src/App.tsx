import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            role="status"
            aria-label="Cargando página"
          />
        </div>
      }
    >
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/blog"} component={Blog} />
        <Route path={"/blog/:id"} component={BlogPost} />
        <Route path={"/galeria"} component={GalleryPage} />
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
        <TooltipProvider>
          <a
            href="#main-content"
            className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-accent px-4 py-3 font-semibold text-accent-foreground shadow-lg transition-transform focus:translate-y-0"
          >
            Saltar al contenido principal
          </a>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
