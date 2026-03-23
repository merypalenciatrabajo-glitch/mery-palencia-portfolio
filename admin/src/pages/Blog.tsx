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
import { Calendar, Clock, Edit2, Eye, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Escuchar posts en tiempo real
  useEffect(() => {
    const q = query(collection(db, "blogPosts"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, "id">) })));
    });
    return unsub;
  }, []);

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

      const payload: Record<string, unknown> = {
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
    if (!confirm(`¿Eliminar "${post.title}"?`)) return;
    setDeletingId(post.id);
    try {
      await deleteDoc(doc(db, "blogPosts", post.id));
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
    if (post.published) return { label: "Publicado", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
    if (post.scheduledAt) return { label: "Programado", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" };
    return { label: "Borrador", cls: "bg-secondary text-muted-foreground" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground mt-1">{posts.length} artículos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Nuevo artículo
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          No hay artículos aún.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const status = getStatusBadge(post);
            return (
              <div key={post.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
                <img src={post.image} alt={post.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {getCategoryLabel(post.category)}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", status.cls)}>
                      {status.label}
                    </span>
                    {post.scheduledAt && !post.published && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(post.scheduledAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-foreground truncate">{post.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(post.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={11} />
                      {post.views ?? 0} lecturas
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle publicar/borrador rápido */}
                  <button
                    onClick={() => togglePublish(post)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                      post.published
                        ? "bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}
                    title={post.published ? "Pasar a borrador" : "Publicar ahora"}
                  >
                    {post.published ? "Despublicar" : "Publicar"}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(post)}
                    disabled={deletingId === post.id}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-foreground">
                {editing ? "Editar artículo" : "Nuevo artículo"}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Imagen de portada {!editing && <span className="text-destructive">*</span>}
                </label>
                {preview ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-secondary mb-2">
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
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
                    className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload size={20} />
                    <span className="text-sm">Subir imagen</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {uploading && (
                  <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Título <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Título del artículo"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
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
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
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
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                      onClick={() => setForm((p) => ({ ...p, publishMode: mode }))}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
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
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                      required={form.publishMode === "scheduled"}
                      className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading || (!editing && !file) || (form.publishMode === "scheduled" && !form.scheduledAt)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
    </div>
  );
}
