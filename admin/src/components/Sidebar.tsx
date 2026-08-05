import {
  BookOpen,
  GalleryHorizontal,
  Image,
  Layers,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import AdminBrand from "@/components/AdminBrand";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/gallery", icon: Image, label: "Destacadas" },
  { to: "/galeria", icon: GalleryHorizontal, label: "Galería" },
  { to: "/blog", icon: BookOpen, label: "Blog" },
  { to: "/commissions", icon: Layers, label: "Comisiones" },
];

const dockButtonClass =
  "group relative flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-medium outline-none transition-[color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-secondary/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";

export default function Sidebar() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    if (loggingOut) return;

    setLogoutError("");
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLogoutError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {logoutError && (
        <p
          role="alert"
          className="fixed bottom-24 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-destructive/25 bg-card/95 px-4 py-3 text-center text-xs font-medium text-destructive shadow-xl backdrop-blur-xl"
        >
          {logoutError}
        </p>
      )}

      <aside
        className="admin-dock fixed left-1/2 z-50 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-[1.65rem] border border-border/80 p-1.5"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        aria-label="Navegación principal del panel"
      >
        <div className="admin-dock__content flex items-center gap-1 overflow-x-auto rounded-[1.25rem] px-1 py-0.5">
          <div className="hidden shrink-0 items-center gap-2.5 pl-2 pr-3 xl:flex">
            <AdminBrand decorative className="size-9 shrink-0" />
            <span className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Admin Panel
              </span>
              <span className="block text-xs font-semibold text-foreground">Mery Palencia</span>
            </span>
          </div>

          <span className="mx-1 hidden h-7 w-px shrink-0 bg-border xl:block" aria-hidden="true" />

          <nav className="flex items-center gap-1" aria-label="Secciones del panel">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                aria-label={label}
                className={({ isActive }) =>
                  cn(
                    dockButtonClass,
                    isActive
                      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_24%,transparent)]"
                      : "text-muted-foreground",
                  )
                }
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <span className="mx-1 h-7 w-px shrink-0 bg-border" aria-hidden="true" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={cn(
              dockButtonClass,
              "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            )}
            aria-label={loggingOut ? "Cerrando sesión" : "Cerrar sesión"}
          >
            <LogOut size={19} strokeWidth={1.8} aria-hidden="true" />
            <span className="hidden xl:inline">
              {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
