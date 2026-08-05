import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import UpdateBanner from "./UpdateBanner";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const update = useAppUpdate();
  const { offlinePreview } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {update && <UpdateBanner update={update} />}
      <Sidebar />
      <main className="min-h-screen overflow-y-auto pb-32 pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
          <div key={location.pathname} className="admin-page-enter">
            {offlinePreview && (
              <div className="mb-5 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-center text-xs font-semibold text-amber-300">
                Vista previa offline · datos locales de prueba
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
