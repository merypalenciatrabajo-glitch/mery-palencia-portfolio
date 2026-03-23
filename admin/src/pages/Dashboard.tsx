import { useEffect, useState, useRef, useCallback } from "react";
import { collection, getCountFromServer, doc, setDoc, onSnapshot } from "firebase/firestore";
import { BookOpen, Image, Layers, TrendingUp, Upload, CheckCircle, Move, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

// Modal de posicionamiento antes de subir
function PositionModal({
  file,
  onConfirm,
  onCancel,
}: {
  file: File;
  onConfirm: (pos: { x: number; y: number }) => void;
  onCancel: () => void;
}) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [previewUrl] = useState(() => URL.createObjectURL(file));
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const posRef = useRef(position);
  posRef.current = position;

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - last.current.x) / rect.width) * 100;
    const dy = ((e.clientY - last.current.y) / rect.height) * 100;
    last.current = { x: e.clientX, y: e.clientY };
    setPosition(p => ({ x: clamp(p.x - dx), y: clamp(p.y - dy) }));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.touches[0].clientX - last.current.x) / rect.width) * 100;
    const dy = ((e.touches[0].clientY - last.current.y) / rect.height) * 100;
    last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setPosition(p => ({ x: clamp(p.x - dx), y: clamp(p.y - dy) }));
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [onMouseMove, onMouseUp, onTouchMove]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Ajustar encuadre</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Move size={11} /> Arrastra para posicionar antes de subir
            </p>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Editor */}
        <div
          ref={containerRef}
          className="relative w-full aspect-video rounded-lg overflow-hidden border border-border cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: "cover", objectPosition: `${position.x}% ${position.y}%` }}
            draggable={false}
          />
          {/* Guías de tercios */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(position)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Subir imagen
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Ilustraciones", count: 0, icon: Image, color: "text-blue-500" },
    { label: "Posts del Blog", count: 0, icon: BookOpen, color: "text-purple-500" },
    { label: "Comisiones", count: 0, icon: Layers, color: "text-emerald-500" },
  ]);

  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [heroPosition, setHeroPosition] = useState({ x: 50, y: 50 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "hero"), (snap) => {
      if (snap.exists()) {
        setHeroUrl(snap.data().imageUrl ?? null);
        setHeroPosition(snap.data().position ?? { x: 50, y: 50 });
      }
    });
    return unsub;
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmUpload = async (pos: { x: number; y: number }) => {
    if (!pendingFile) return;
    setPendingFile(null);
    setUploading(true);
    setSaved(false);
    try {
      const { url } = await uploadToCloudinary(pendingFile, setUploadProgress);
      await setDoc(doc(db, "settings", "hero"), { imageUrl: url, position: pos });
      setHeroUrl(url);
      setHeroPosition(pos);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [gallerySnap, blogSnap, commissionsSnap] = await Promise.all([
          getCountFromServer(collection(db, "gallery")),
          getCountFromServer(collection(db, "blogPosts")),
          getCountFromServer(collection(db, "commissions")),
        ]);

        setStats([
          {
            label: "Ilustraciones",
            count: gallerySnap.data().count,
            icon: Image,
            color: "text-blue-500",
          },
          {
            label: "Posts del Blog",
            count: blogSnap.data().count,
            icon: BookOpen,
            color: "text-purple-500",
          },
          {
            label: "Comisiones",
            count: commissionsSnap.data().count,
            icon: Layers,
            color: "text-emerald-500",
          },
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
        <p className="text-muted-foreground mt-1">
          Resumen del contenido publicado
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, count, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
          >
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

      {/* Modal de posicionamiento */}
      {pendingFile && (
        <PositionModal
          file={pendingFile}
          onConfirm={handleConfirmUpload}
          onCancel={() => setPendingFile(null)}
        />
      )}

      {/* Hero Image */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Image size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Imagen Hero</h2>
          <span className="text-xs text-muted-foreground ml-1">— portada principal del portafolio</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="w-full sm:w-64 aspect-video rounded-lg overflow-hidden border border-border bg-secondary flex items-center justify-center flex-shrink-0">
            {heroUrl ? (
              <img
                src={heroUrl}
                alt="Hero actual"
                className="w-full h-full object-cover"
                style={{ objectPosition: `${heroPosition.x}% ${heroPosition.y}%` }}
              />
            ) : (
              <span className="text-sm text-muted-foreground">Sin imagen</span>
            )}
          </div>

          {/* Upload */}
          <div className="flex flex-col gap-3 justify-center">
            <p className="text-sm text-muted-foreground">
              Esta imagen aparece en la sección principal del portafolio público. Reemplázala cuando quieras.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors w-fit"
            >
              <Upload size={15} />
              {uploading ? `Subiendo... ${Math.round(uploadProgress)}%` : "Reemplazar imagen"}
            </button>
            {saved && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-500">
                <CheckCircle size={15} /> Imagen actualizada
              </p>
            )}
            {uploading && (
              <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Acciones rápidas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/gallery", label: "Subir ilustración", icon: Image },
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
