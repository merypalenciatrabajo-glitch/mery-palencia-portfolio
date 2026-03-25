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
import { Edit2, Plus, StarOff, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface GalleryItem {
  id: string;
  title: string;
  image: string;
  publicId: string;
  category: string;
  description: string;
  order: number;
  extraImages?: { url: string; publicId: string }[];
}

const CATEGORIES = ["personajes", "escenarios", "props", "abstracto", "otro"];

const EMPTY_FORM = {
  title: "",
  category: "personajes",
  description: "",
};

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);

  // Extra images state
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [extraPreviews, setExtraPreviews] = useState<string[]>([]);
  const [existingExtras, setExistingExtras] = useState<{ url: string; publicId: string }[]>([]);
  const [extrasError, setExtrasError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, "id">) }))
      );
    });
    return unsub;
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setPreview("");
    setExtraFiles([]);
    setExtraPreviews([]);
    setExistingExtras([]);
    setExtrasError("");
    setShowForm(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setForm({ title: item.title, category: item.category, description: item.description });
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
    try {
      // Upload new extra files
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
          ...imageData,
          extraImages: finalExtras,
        });
      } else {
        if (!file) return;
        const { url, publicId } = await uploadToCloudinary(file, setProgress);
        await addDoc(collection(db, "gallery"), {
          ...form,
          image: url,
          publicId,
          order: items.length,
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

  const handleUnfeature = async (item: GalleryItem) => {
    if (!confirm(`¿Quitar "${item.title}" de destacadas?`)) return;
    setDeletingId(item.id);
    try {
      await deleteDoc(doc(db, "gallery", item.id));
    } finally {
      setDeletingId(null);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Destacadas</h1>
          <p className="text-muted-foreground mt-1">Imágenes del carrusel del Home · {items.length} ilustraciones</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Nueva ilustración
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          No hay ilustraciones aún. Sube la primera.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <img src={item.image} alt={item.title} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground capitalize mb-2">{item.category}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-border rounded-lg text-xs text-foreground hover:bg-secondary transition-colors"
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleUnfeature(item)}
                    disabled={deletingId === item.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-yellow-300 rounded-lg text-xs text-yellow-600 hover:bg-yellow-50 transition-colors disabled:opacity-50"
                  >
                    <StarOff size={12} /> Quitar
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="p-1.5 border border-destructive/30 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {editing ? "Editar ilustración" : "Nueva ilustración"}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Foto de portada {!editing && <span className="text-destructive">*</span>}
                </label>
                {preview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary mb-2">
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
                    className="w-full aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
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

              {/* Fotos extras */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Fotos extras <span className="text-muted-foreground font-normal">(máx. 4)</span>
                </label>

                {/* Thumbnails grid */}
                {(existingExtras.length > 0 || extraPreviews.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {existingExtras.map((img, i) => (
                      <div key={`existing-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary">
                        <img src={img.url} alt={`extra ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingExtra(i)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {extraPreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary">
                        <img src={src} alt={`nueva ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExtraFile(i)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white"
                        >
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
                    className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload size={14} />
                    Agregar fotos
                  </button>
                )}
                <input
                  ref={extraFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleExtraFilesChange}
                />
                {extrasError && (
                  <p className="text-xs text-destructive mt-1">{extrasError}</p>
                )}
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
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ej: Retrato Botánico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Descripción breve de la ilustración"
                />
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
                  disabled={saving || (!editing && !file)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
