import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  Edit2,
  ImagePlus,
  Plus,
  RefreshCw,
  StarOff,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategorySelect from "@/components/CategorySelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import HashtagInput, {
  HashtagLinks,
  normalizeHashtagEntries,
  type HashtagEntry,
} from "@/components/HashtagInput";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/firebase";

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  publicId: string;
  category: string;
  description: string;
  hashtags?: HashtagEntry[] | string[];
  order: number;
  featured: boolean;
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
  hashtags: [] as HashtagEntry[],
};

const categoryLabel = (category: string) =>
  CATEGORIES.find((item) => item.id === category)?.label ?? category;

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [subscriptionKey, setSubscriptionKey] = useState(0);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [itemToUnfeature, setItemToUnfeature] = useState<GalleryItem | null>(null);
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

    const galleryQuery = query(collection(db, "gallery"), orderBy("order", "asc"));
    return onSnapshot(
      galleryQuery,
      (snapshot) => {
        const all = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<GalleryItem, "id">),
        }));
        setAllItems(all);
        setItems(all.filter((item) => item.featured));
        setLoadState("ready");
      },
      () => {
        setLoadState("error");
        setPageError("No pudimos cargar las ilustraciones destacadas.");
      },
    );
  }, [subscriptionKey]);

  useEffect(() => {
    if (!showForm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) closeForm();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  const releaseLocalPreviews = () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    extraPreviews.forEach((source) => URL.revokeObjectURL(source));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setPreview("");
    setExtraFiles([]);
    setExtraPreviews([]);
    setExistingExtras([]);
    setExtrasError("");
    setFormError("");
    setCustomCategory("");
    setProgress(0);
    setShowForm(true);
  };

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    openCreate();
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    const isCustom = !CATEGORIES.some((category) => category.id === item.category);
    setForm({
      title: item.title,
      category: isCustom ? "otros" : item.category,
      description: item.description,
      hashtags: normalizeHashtagEntries(item.hashtags),
    });
    setCustomCategory(isCustom ? item.category : "");
    setPreview(item.image);
    setFile(null);
    setExtraFiles([]);
    setExtraPreviews([]);
    setExistingExtras(item.extraImages ?? []);
    setExtrasError("");
    setFormError("");
    setProgress(0);
    setShowForm(true);
  };

  const closeForm = () => {
    releaseLocalPreviews();
    setShowForm(false);
    setEditing(null);
    setFile(null);
    setPreview("");
    setProgress(0);
    setExtraFiles([]);
    setExtraPreviews([]);
    setExistingExtras([]);
    setExtrasError("");
    setFormError("");
    setCustomCategory("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setFormError("Selecciona un archivo de imagen válido.");
      event.target.value = "";
      return;
    }

    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFormError("");
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    event.target.value = "";
  };

  const handleExtraFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    if (selected.some((selectedFile) => !selectedFile.type.startsWith("image/"))) {
      setExtrasError("Todos los archivos deben ser imágenes válidas.");
      event.target.value = "";
      return;
    }

    const total = existingExtras.length + extraFiles.length + selected.length;
    if (total > 4) {
      setExtrasError(`Puedes añadir hasta 4 fotos extras. Ya tienes ${existingExtras.length + extraFiles.length}.`);
      event.target.value = "";
      return;
    }

    setExtrasError("");
    setExtraFiles((current) => [...current, ...selected]);
    setExtraPreviews((current) => [
      ...current,
      ...selected.map((selectedFile) => URL.createObjectURL(selectedFile)),
    ]);
    event.target.value = "";
  };

  const removeExtraFile = (index: number) => {
    URL.revokeObjectURL(extraPreviews[index]);
    setExtraFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setExtraPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setExtrasError("");
  };

  const removeExistingExtra = (index: number) => {
    setExistingExtras((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setExtrasError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing && !file) {
      setFormError("Añade una imagen de portada antes de publicar.");
      return;
    }

    setSaving(true);
    setFormError("");
    setProgress(0);
    const finalCategory =
      form.category === "otros" ? customCategory.trim() || "otros" : form.category;

    try {
      const uploadedExtras: { url: string; publicId: string }[] = [];
      for (const extraFile of extraFiles) {
        const uploaded = await uploadToCloudinary(extraFile, setProgress);
        uploadedExtras.push(uploaded);
      }
      const finalExtras = [...existingExtras, ...uploadedExtras];

      if (editing) {
        let imageData: { image?: string; publicId?: string } = {};
        if (file) {
          const uploaded = await uploadToCloudinary(file, setProgress);
          imageData = { image: uploaded.url, publicId: uploaded.publicId };
        }
        await updateDoc(doc(db, "gallery", editing.id), {
          ...form,
          category: finalCategory,
          ...imageData,
          extraImages: finalExtras,
        });
      } else {
        if (!file) throw new Error("Missing cover image");
        const uploaded = await uploadToCloudinary(file, setProgress);
        await addDoc(collection(db, "gallery"), {
          ...form,
          category: finalCategory,
          image: uploaded.url,
          publicId: uploaded.publicId,
          order: allItems.length,
          featured: true,
          extraImages: finalExtras,
        });
      }

      closeForm();
    } catch {
      setFormError("No pudimos guardar la ilustración. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnfeature = async (item: GalleryItem) => {
    setTogglingId(item.id);
    setPageError("");
    try {
      await updateDoc(doc(db, "gallery", item.id), { featured: false });
      setItemToUnfeature(null);
    } catch {
      setPageError(`No pudimos quitar "${item.title}" de destacadas.`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <ImagePlus size={14} strokeWidth={1.8} aria-hidden="true" />
            Portada del portafolio
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Destacadas</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Selecciona las piezas que reciben mayor protagonismo en el carrusel principal.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/80 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus size={17} strokeWidth={2} aria-hidden="true" />
          Nueva destacada
        </button>
      </header>

      <section className="admin-dashboard-surface overflow-hidden rounded-[1.6rem] border border-border/80">
        <div className="border-b border-border/70 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Carrusel principal</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {loadState === "loading"
                ? "Actualizando contenido…"
                : `${items.length} ${items.length === 1 ? "pieza visible" : "piezas visibles"}`}
            </p>
          </div>
        </div>

        {pageError && (
          <div className="flex flex-col gap-3 border-b border-amber-500/20 bg-amber-500/5 px-5 py-3 text-xs text-amber-300 sm:flex-row sm:items-center sm:justify-between sm:px-6" role="alert">
            <span>{pageError}</span>
            {loadState === "error" && (
              <button
                type="button"
                onClick={() => setSubscriptionKey((current) => current + 1)}
                className="inline-flex w-fit items-center gap-1.5 font-semibold text-foreground hover:text-primary"
              >
                <RefreshCw size={13} aria-hidden="true" />
                Reintentar
              </button>
            )}
          </div>
        )}

        <div className="p-4 sm:p-5 lg:p-6">
          {loadState === "loading" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Cargando destacadas">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/50">
                  <div className="aspect-[4/3] animate-pulse bg-muted" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-border px-6 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <ImagePlus size={24} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">El carrusel está vacío</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Publica una pieza nueva aquí o activa una existente desde la Galería.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={16} aria-hidden="true" />
                Añadir la primera
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[1.35rem] border border-border/80 bg-card/55 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_48px_color-mix(in_oklab,black_30%,transparent)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-start bg-gradient-to-b from-black/55 to-transparent p-3">
                      <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                        {categoryLabel(item.category)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="min-h-14">
                      <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {item.description || "Sin descripción añadida"}
                      </p>
                      <HashtagLinks value={item.hashtags} limit={4} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Edit2 size={13} aria-hidden="true" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToUnfeature(item)}
                        disabled={togglingId === item.id}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/25 px-3 py-2 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <StarOff size={13} aria-hidden="true" />
                        {togglingId === item.id ? "Quitando…" : "Quitar"}
                      </button>
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="featured-form-title"
            className="admin-dashboard-surface max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] border border-border/80 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border/70 bg-card/90 px-5 py-4 backdrop-blur-xl sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {editing ? "Editar contenido" : "Nueva publicación"}
                </p>
                <h2 id="featured-form-title" className="mt-1 text-lg font-semibold text-foreground">
                  {editing ? "Editar ilustración" : "Nueva ilustración destacada"}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {editing
                    ? "Actualiza la información que aparece en el portafolio."
                    : "Se añadirá a la Galería y al carrusel del Home."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                aria-label="Cerrar formulario"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
              {formError && (
                <p className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}

              <section aria-labelledby="cover-image-label">
                <div className="mb-2 flex items-center justify-between">
                  <label id="cover-image-label" className="text-sm font-medium text-foreground">
                    Imagen de portada {!editing && <span className="text-destructive">*</span>}
                  </label>
                  <span className="text-xs text-muted-foreground">JPG, PNG o WebP</span>
                </div>

                {preview ? (
                  <div className="group/preview relative aspect-video overflow-hidden rounded-2xl border border-border bg-secondary">
                    <img src={preview} alt="Previsualización de portada" className="size-full object-contain" />
                    <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/preview:opacity-100">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-black/65"
                      >
                        <Upload size={13} aria-hidden="true" />
                        Cambiar imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/35 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Upload size={20} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium">Seleccionar imagen</span>
                    <span className="text-xs text-muted-foreground">Haz clic para explorar tus archivos</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {saving && progress > 0 && progress < 100 && (
                  <div className="mt-3" aria-live="polite">
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
                      Subiendo · {Math.round(progress)}%
                    </p>
                  </div>
                )}
              </section>

              <section className="border-t border-border/70 pt-5" aria-labelledby="extra-images-label">
                <div className="mb-3 flex items-center justify-between">
                  <label id="extra-images-label" className="text-sm font-medium text-foreground">
                    Fotos extras
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {existingExtras.length + extraFiles.length}/4
                  </span>
                </div>

                {(existingExtras.length > 0 || extraPreviews.length > 0) && (
                  <div className="mb-3 grid grid-cols-4 gap-2">
                    {existingExtras.map((image, index) => (
                      <div key={image.publicId || image.url} className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
                        <img src={image.url} alt={`Foto extra ${index + 1}`} className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingExtra(index)}
                          className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-lg bg-black/65 text-white backdrop-blur-sm"
                          aria-label={`Quitar foto extra ${index + 1}`}
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    {extraPreviews.map((source, index) => (
                      <div key={source} className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
                        <img src={source} alt={`Nueva foto extra ${index + 1}`} className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExtraFile(index)}
                          className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-lg bg-black/65 text-white backdrop-blur-sm"
                          aria-label={`Quitar nueva foto extra ${index + 1}`}
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {existingExtras.length + extraFiles.length < 4 && (
                  <button
                    type="button"
                    onClick={() => extraFileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    <Plus size={15} aria-hidden="true" />
                    Agregar fotos
                  </button>
                )}
                <input
                  ref={extraFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleExtraFilesChange}
                />
                {extrasError && <p className="mt-2 text-xs text-destructive">{extrasError}</p>}
              </section>

              <section className="grid gap-4 border-t border-border/70 pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="featured-title" className="mb-1.5 block text-sm font-medium text-foreground">
                    Título <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="featured-title"
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    required
                    className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Retrato botánico"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Categoría</label>
                  <CategorySelect
                    categories={CATEGORIES}
                    value={form.category}
                    onChange={(value) => setForm((current) => ({ ...current, category: value }))}
                    customValue={customCategory}
                    onCustomChange={setCustomCategory}
                  />
                </div>

                <div>
                  <label htmlFor="featured-description" className="mb-1.5 block text-sm font-medium text-foreground">
                    Descripción
                  </label>
                  <textarea
                    id="featured-description"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-ring"
                    placeholder="Descripción breve de la ilustración"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Etiquetas</label>
                  <HashtagInput
                    value={form.hashtags}
                    onChange={(hashtags) => setForm((current) => ({ ...current, hashtags }))}
                  />
                </div>
              </section>

              <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editing && !file)}
                  className="min-w-36 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Guardando…" : editing ? "Guardar cambios" : "Publicar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(itemToUnfeature)}
        title="Quitar de destacadas"
        description={`“${itemToUnfeature?.title ?? "Esta ilustración"}” dejará de aparecer en la portada, pero seguirá disponible en Galería.`}
        confirmLabel="Quitar de la portada"
        destructive={false}
        busy={Boolean(itemToUnfeature && togglingId === itemToUnfeature.id)}
        onClose={() => setItemToUnfeature(null)}
        onConfirm={() => {
          if (itemToUnfeature) return handleUnfeature(itemToUnfeature);
        }}
      />
    </div>
  );
}
