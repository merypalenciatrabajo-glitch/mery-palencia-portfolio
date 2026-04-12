import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { BookOpen, GalleryHorizontal, Image, Layers, TrendingUp } from "lucide-react";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Destacadas", count: 0, icon: Image, color: "text-blue-500" },
    { label: "Galería", count: 0, icon: GalleryHorizontal, color: "text-cyan-500" },
    { label: "Posts del Blog", count: 0, icon: BookOpen, color: "text-purple-500" },
    { label: "Comisiones", count: 0, icon: Layers, color: "text-emerald-500" },
  ]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [gallerySnap, galleryPageSnap, blogSnap, commissionsSnap] = await Promise.all([
          getCountFromServer(collection(db, "gallery")),
          getCountFromServer(collection(db, "galleryPage")),
          getCountFromServer(collection(db, "blogPosts")),
          getCountFromServer(collection(db, "commissions")),
        ]);

        setStats([
          { label: "Destacadas", count: gallerySnap.data().count, icon: Image, color: "text-blue-500" },
          { label: "Galería", count: galleryPageSnap.data().count, icon: GalleryHorizontal, color: "text-cyan-500" },
          { label: "Posts del Blog", count: blogSnap.data().count, icon: BookOpen, color: "text-purple-500" },
          { label: "Comisiones", count: commissionsSnap.data().count, icon: Layers, color: "text-emerald-500" },
        ]);
      } catch {
        // Firestore no configurado aún, se muestran ceros
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Resumen del contenido publicado</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={cn("p-3 rounded-lg bg-secondary", color)}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Acciones rápidas</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/gallery", label: "Subir destacada", icon: Image },
            { href: "/galeria", label: "Subir a galería", icon: GalleryHorizontal },
            { href: "/blog", label: "Nuevo post", icon: BookOpen },
            { href: "/commissions", label: "Editar comisiones", icon: Layers },
          ].map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium text-foreground"
            >
              <Icon size={16} className="text-primary" />
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
