import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface CommissionTier {
  id: string;
  name: string;
  price: string;
  priceAmount?: number;
  priceCurrency?: 'COP' | 'USD';
  description: string;
  includes: string[];
  featured: boolean;
  order: number;
}

interface ProcessStep {
  id: string;
  number: string;
  title: string;
  description: string;
  order: number;
}

const EMPTY_TIER: Omit<CommissionTier, "id"> = {
  name: "",
  price: "",
  priceAmount: undefined,
  priceCurrency: "COP",
  description: "",
  includes: [""],
  featured: false,
  order: 0,
};

// Tasa de conversión aproximada (1 USD = 4100 COP)
const COP_TO_USD = 4100;

function formatPrice(amount: number | undefined, currency: 'COP' | 'USD'): string {
  if (!amount) return 'Consultar';
  if (currency === 'COP') {
    const usd = Math.round(amount / COP_TO_USD);
    return `${amount.toLocaleString('es-CO')} COP (~$${usd} USD)`;
  } else {
    const cop = Math.round(amount * COP_TO_USD);
    return `$${amount} USD (~${cop.toLocaleString('es-CO')} COP)`;
  }
}

const EMPTY_STEP: Omit<ProcessStep, "id"> = {
  number: "1",
  title: "",
  description: "",
  order: 0,
};

