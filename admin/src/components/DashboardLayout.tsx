import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import UpdateBanner from "./UpdateBanner";
import { useAppUpdate } from "@/hooks/useAppUpdate";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const update = useAppUpdate();

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
          {children}
        </div>
      </main>
    </div>
  );
}
