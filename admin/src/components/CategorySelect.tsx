import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  label: string;
}

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  customValue = "",
  onCustomChange,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = categories.find((c) => c.id === value)?.label ?? value;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={cn("text-muted-foreground transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-input rounded-lg shadow-lg overflow-hidden">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-secondary",
                value === c.id ? "text-primary font-medium bg-secondary/60" : "text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Campo libre para "otros" */}
      {value === "otros" && onCustomChange && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Escribe la categoría..."
          className="mt-2 w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  );
}
