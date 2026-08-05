import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { Edit2, Images, Plus, RefreshCw, Star, StarOff, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import CategorySelect from "@/components/CategorySelect";

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  publicId: string;
  category: string;
  description: string;
  order: number;
  featured?: boolean;
  extraImages?: { url: string; publicId: string }[];
}

type LoadState = "loading" | "ready" | "error";

const CATEGORIES = [
  { id: "fotografia-paisaje", label: "Fotografía paisaje" },
  { id: "fotografia-infantil", label: "Fotografía infantil" },
  { id: "fotografia-moda", label: "Fotografía de moda" },
  { id: "fotografia-documental", label: "Fotografía documental" },
  { id: "ilustracion-digital", label: "Ilustración digital" },
  { id: "material-digital", label: "Material digital" },
  { id: "trabajos-analogos", label: "Trabajos análogos" },
  { id: "otros", label: "Otros" },
];

const EMPTY_FORM = {
  title: "",
  category: "fotografia-paisaje",
  description: "",
};

export default function GaleriaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [subscriptionKey, setSubscriptionKey] = useState(0);
  const [pageError, setPageError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);

  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [extraPreviews, setExtraPreviews] = useState<string[]>([]);
  const [existingExtras, setExistingExtras] = useState<{ url: string; publicId: string }[]>([]);
  const [extrasError, setExtrasError] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    setLoadState("loading");
    setPageError("");
    const q = query(collection(db, "gallery"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, "id">) })));
        setLoadState("ready");
      },
      () => {
        setLoadState("error");
        setPageError("No pudimos cargar la galería.");
      },
    );
    return unsub;
  }, [subscriptionKey]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setPreview("");
    setExtraFiles([]);
    setExtraPreviews([]);
    setExistingExtras([]);
    setExtrasError("");
    setCustomCategory("");
    setShowForm(true);
  };

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    openCreate();
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    const isCustom = !CATEGORIES.find((c) => c.id === item.category);
    setForm({ title: item.title, category: isCustom ? "otros" : item.category, description: item.description });
    setCustomCategory(isCustom ? item.category : "");
    setPreview(item.image);
    setFile(null);
    setExtraFiles([]);
    setExtraPreviews([]);
    setExistingExtras(item.extraImages ?? []);
    setExtrasError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFile(null);
    setPreview("");
    setProgress(0);
    setExtraFiles([]);
    setExtraPreviews([]);
    setExistingExtras([]);
    setExtrasError("");
    setCustomCategory("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleExtraFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const total = existingExtras.length + extraFiles.length + selected.length;
    if (total > 4) {
      setExtrasError(`Máximo 4 fotos extras. Ya tienes ${existingExtras.length + extraFiles.length}.`);
      e.target.value = "";
      return;
    }
    setExtrasError("");
    setExtraFiles((prev) => [...prev, ...selected]);
    setExtraPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeExtraFile = (index: number) => {
    setExtraFiles((prev) => prev.filter((_, i) => i !== index));
    setExtraPreviews((prev) => prev.filter((_, i) => i !== index));
    setExtrasError("");
  };

  const removeExistingExtra = (index: number) => {
    setExistingExtras((prev) => prev.filter((_, i) => i !== index));
    setExtrasError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const finalCategory = form.category === "otros" ? customCategory.trim() || "otros" : form.category;
    try {
      const uploadedExtras: { url: string; publicId: string }[] = [];
      for (const extraFile of extraFiles) {
        const { url, publicId } = await uploadToCloudinary(extraFile, setProgress);
        uploadedExtras.push({ url, publicId });
      }
      const finalExtras = [...existingExtras, ...uploadedExtras];

      if (editing) {
        let imageData: { image?: string; publicId?: string } = {};
        if (file) {
          const { url, publicId } = await uploadToCloudinary(file, setProgress);
          imageData = { image: url, publicId };
        }
        await updateDoc(doc(db, "gallery", editing.id), {
          ...form,
          category: finalCategory,
          ...imageData,
          extraImages: finalExtras,
        });
      } else {
        if (!file) return;
        const { url, publicId } = await uploadToCloudinary(file, setProgress);
        await addDoc(collection(db, "gallery"), {
          ...form,
          category: finalCategory,
          image: url,
          publicId,
          order: items.length,
          featured: false,
          extraImages: finalExtras,
        });
      }
      closeForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // `gallery` is the single source of truth; featured controls Home visibility.
  const handleToggleFeatured = async (item: GalleryItem) => {
    setTogglingId(item.id);
    try {
      await updateDoc(doc(db, "gallery", item.id), { featured: !item.featured });
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;
    setDeletingId(item.id);
    try {
      await deleteDoc(doc(db, "gallery", item.id));
    } finally {
      setDeletingId(null);
    }
  };

  const featuredCount = items.filter((i) => i.featured).length;

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Images size={14} strokeWidth={1.8} aria-hidden="true" />
            Archivo visual
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Galería</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Administra todas las piezas del portafolio desde un único archivo.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/80 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus size={17} aria-hidden="true" />
          Nueva ilustración
        </button>
      </header>

      <section className="admin-dashboard-surface overflow-hidden rounded-[1.6rem] border border-border/80">
        <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Todas las piezas</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {loadState === "loading" ? "Actualizando contenido…" : `${items.length} obras · ${featuredCount} en el Home`}
            </p>
          </div>
          <span className="w-fit rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            Colección única
          </span>
        </div>

        {pageError && (
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/5 px-5 py-3 text-xs text-amber-300 sm:px-6" role="alert">
            <span>{pageError}</span>
            <button type="button" onClick={() => setSubscriptionKey((current) => current + 1)} className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary">
              <RefreshCw size={13} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 lg:p-6">
          {loadState === "loading" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/50">
                  <div className="aspect-[4/3] animate-pulse bg-muted" />
                  <div className="space-y-2 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-muted" /><div className="h-3 w-1/3 animate-pulse rounded bg-muted" /></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-border px-6 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"><Images size={24} aria-hidden="true" /></span>
              <h3 className="text-base font-semibold text-foreground">La galería está vacía</h3>
              <p className="mt-1 text-sm text-muted-foreground">Añade la primera pieza para comenzar el archivo visual.</p>
              <button type="button" onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus size={16} aria-hidden="true" /> Añadir la primera</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article key={item.id} className="group overflow-hidden rounded-[1.35rem] border border-border/80 bg-card/55 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_48px_color-mix(in_oklab,black_30%,transparent)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    <img src={item.image} alt={item.title} loading="lazy" className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]" />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/55 to-transparent p-3">
                      <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium capitalize text-white backdrop-blur-md">{item.category}</span>
                      {item.featured && <span className="rounded-full border border-primary/30 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-primary backdrop-blur-md">En Home</span>}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="min-h-14"><h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description || "Sin descripción añadida"}</p></div>
                    <div className="mt-4 flex gap-2 border-t border-border/70 pt-3">
                      <button type="button" onClick={() => openEdit(item)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"><Edit2 size={13} aria-hidden="true" /> Editar</button>
                      <button type="button" onClick={() => void handleToggleFeatured(item)} disabled={togglingId === item.id} className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50", item.featured ? "border-amber-500/25 text-amber-300 hover:bg-amber-500/10" : "border-primary/25 text-primary hover:bg-primary/10")}>{item.featured ? <><StarOff size={13} aria-hidden="true" /> Quitar</> : <><Star size={13} aria-hidden="true" /> Destacar</>}</button>
                      <button type="button" onClick={() => void handleDelete(item)} disabled={deletingId === item.id} className="flex size-9 items-center justify-center rounded-xl border border-destructive/25 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50" aria-label={`Eliminar ${item.title}`}><Trash2 size={13} aria-hidden="true" /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-5">
          <div role="dialog" aria-modal="true" aria-labelledby="gallery-form-title" className="admin-dashboard-surface max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-border/80 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-card/90 px-5 py-4 backdrop-blur-xl sm:px-6">
              <h2 id="gallery-form-title" className="font-semibold text-foreground">
                {editing ? "Editar ilustración" : "Nueva ilustración"}
              </h2>
              <button type="button" onClick={closeForm} className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Cerrar formulario">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Foto de portada {!editing && <span className="text-destructive">*</span>}
                </label>
                {preview ? (
                  <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-secondary">
                    <img src={preview} alt="preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(editing?.image || ""); }}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/35 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  >
                    <Upload size={24} />
                    <span className="text-sm">Haz clic para subir imagen</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {saving && progress > 0 && progress < 100 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Fotos extras <span className="text-muted-foreground font-normal">(máx. 4)</span>
                </label>
                {(existingExtras.length > 0 || extraPreviews.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {existingExtras.map((img, i) => (
                      <div key={`existing-${i}`} className="relative h-16 w-16 overflow-hidden rounded-xl bg-secondary">
                        <img src={img.url} alt={`extra ${i + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeExistingExtra(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {extraPreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative h-16 w-16 overflow-hidden rounded-xl bg-secondary">
                        <img src={src} alt={`nueva ${i + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeExtraFile(i)} className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {existingExtras.length + extraFiles.length < 4 && (
                  <button
                    type="button"
                    onClick={() => extraFileRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-primary/[0.03] px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    <Upload size={14} /> Agregar fotos
                  </button>
                )}
                <input ref={extraFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleExtraFilesChange} />
                {extrasError && <p className="text-xs text-destructive mt-1">{extrasError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Título <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
                  placeholder="Ej: Retrato Botánico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Categoría</label>
                <CategorySelect
                  categories={CATEGORIES}
                  value={form.category}
                  onChange={(val) => setForm((p) => ({ ...p, category: val }))}
                  customValue={customCategory}
                  onCustomChange={setCustomCategory}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
                  placeholder="Descripción breve de la ilustración"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editing && !file)}
                  className={cn(
                    "min-w-36 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    (saving || (!editing && !file)) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Publicar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
