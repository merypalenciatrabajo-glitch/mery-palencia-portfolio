import { cn } from "@/lib/utils";

interface AdminBrandProps {
  className?: string;
  decorative?: boolean;
}

export default function AdminBrand({ className, decorative = false }: AdminBrandProps) {
  return (
    <img
      src="/brand/mery-palencia-logo.svg"
      alt={decorative ? "" : "Mery Palencia"}
      aria-hidden={decorative || undefined}
      className={cn("object-contain", className)}
    />
  );
}
