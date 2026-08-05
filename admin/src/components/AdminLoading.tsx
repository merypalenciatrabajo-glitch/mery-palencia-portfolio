import AdminBrand from "@/components/AdminBrand";
import { cn } from "@/lib/utils";

interface AdminLoadingProps {
  fullscreen?: boolean;
  label?: string;
}

export default function AdminLoading({
  fullscreen = false,
  label = "Cargando panel",
}: AdminLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        fullscreen ? "min-h-screen bg-background px-4" : "min-h-48",
      )}
      role="status"
      aria-live="polite"
    >
      <AdminBrand decorative className={cn(fullscreen ? "size-24" : "size-16")} />
      <div className="mt-5 h-px w-20 overflow-hidden bg-border" aria-hidden="true">
        <span className="block h-full w-1/2 animate-pulse bg-primary" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
