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
import { BriefcaseBusiness, Check, Edit2, ListChecks, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [stepsLoading, setStepsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "commissions"), orderBy("order", "asc"));
    const unsub1 = onSnapshot(q, (snap) => {
      setTiers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommissionTier, "id">) })));
      setTiersLoading(false);
    }, () => {
      setTiersLoading(false);
      setPageError("No pudimos cargar todos los datos de comisiones.");
    });
    const q2 = query(collection(db, "processSteps"), orderBy("order", "asc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      setSteps(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProcessStep, "id">) })));
      setStepsLoading(false);
    }, () => {
      setStepsLoading(false);
      setPageError("No pudimos cargar todos los datos de comisiones.");
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  // ── Crear tier nuevo ────────────────────────────────────────────────────────
  const openCreateTier = () => {
    setEditingTier({ id: "__new__", ...EMPTY_TIER, order: tiers.length });
  };

  useEffect(() => {
    if (searchParams.get("action") !== "create-tier" || tiersLoading) return;
    openCreateTier();
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, tiers.length, tiersLoading]);

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
    if (!confirm(`¿Eliminar el servicio "${tier.name}"?`)) return;
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
    <div className="space-y-6 md:space-y-8">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <BriefcaseBusiness size={14} strokeWidth={1.8} aria-hidden="true" />
          Servicios creativos
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Comisiones</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Gestiona los servicios de comisiones y los pasos del proceso creativo
        </p>
      </header>

      {pageError && <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300" role="alert">{pageError}</p>}

      <section className="admin-dashboard-surface overflow-hidden rounded-[1.6rem] border border-border/80">
        <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-sm font-semibold text-foreground">Niveles de comisiones</h2><p className="mt-0.5 text-xs text-muted-foreground">{tiersLoading ? "Actualizando servicios…" : `${tiers.length} opciones disponibles`}</p></div>
          <button
            type="button"
            onClick={openCreateTier}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/80 bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            <Plus size={15} aria-hidden="true" /> Nuevo nivel
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 lg:p-6 xl:grid-cols-3">
          {tiersLoading && Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-[1.35rem] border border-border/70 bg-muted/50" />)}
          {!tiersLoading && tiers.length === 0 && <div className="col-span-full flex min-h-64 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-border text-center"><BriefcaseBusiness size={24} className="mb-3 text-primary" /><h3 className="font-semibold text-foreground">No hay niveles configurados</h3><p className="mt-1 text-sm text-muted-foreground">Crea la primera opción de comisión.</p></div>}
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={cn(
                "flex min-h-64 flex-col rounded-[1.35rem] border bg-card/50 p-5",
                tier.featured ? "border-primary/35" : "border-border/80"
              )}
            >
              {tier.featured && (
                <span className="mb-3 w-fit rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  Destacado
                </span>
              )}
              <div>
                <h3 className="font-semibold text-foreground">{tier.name}</h3>
                <p className="mt-1 text-lg font-semibold text-primary">{tier.price}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tier.description}</p>
              <ul className="mt-4 flex-1 space-y-2 border-t border-border/70 pt-4">
                {tier.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <Check size={13} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTier({ ...tier })}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => toggleFeatured(tier)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                    tier.featured
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {tier.featured ? "Quitar destacado" : "Destacar"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteTier(tier)}
                  disabled={deletingId === tier.id}
                  className="flex size-8 items-center justify-center rounded-xl border border-destructive/25 text-destructive transition-colors hover:bg-destructive/10"
                  aria-label={`Eliminar ${tier.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-dashboard-surface overflow-hidden rounded-[1.6rem] border border-border/80">
        <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-sm font-semibold text-foreground">Proceso creativo</h2><p className="mt-0.5 text-xs text-muted-foreground">{stepsLoading ? "Actualizando proceso…" : `${steps.length} pasos configurados`}</p></div>
          <button
            type="button"
            onClick={openCreateStep}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/80 bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            <Plus size={15} /> Nuevo paso
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:p-6 xl:grid-cols-3">
          {stepsLoading && Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[1.35rem] border border-border/70 bg-muted/50" />)}
          {!stepsLoading && steps.length === 0 && <div className="col-span-full flex min-h-56 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-border text-center"><ListChecks size={24} className="mb-3 text-primary" /><h3 className="font-semibold text-foreground">No hay pasos configurados</h3></div>}
          {steps.map((step) => (
            <article key={step.id} className="rounded-[1.35rem] border border-border/80 bg-card/50 p-5">
              <span className="text-3xl font-semibold tabular-nums text-primary/35">{step.number}</span>
              <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 min-h-10 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              <div className="mt-4 flex gap-2 border-t border-border/70 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStep({ ...step })}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => deleteStep(step)}
                  disabled={deletingId === step.id}
                  className="flex size-8 items-center justify-center rounded-xl border border-destructive/25 text-destructive transition-colors hover:bg-destructive/10"
                  aria-label={`Eliminar ${step.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-5">
      <div role="dialog" aria-modal="true" aria-labelledby="commission-form-title" className="admin-dashboard-surface flex max-h-[92vh] w-full max-w-lg flex-col rounded-[1.75rem] border border-border/80 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
          <h2 id="commission-form-title" className="font-semibold text-foreground">{isNew ? "Nuevo servicio" : "Editar servicio"}</h2>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Cerrar formulario">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
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
                className="rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              placeholder="Descripción breve del servicio"
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
        <div className="flex shrink-0 gap-3 border-t border-border/70 px-5 py-4 sm:px-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-5">
      <div role="dialog" aria-modal="true" aria-labelledby="process-step-form-title" className="admin-dashboard-surface w-full max-w-md rounded-[1.75rem] border border-border/80 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
          <h2 id="process-step-form-title" className="font-semibold text-foreground">
            {isNew ? "Nuevo paso" : `Editar paso ${step.number}`}
          </h2>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Cerrar formulario">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
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
        <div className="flex gap-3 border-t border-border/70 px-5 py-4 sm:px-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
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
  "w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
