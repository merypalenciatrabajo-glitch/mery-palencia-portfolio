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
import { BookOpen, Calendar, Clock, Edit2, Eye, FileText, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminSelect from "@/components/AdminSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  scheduledAt?: string;
  category: string;
  image: string;
  publicId: string;
  author: string;
  published: boolean;
  views?: number;
  videoUrl?: string;
}

type PublishMode = "published" | "draft" | "scheduled";
type LoadState = "loading" | "ready" | "error";

const CATEGORIES = [
  { id: "proceso", label: "Proceso Creativo" },
  { id: "industria", label: "Industria" },
  { id: "tips", label: "Tips & Herramientas" },
  { id: "experiencia", label: "Experiencia" },
];

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content: "",
  category: "proceso",
  author: "Mery Palencia",
  publishMode: "published" as PublishMode,
  scheduledAt: "",
  videoUrl: "",
};

// Formato local datetime-local compatible
function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultScheduledAt() {
  return toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000).toISOString());
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [subscriptionKey, setSubscriptionKey] = useState(0);
  const [pageError, setPageError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Escuchar posts en tiempo real
  useEffect(() => {
    setLoadState("loading");
    setPageError("");
    const q = query(collection(db, "blogPosts"), orderBy("date", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, "id">) })));
        setLoadState("ready");
      },
      () => {
        setLoadState("error");
        setPageError("No pudimos cargar los artículos del blog.");
      },
    );
    return unsub;
  }, [subscriptionKey]);

  // Auto-publicar posts programados cuya fecha ya pasó
  useEffect(() => {
    const now = new Date().toISOString();
    posts.forEach((post) => {
      if (!post.published && post.scheduledAt && post.scheduledAt <= now) {
        updateDoc(doc(db, "blogPosts", post.id), {
          published: true,
          date: post.scheduledAt,
        });
      }
    });
  }, [posts]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setPreview("");
    setShowForm(true);
  };

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    openCreate();
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    let publishMode: PublishMode = post.published ? "published" : post.scheduledAt ? "scheduled" : "draft";
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      author: post.author,
      publishMode,
      scheduledAt: post.scheduledAt ? toDatetimeLocal(post.scheduledAt) : "",
      videoUrl: post.videoUrl || "",
    });
    setPreview(post.image);
    setFile(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFile(null);
    setPreview("");
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { publishMode, scheduledAt, ...rest } = form;
      const isPublished = publishMode === "published";
      const isScheduled = publishMode === "scheduled";
      const scheduledIso = isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
      // Fecha real: si publicado ahora → hoy; si programado → fecha programada; si borrador → hoy
      const date = editing?.date || (isScheduled && scheduledIso ? scheduledIso : new Date().toISOString().split("T")[0]);

      const payload = {
        ...rest,
        date,
        published: isPublished,
        videoUrl: form.videoUrl.trim() || null,
        ...(isScheduled && scheduledIso ? { scheduledAt: scheduledIso } : { scheduledAt: null }),
      };

      if (editing) {
        let imageData: Record<string, string> = {};
        if (file) {
          setUploading(true);
          const { url, publicId } = await uploadToCloudinary(file, setProgress);
          imageData = { image: url, publicId };
          setUploading(false);
        }
        await updateDoc(doc(db, "blogPosts", editing.id), { ...payload, ...imageData });
      } else {
        if (!file) return;
        setUploading(true);
        const { url, publicId } = await uploadToCloudinary(file, setProgress);
        setUploading(false);
        await addDoc(collection(db, "blogPosts"), { ...payload, image: url, publicId, views: 0 });
      }
      closeForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    setDeletingId(post.id);
    try {
      await deleteDoc(doc(db, "blogPosts", post.id));
      setPostToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  // Publicar/despublicar rápido desde la lista
  const togglePublish = async (post: BlogPost) => {
    await updateDoc(doc(db, "blogPosts", post.id), { published: !post.published });
  };

  const getCategoryLabel = (id: string) =>
    CATEGORIES.find((c) => c.id === id)?.label || id;

  const getStatusBadge = (post: BlogPost) => {
    if (post.published) return { label: "Publicado", text: "text-emerald-300", dot: "bg-emerald-400" };
    if (post.scheduledAt) return { label: "Programado", text: "text-sky-300", dot: "bg-sky-400" };
    return { label: "Borrador", text: "text-muted-foreground", dot: "bg-muted-foreground" };
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <FileText size={14} strokeWidth={1.8} aria-hidden="true" />
            Contenido editorial
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Blog</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Redacta, programa y publica historias del proceso creativo.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/80 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus size={17} aria-hidden="true" />
          Nuevo artículo
        </button>
      </header>

      <section className="admin-dashboard-surface overflow-hidden rounded-[1.6rem] border border-border/80">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
          <div><h2 className="text-sm font-semibold text-foreground">Publicaciones</h2><p className="mt-0.5 text-xs text-muted-foreground">{loadState === "loading" ? "Actualizando contenido…" : `${posts.length} artículos`}</p></div>
          <BookOpen size={17} className="text-primary" aria-hidden="true" />
        </div>

        {pageError && (
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/5 px-5 py-3 text-xs text-amber-300 sm:px-6" role="alert">
            <span>{pageError}</span>
            <button type="button" onClick={() => setSubscriptionKey((current) => current + 1)} className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"><RefreshCw size={13} aria-hidden="true" /> Reintentar</button>
          </div>
        )}

        <div className="p-4 sm:p-5 lg:p-6">
        {loadState === "loading" ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex gap-4 rounded-2xl border border-border/70 p-3"><div className="h-24 w-32 animate-pulse rounded-xl bg-muted" /><div className="flex-1 space-y-3 py-2"><div className="h-4 w-2/3 animate-pulse rounded bg-muted" /><div className="h-3 w-1/3 animate-pulse rounded bg-muted" /></div></div>)}</div>
        ) : posts.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-border px-6 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"><FileText size={24} aria-hidden="true" /></span>
            <h3 className="text-base font-semibold text-foreground">Todavía no hay artículos</h3>
            <p className="mt-1 text-sm text-muted-foreground">Crea la primera historia del portafolio.</p>
            <button type="button" onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus size={16} aria-hidden="true" /> Crear artículo</button>
          </div>
        ) : (
          <div className="space-y-3">
          {posts.map((post) => {
            const status = getStatusBadge(post);
            return (
              <article key={post.id} className="rounded-[1.35rem] border border-border/80 bg-card/50 p-3 transition-colors hover:border-primary/20 sm:p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img src={post.image} alt={post.title} loading="lazy" className="aspect-[16/10] w-full rounded-2xl object-cover sm:w-36 sm:shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-primary">
                        <BookOpen size={12} strokeWidth={1.8} aria-hidden="true" />
                        {getCategoryLabel(post.category)}
                      </span>
                      <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium", status.text)}>
                        <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden="true" />
                        {status.label}
                      </span>
                    </div>
                    <h3 className="truncate font-semibold text-foreground">{post.title}</h3>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(post.date).toLocaleDateString("es-ES", { dateStyle: "short" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {post.views ?? 0} lecturas
                      </span>
                      {post.scheduledAt && !post.published && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(post.scheduledAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => togglePublish(post)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      post.published
                        ? "bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        : "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50"
                    )}
                  >
                    {post.published ? "Despublicar" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={`Editar ${post.title}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostToDelete(post)}
                    disabled={deletingId === post.id}
                    className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Eliminar ${post.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
        </div>
      </section>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-5">
          <div role="dialog" aria-modal="true" aria-labelledby="blog-form-title" className="admin-dashboard-surface flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border border-border/80 shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-border/70 bg-card/85 px-5 py-4 backdrop-blur-xl sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {editing ? "Editar contenido" : "Nueva publicación"}
                </p>
                <h2 id="blog-form-title" className="mt-1 text-lg font-semibold text-foreground">
                  {editing ? "Editar artículo" : "Nuevo artículo"}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {editing ? "Actualiza la historia y su estado editorial." : "Prepara una historia para el portafolio."}
                </p>
              </div>
              <button type="button" onClick={closeForm} className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Cerrar formulario">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto p-5 sm:p-6">
              {/* Imagen */}
              <section aria-labelledby="blog-cover-label">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <span id="blog-cover-label">
                  Imagen de portada {!editing && <span className="text-destructive">*</span>}
                  </span>
                </label>
                {preview ? (
                  <div className="group/preview relative mb-2 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-secondary">
                    <img src={preview} alt="Previsualización de portada" className="size-full object-contain" />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(editing?.image || ""); }}
                      className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-xl border border-white/15 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
                      aria-label="Quitar imagen seleccionada"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/35 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  >
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Upload size={20} aria-hidden="true" /></span>
                    <span className="text-sm font-medium">Seleccionar imagen</span>
                    <span className="text-xs text-muted-foreground">JPG, PNG o WebP</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                {uploading && (
                  <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </section>

              {/* Título */}
              <div className="border-t border-border/70 pt-5">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Título <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
                  placeholder="Título del artículo"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Categoría</label>
                <AdminSelect
                  value={form.category}
                  options={CATEGORIES.map((category) => ({ value: category.id, label: category.label }))}
                  onChange={(category) => setForm((current) => ({ ...current, category }))}
                  ariaLabel="Categoría del artículo"
                />
              </div>

              {/* Extracto */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Extracto <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  required
                  rows={2}
                  className="w-full resize-none rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
                  placeholder="Resumen breve del artículo"
                />
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Contenido <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Usa ## para encabezados y líneas en blanco para separar párrafos.
                </p>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  required
                  rows={10}
                  className="w-full resize-none rounded-xl border border-input bg-background/60 px-3 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
                  placeholder="Escribe el contenido del artículo aquí..."
                />
              </div>

              {/* Video YouTube (opcional) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Video de YouTube <span className="text-muted-foreground text-xs">(opcional)</span>
                </label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pega el enlace del video. Puede ser público o no listado.
                </p>
              </div>

              {/* Estado de publicación */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                <div className="flex gap-2">
                  {(["published", "draft", "scheduled"] as PublishMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          publishMode: mode,
                          scheduledAt:
                            mode === "scheduled" && !current.scheduledAt
                              ? defaultScheduledAt()
                              : current.scheduledAt,
                        }))
                      }
                      className={cn(
                        "flex-1 rounded-xl border py-2 text-sm font-medium transition-colors",
                        form.publishMode === mode
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-secondary"
                      )}
                    >
                      {mode === "published" ? "Publicar" : mode === "draft" ? "Borrador" : "Programar"}
                    </button>
                  ))}
                </div>

                {/* Selector de fecha si está programado */}
                {form.publishMode === "scheduled" && (
                  <div className="mt-3">
                    <label className="block text-xs text-muted-foreground mb-1.5">
                      Fecha y hora de publicación
                    </label>
                    <ScheduleDateTimeField
                      value={form.scheduledAt}
                      onChange={(scheduledAt) =>
                        setForm((current) => ({ ...current, scheduledAt }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="sticky -bottom-6 z-10 -mx-5 flex flex-col-reverse gap-2 border-t border-border/70 bg-card/90 px-5 pb-0 pt-4 backdrop-blur-xl sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading || (!editing && !file) || (form.publishMode === "scheduled" && !form.scheduledAt)}
                  className={cn(
                    "min-w-40 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    (saving || uploading) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {saving || uploading ? "Guardando..." : editing ? "Guardar cambios" : "Crear artículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(postToDelete)}
        title="Eliminar artículo"
        description={`“${postToDelete?.title ?? "Este artículo"}” se eliminará definitivamente del blog.`}
        confirmLabel="Eliminar artículo"
        busy={Boolean(postToDelete && deletingId === postToDelete.id)}
        onClose={() => setPostToDelete(null)}
        onConfirm={() => {
          if (postToDelete) return handleDelete(postToDelete);
        }}
      />
    </div>
  );
}

function ScheduleDateTimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const normalized = value || defaultScheduledAt();
  const [datePart, timePart = "00:00"] = normalized.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  const update = (part: "year" | "month" | "day" | "hour" | "minute", next: string) => {
    const nextYear = part === "year" ? next : year;
    const nextMonth = part === "month" ? next : month;
    const maxDay = new Date(Number(nextYear), Number(nextMonth), 0).getDate();
    const nextDay = part === "day" ? next : String(Math.min(Number(day), maxDay)).padStart(2, "0");
    const nextHour = part === "hour" ? next : hour;
    const nextMinute = part === "minute" ? next : minute;
    onChange(`${nextYear}-${nextMonth}-${nextDay}T${nextHour}:${nextMinute}`);
  };

  const numericOptions = (start: number, end: number, suffix = "") =>
    Array.from({ length: end - start + 1 }, (_, index) => {
      const number = start + index;
      const optionValue = String(number).padStart(2, "0");
      return { value: optionValue, label: `${optionValue}${suffix}` };
    });

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <AdminSelect
        value={year}
        options={Array.from({ length: 6 }, (_, index) => ({
          value: String(currentYear + index),
          label: String(currentYear + index),
        }))}
        onChange={(next) => update("year", next)}
        ariaLabel="Año de publicación"
        className="col-span-2 sm:col-span-1"
      />
      <AdminSelect
        value={month}
        options={numericOptions(1, 12)}
        onChange={(next) => update("month", next)}
        ariaLabel="Mes de publicación"
      />
      <AdminSelect
        value={day}
        options={numericOptions(1, daysInMonth)}
        onChange={(next) => update("day", next)}
        ariaLabel="Día de publicación"
      />
      <AdminSelect
        value={hour}
        options={numericOptions(0, 23, " h")}
        onChange={(next) => update("hour", next)}
        ariaLabel="Hora de publicación"
      />
      <AdminSelect
        value={minute}
        options={["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((item) => ({ value: item, label: `${item} min` }))}
        onChange={(next) => update("minute", next)}
        ariaLabel="Minuto de publicación"
      />
    </div>
  );
}
