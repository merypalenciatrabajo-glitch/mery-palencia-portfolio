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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Lock size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Panel Admin</h1>
          <p className="text-muted-foreground mt-1">Mery Palencia</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
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
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Iniciar sesión
              </h2>
              <form onSubmit={handleCredentials} className="space-y-4">
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
                      className="w-full pl-9 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      placeholder="admin@ejemplo.com"
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
                      className="w-full pl-9 pr-10 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    "w-full py-2.5 rounded-lg font-medium text-sm transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    loading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {loading ? "Verificando..." : "Continuar"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-primary" />
                </div>
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
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm tracking-widest text-center text-lg"
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
                    "w-full py-2.5 rounded-lg font-medium text-sm transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
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
        </div>
      </div>
    </div>
  );
}
