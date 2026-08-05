import {
  signInWithEmailAndPassword,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorResolver,
  getMultiFactorResolver,
  TotpMultiFactorInfo,
} from "firebase/auth";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import AdminBrand from "@/components/AdminBrand";
import { auth } from "@/lib/firebase";
import { getSignInErrorMessage } from "@/lib/authErrors";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type Step = "credentials" | "totp";

export default function Login() {
  const { offlinePreview, offlinePreviewError } = useAuth();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
      // Si no tiene 2FA configurado, entra directo
    } catch (err: unknown) {
      const mfaError = err as MultiFactorError;
      if (mfaError.code === "auth/multi-factor-auth-required") {
        const mfaResolver = getMultiFactorResolver(auth, mfaError);
        setResolver(mfaResolver);
        setStep("totp");
      } else {
        setError(getSignInErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolver) return;
    setError("");
    setLoading(true);
    try {
      const totpHint = resolver.hints.find(
        (h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID
      ) as TotpMultiFactorInfo | undefined;

      if (!totpHint) {
        setError("No se encontró un factor TOTP configurado.");
        return;
      }

      const assertion = TotpMultiFactorGenerator.assertionForSignIn(
        totpHint.uid,
        totpCode
      );
      await resolver.resolveSignIn(assertion);
    } catch {
      setError("Código incorrecto. Verifica tu app de autenticación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/45" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] bottom-0 h-px bg-border/70" />

      <div className="w-full max-w-[30rem]">
        <header className="mb-7 text-center sm:mb-9">
          <AdminBrand className="mx-auto size-32 sm:size-40" />
          <p className="mx-auto mt-3 max-w-full text-[0.62rem] font-semibold uppercase leading-relaxed tracking-[0.18em] text-primary sm:text-[0.68rem] sm:tracking-[0.3em]">
            Administración del portafolio
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            Panel Admin
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Acceso privado de Mery Palencia</p>
        </header>

        <section className="rounded-[1.75rem] border border-border/90 bg-card/75 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:p-8">
          {offlinePreview && (
            <div
              role="status"
              className="mb-5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
            >
              Vista previa offline · datos locales de prueba
            </div>
          )}
          {offlinePreviewError && (
            <p
              role="alert"
              className="mb-5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              No se pudo iniciar la vista local ({offlinePreviewError}).
            </p>
          )}
          {step === "credentials" ? (
            <>
              <h2 className="mb-1 text-lg font-semibold text-foreground">
                Iniciar sesión
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">Ingresa con tu cuenta administrativa.</p>
              <form onSubmit={handleCredentials} className="space-y-5">
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-medium text-foreground mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="admin-email"
                      aria-label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-input bg-background/70 py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-ring"
                      placeholder="Correo administrativo"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-sm font-medium text-foreground mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="admin-password"
                      aria-label="Contraseña"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-input bg-background/70 py-3 pl-10 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-ring"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/88",
                    loading && "cursor-not-allowed opacity-60"
                  )}
                >
                  {loading ? "Verificando..." : "Continuar"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <ShieldCheck size={26} className="shrink-0 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Verificación 2FA
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Abre tu app de autenticación
                  </p>
                </div>
              </div>

              <form onSubmit={handleTotp} className="space-y-4">
                <div>
                  <label htmlFor="admin-totp" className="block text-sm font-medium text-foreground mb-1.5">
                    Código de 6 dígitos
                  </label>
                  <input
                    id="admin-totp"
                    aria-label="Código de 6 dígitos"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) =>
                      setTotpCode(e.target.value.replace(/\D/g, ""))
                    }
                    autoComplete="one-time-code"
                    required
                    className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-center text-lg tracking-[0.35em] text-foreground outline-none transition-colors hover:border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-ring"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className={cn(
                    "w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/88",
                    (loading || totpCode.length !== 6) &&
                      "opacity-60 cursor-not-allowed"
                  )}
                >
                  {loading ? "Verificando..." : "Acceder"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setTotpCode("");
                    setError("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Volver
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
