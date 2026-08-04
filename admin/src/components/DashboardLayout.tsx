import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import UpdateBanner from "./UpdateBanner";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const update = useAppUpdate();
  const { offlinePreview } = useAuth();

  // paddingTop = safe-area-inset-top + 48px (top bar) + 48px si hay banner
  const topOffset = update
    ? `calc(env(safe-area-inset-top, 0px) + 96px)`
    : `calc(env(safe-area-inset-top, 0px) + 48px)`;

  return (
    <div className="flex min-h-screen bg-background">
      {update && <UpdateBanner update={update} />}
      <Sidebar hasUpdate={!!update} />
      <main
        className="flex-1 overflow-y-auto md:pt-0"
        style={{ paddingTop: topOffset }}
      >
        <style>{`@media (min-width: 768px) { main { padding-top: 0 !important; } }`}</style>
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
          {offlinePreview && (
            <div className="mb-5 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-center text-xs font-semibold text-amber-600 dark:text-amber-300">
              Vista previa offline · datos locales de prueba
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
