import { useState } from "react";
import AdminBrand from "@/components/AdminBrand";
import { useAuth } from "@/contexts/AuthContext";

export default function AccessDenied() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
    } catch {
      setLogoutError("No se pudo cerrar la sesión. Inténtalo nuevamente.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/45" />
      <section className="admin-dashboard-surface w-full max-w-[32rem] rounded-[1.75rem] border border-border/90 px-5 py-8 text-center sm:px-9 sm:py-10">
        <AdminBrand className="mx-auto size-32 sm:size-36" />
        <p className="mx-auto mt-4 max-w-full text-[0.62rem] font-semibold uppercase leading-relaxed tracking-[0.18em] text-primary sm:text-[0.68rem] sm:tracking-[0.28em]">
          Cuenta sin acceso
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Acceso no autorizado</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          La cuenta <strong className="font-medium text-foreground">{user?.email ?? "actual"}</strong> inició sesión correctamente, pero todavía no tiene permisos para administrar este portafolio.
        </p>
        {logoutError && (
          <p role="alert" className="mt-5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {logoutError}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? "Cerrando sesión..." : "Usar otra cuenta"}
        </button>
      </section>
    </main>
  );
}
