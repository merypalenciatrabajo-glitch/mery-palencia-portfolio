import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import {
  ArrowUpRight,
  BookOpen,
  GalleryHorizontal,
  Image,
  Layers,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "ready" | "error";

interface DashboardStat {
  label: string;
  description: string;
  collectionName: string;
  count: number;
  icon: React.ElementType;
  color: string;
  glow: string;
}

const INITIAL_STATS: DashboardStat[] = [
  {
    label: "Destacadas",
    description: "Portada principal",
    collectionName: "gallery",
    count: 0,
    icon: Image,
    color: "text-blue-400",
    glow: "bg-blue-500/12 ring-blue-400/15",
  },
  {
    label: "Galería",
    description: "Archivo visual",
    collectionName: "galleryPage",
    count: 0,
    icon: GalleryHorizontal,
    color: "text-cyan-400",
    glow: "bg-cyan-500/12 ring-cyan-400/15",
  },
  {
    label: "Posts del blog",
    description: "Contenido editorial",
    collectionName: "blogPosts",
    count: 0,
    icon: BookOpen,
    color: "text-purple-400",
    glow: "bg-purple-500/12 ring-purple-400/15",
  },
  {
    label: "Comisiones",
    description: "Servicios disponibles",
    collectionName: "commissions",
    count: 0,
    icon: Layers,
    color: "text-emerald-400",
    glow: "bg-emerald-500/12 ring-emerald-400/15",
  },
];

const QUICK_ACTIONS = [
  {
    to: "/gallery",
    label: "Subir destacada",
    description: "Añadir una pieza a la portada",
    icon: Image,
  },
  {
    to: "/galeria",
    label: "Subir a galería",
    description: "Publicar en el archivo visual",
    icon: GalleryHorizontal,
  },
  {
    to: "/blog",
    label: "Nuevo post",
    description: "Redactar una entrada del blog",
    icon: BookOpen,
  },
  {
    to: "/commissions",
    label: "Editar comisiones",
    description: "Actualizar servicios y precios",
    icon: Layers,
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const fetchCounts = useCallback(async () => {
    setLoadState("loading");

    try {
      const snapshots = await Promise.all(
        INITIAL_STATS.map((stat) =>
          getCountFromServer(collection(db, stat.collectionName)),
        ),
      );

      setStats((current) =>
        current.map((stat, index) => ({
          ...stat,
          count: snapshots[index].data().count,
        })),
      );
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  const totalItems = useMemo(
    () => stats.reduce((total, stat) => total + stat.count, 0),
    [stats],
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles size={14} strokeWidth={1.8} aria-hidden="true" />
            Panel de contenido
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            Una vista rápida de todo lo que compone el portafolio.
          </p>
        </div>

        <div className="flex items-baseline gap-2 sm:text-right" aria-live="polite">
          {loadState === "loading" ? (
            <span className="h-8 w-12 animate-pulse rounded-lg bg-muted" aria-label="Cargando total" />
          ) : (
            <span className="text-3xl font-semibold tabular-nums text-foreground">
              {loadState === "error" ? "—" : totalItems}
            </span>
          )}
          <span className="text-xs leading-tight text-muted-foreground">
            elementos
            <br />
            registrados
          </span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.75fr)]">
        <section
          className="admin-dashboard-surface overflow-hidden rounded-[1.6rem] border border-border/80"
          aria-labelledby="content-summary-title"
        >
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
              <h2 id="content-summary-title" className="text-sm font-semibold text-foreground">
                Vista general
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Contenido organizado por sección</p>
            </div>

            {loadState === "error" && (
              <button
                type="button"
                onClick={() => void fetchCounts()}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw size={14} aria-hidden="true" />
                Reintentar
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2">
            {stats.map(({ label, description, count, icon: Icon, color, glow }, index) => (
              <div
                key={label}
                className={cn(
                  "flex min-h-36 items-center gap-4 p-5 sm:p-6",
                  index < 2 && "border-b border-border/70",
                  index % 2 === 0 && "sm:border-r sm:border-border/70",
                )}
              >
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1",
                    color,
                    glow,
                  )}
                >
                  <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  {loadState === "loading" ? (
                    <div className="mb-2 h-8 w-10 animate-pulse rounded-lg bg-muted" />
                  ) : (
                    <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                      {loadState === "error" ? "—" : count}
                    </p>
                  )}
                  <p className="truncate text-sm font-medium text-foreground">{label}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {loadState === "error" && (
            <p className="border-t border-border/70 px-5 py-3 text-xs text-amber-300 sm:px-6" role="status">
              No pudimos actualizar los totales. El resto del panel sigue disponible.
            </p>
          )}
        </section>

        <section
          className="admin-dashboard-surface rounded-[1.6rem] border border-border/80 p-3"
          aria-labelledby="quick-actions-title"
        >
          <div className="px-3 pb-3 pt-2">
            <h2 id="quick-actions-title" className="text-sm font-semibold text-foreground">
              Acciones rápidas
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Continúa donde necesitas trabajar</p>
          </div>

          <div className="space-y-1">
            {QUICK_ACTIONS.map(({ to, label, description, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-3 rounded-2xl px-3 py-3 outline-none transition-[background-color,transform] duration-200 hover:translate-x-0.5 hover:bg-secondary/80 focus-visible:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{description}</span>
                </span>
                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
