import { useState } from "react";
import { signOut } from "firebase/auth";
import {
  BookOpen,
  Image,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { CURRENT_VERSION } from "@/hooks/useAppUpdate";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/gallery", icon: Image, label: "Galería" },
  { to: "/blog", icon: BookOpen, label: "Blog" },
  { to: "/commissions", icon: Layers, label: "Comisiones" },
];

export default function Sidebar({ hasUpdate = false }: { hasUpdate?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="px-5 py-6 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Admin Panel
          </p>
          <h1 className="text-base font-bold text-foreground">Mery Palencia</h1>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-1 rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          {theme === "light" ? "Tema oscuro" : "Tema claro"}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
        <p className="text-xs text-muted-foreground/50 px-3 pt-2">v{CURRENT_VERSION}</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — siempre debajo de la status bar */}
      <div
        className="md:hidden fixed left-0 right-0 z-40 bg-card border-b border-border"
        style={{ top: hasUpdate ? '48px' : '0' }}
      >
        {/* Relleno de status bar */}
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        {/* Contenido del top bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary"
          >
            <Menu size={22} />
          </button>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-none">
              Admin Panel
            </p>
            <p className="text-sm font-bold text-foreground">Mery Palencia</p>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer — respeta status bar */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-64 flex flex-col bg-card border-r border-border transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Relleno de status bar en el drawer */}
        <div style={{ height: 'env(safe-area-inset-top, 0px)', flexShrink: 0 }} />
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 h-screen sticky top-0 flex-col bg-card border-r border-border">
        <SidebarContent />
      </aside>
    </>
  );
}
