import { signOut } from "firebase/auth";
import {
  BookOpen,
  Image,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Layers,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/gallery", icon: Image, label: "Galería" },
  { to: "/blog", icon: BookOpen, label: "Blog" },
  { to: "/commissions", icon: Layers, label: "Comisiones" },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="px-5 py-6 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          Admin Panel
        </p>
        <h1 className="text-base font-bold text-foreground">Mery Palencia</h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
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
      </div>
    </aside>
  );
}
