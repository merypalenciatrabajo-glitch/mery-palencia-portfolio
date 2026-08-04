import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth, emulatorPreviewRequested } from "@/lib/firebase";
import {
  canEnableOfflinePreview,
  OFFLINE_PREVIEW_EMAIL,
  OFFLINE_PREVIEW_PASSWORD,
} from "@/lib/offlinePreview";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  offlinePreview: boolean;
  offlinePreviewError: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TERMINAL_AUTH_ERRORS = new Set([
  "auth/id-token-expired",
  "auth/invalid-user-token",
  "auth/user-disabled",
  "auth/user-not-found",
]);

function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  return typeof error.code === "string" ? error.code : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offlinePreview, setOfflinePreview] = useState(false);
  const [offlinePreviewError, setOfflinePreviewError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        try {
          const token = await currentUser.getIdTokenResult();
          const role = token.claims.role;
          const hasAdminRole =
            token.claims.admin === true ||
            role === "admin" ||
            role === "editor";

          setUser(currentUser);
          setIsAdmin(hasAdminRole);
        } catch {
          setUser(currentUser);
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    );

    if (emulatorPreviewRequested && Capacitor.isNativePlatform()) {
      void CapacitorApp.getInfo()
        .then(async (appInfo) => {
          if (
            !canEnableOfflinePreview(
              emulatorPreviewRequested,
              Capacitor.isNativePlatform(),
              appInfo,
            )
          ) {
            return;
          }
          setOfflinePreview(true);
          setOfflinePreviewError(null);
          if (!auth.currentUser) {
            await signInWithEmailAndPassword(
              auth,
              OFFLINE_PREVIEW_EMAIL,
              OFFLINE_PREVIEW_PASSWORD,
            );
          }
        })
        .catch((error: unknown) => {
          const code = getErrorCode(error);
          setOfflinePreviewError(
            code ?? "No fue posible conectar con los servicios locales.",
          );
          setLoading(false);
        });
    }

    const refreshSession = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        await currentUser.reload();
        const token = await currentUser.getIdTokenResult(true);
        const role = token.claims.role;
        setIsAdmin(
          token.claims.admin === true ||
            role === "admin" ||
            role === "editor"
        );
      } catch (error) {
        const code = getErrorCode(error);
        if (code && TERMINAL_AUTH_ERRORS.has(code)) {
          await signOut(auth);
        }
      }
    };

    let disposed = false;
    let removeLifecycleListener: (() => Promise<void>) | undefined;

    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) void refreshSession();
      }).then((listener) => {
        if (disposed) {
          void listener.remove();
        } else {
          removeLifecycleListener = () => listener.remove();
        }
      });
    } else {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") void refreshSession();
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      removeLifecycleListener = async () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    return () => {
      disposed = true;
      unsubscribe();
      void removeLifecycleListener?.();
    };
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        offlinePreview,
        offlinePreviewError,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