export default function Commissions() {
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "commissions"), orderBy("order", "asc"));
    const unsub1 = onSnapshot(q, (snap) => {
      setTiers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommissionTier, "id">) })));
    });
    const q2 = query(collection(db, "processSteps"), orderBy("order", "asc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      setSteps(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProcessStep, "id">) })));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  // ── Crear tier nuevo ────────────────────────────────────────────────────────
  const openCreateTier = () => {
    setEditingTier({ id: "__new__", ...EMPTY_TIER, order: tiers.length });
  };

  // ── Guardar tier ────────────────────────────────────────────────────────────
  const saveTier = async (tier: CommissionTier) => {
    setSaving(true);
    try {
      const price = formatPrice(tier.priceAmount, tier.priceCurrency ?? 'COP');
      const data = { ...tier, price };
      if (tier.id === "__new__") {
        const { id, ...rest } = data;
        await addDoc(collection(db, "commissions"), rest);
      } else {
        const { id, ...rest } = data;
        await setDoc(doc(db, "commissions", id), rest);
      }
      setEditingTier(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar tier ───────────────────────────────────────────────────────────
  const deleteTier = async (tier: CommissionTier) => {
    if (!confirm(`¿Eliminar el tier "${tier.name}"?`)) return;
    setDeletingId(tier.id);
    try {
      await deleteDoc(doc(db, "commissions", tier.id));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Crear paso nuevo ────────────────────────────────────────────────────────
  const openCreateStep = () => {
    setEditingStep({
      id: "__new__",
      ...EMPTY_STEP,
      number: String(steps.length + 1),
      order: steps.length,
    });
  };

  // ── Guardar paso ────────────────────────────────────────────────────────────
  const saveStep = async (step: ProcessStep) => {
    setSaving(true);
    try {
      if (step.id === "__new__") {
        const { id, ...data } = step;
        await addDoc(collection(db, "processSteps"), data);
      } else {
        const { id, ...data } = step;
        await setDoc(doc(db, "processSteps", id), data);
      }
      setEditingStep(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar paso ───────────────────────────────────────────────────────────
  const deleteStep = async (step: ProcessStep) => {
    if (!confirm(`¿Eliminar el paso "${step.title}"?`)) return;
    setDeletingId(step.id);
    try {
      await deleteDoc(doc(db, "processSteps", step.id));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle featured ─────────────────────────────────────────────────────────
  const toggleFeatured = async (tier: CommissionTier) => {
    await updateDoc(doc(db, "commissions", tier.id), { featured: !tier.featured });
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comisiones</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los tiers de comisiones y los pasos del proceso creativo
        </p>
      </div>

      {/* ── Tiers ─────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-lg font-semibold text-foreground">Niveles de Comisiones</h2>
          <button
            onClick={openCreateTier}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} /> Nuevo tier
          </button>
        </div>

        {tiers.length === 0 && (
          <p className="text-muted-foreground text-sm py-4">
            No hay tiers aún. Crea el primero con el botón de arriba.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "bg-card border rounded-xl p-5 space-y-3",
                tier.featured ? "border-primary" : "border-border"
              )}
            >
              {tier.featured && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Destacado
                </span>
              )}
              <div>
                <p className="font-semibold text-foreground">{tier.name}</p>
                <p className="text-primary font-bold text-lg">{tier.price}</p>
              </div>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
              <ul className="space-y-1">
                {tier.includes.map((item, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => setEditingTier({ ...tier })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors text-foreground"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  onClick={() => toggleFeatured(tier)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    tier.featured
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {tier.featured ? "Quitar destacado" : "Destacar"}
                </button>
                <button
                  onClick={() => deleteTier(tier)}
                  disabled={deletingId === tier.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pasos del proceso ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-lg font-semibold text-foreground">Pasos del Proceso Creativo</h2>
          <button
            onClick={openCreateStep}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} /> Nuevo paso
          </button>
        </div>

        {steps.length === 0 && (
          <p className="text-muted-foreground text-sm py-4">
            No hay pasos aún. Crea el primero con el botón de arriba.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <div key={step.id} className="bg-card border border-border rounded-xl p-5 space-y-2">
              <span className="text-3xl font-bold text-primary/30">{step.number}</span>
              <p className="font-semibold text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditingStep({ ...step })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-colors text-foreground"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  onClick={() => deleteStep(step)}
                  disabled={deletingId === step.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modal tier ────────────────────────────────────────────────────── */}
      {editingTier && (
        <TierModal
          tier={editingTier}
          saving={saving}
          isNew={editingTier.id === "__new__"}
          onChange={setEditingTier}
          onSave={() => saveTier(editingTier)}
          onClose={() => setEditingTier(null)}
        />
      )}

      {/* ── Modal paso ────────────────────────────────────────────────────── */}
      {editingStep && (
        <StepModal
          step={editingStep}
          saving={saving}
          isNew={editingStep.id === "__new__"}
          onChange={setEditingStep}
          onSave={() => saveStep(editingStep)}
          onClose={() => setEditingStep(null)}
        />
      )}
    </div>
  );
}

// ─── Modal Tier ───────────────────────────────────────────────────────────────

function TierModal({
  tier,
  saving,
  isNew,
  onChange,
  onSave,
  onClose,
}: {
  tier: CommissionTier;
  saving: boolean;
  isNew: boolean;
  onChange: (t: CommissionTier) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const updateIncludes = (index: number, value: string) => {
    const updated = [...tier.includes];
    updated[index] = value;
    onChange({ ...tier, includes: updated });
  };

  const addInclude = () => onChange({ ...tier, includes: [...tier.includes, ""] });
  const removeInclude = (i: number) =>
    onChange({ ...tier, includes: tier.includes.filter((_, idx) => idx !== i) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-foreground">{isNew ? "Nuevo tier" : "Editar tier"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <Field label="Nombre">
            <input
              type="text"
              value={tier.name}
              onChange={(e) => onChange({ ...tier, name: e.target.value })}
              className={inputCls}
              placeholder="Ej: Básico"
            />
          </Field>
          <Field label="Precio">
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={tier.priceAmount ?? ''}
                onChange={(e) => onChange({ ...tier, priceAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                className={cn(inputCls, "flex-1")}
                placeholder="Vacío = Consultar"
              />
              <select
                value={tier.priceCurrency ?? 'COP'}
                onChange={(e) => onChange({ ...tier, priceCurrency: e.target.value as 'COP' | 'USD' })}
                className="px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {(tier.priceAmount ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Se mostrará como: {formatPrice(tier.priceAmount, tier.priceCurrency ?? 'COP')}
              </p>
            )}
          </Field>
          <Field label="Descripción">
            <textarea
              value={tier.description}
              onChange={(e) => onChange({ ...tier, description: e.target.value })}
              rows={3}
              className={cn(inputCls, "resize-none")}
              placeholder="Descripción breve del tier"
            />
          </Field>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Incluye</label>
            <div className="space-y-2">
              {tier.includes.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateIncludes(i, e.target.value)}
                    className={cn(inputCls, "flex-1")}
                    placeholder="Ej: 1 personaje"
                  />
                  <button
                    type="button"
                    onClick={() => removeInclude(i)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addInclude}
                className="text-sm text-primary hover:underline"
              >
                + Agregar ítem
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              saving && "opacity-60 cursor-not-allowed"
            )}
          >
            <Save size={15} />
            {saving ? "Guardando..." : isNew ? "Crear" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Step ───────────────────────────────────────────────────────────────

function StepModal({
  step,
  saving,
  isNew,
  onChange,
  onSave,
  onClose,
}: {
  step: ProcessStep;
  saving: boolean;
  isNew: boolean;
  onChange: (s: ProcessStep) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            {isNew ? "Nuevo paso" : `Editar paso ${step.number}`}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Número">
            <input
              type="text"
              value={step.number}
              onChange={(e) => onChange({ ...step, number: e.target.value })}
              className={inputCls}
              placeholder="Ej: 01"
            />
          </Field>
          <Field label="Título">
            <input
              type="text"
              value={step.title}
              onChange={(e) => onChange({ ...step, title: e.target.value })}
              className={inputCls}
              placeholder="Ej: Consulta inicial"
            />
          </Field>
          <Field label="Descripción">
            <textarea
              value={step.description}
              onChange={(e) => onChange({ ...step, description: e.target.value })}
              rows={3}
              className={cn(inputCls, "resize-none")}
              placeholder="Descripción del paso"
            />
          </Field>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              saving && "opacity-60 cursor-not-allowed"
            )}
          >
            <Save size={15} />
            {saving ? "Guardando..." : isNew ? "Crear" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
