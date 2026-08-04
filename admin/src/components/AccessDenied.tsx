import { ShieldX } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AccessDenied() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX aria-hidden="true" size={28} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Acceso no autorizado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La cuenta {user?.email ?? "actual"} inició sesión correctamente, pero no tiene el rol necesario para utilizar este panel.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? "Cerrando sesión..." : "Usar otra cuenta"}
        </button>
      </section>
    </main>
  );
}
