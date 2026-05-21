import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  adjuntarImagenesPendientesADescripcion,
  DescripcionEditor,
  type ImagenPendiente,
} from "../incidencias/DescripcionEditor";
import {
  apiCreateIncidencia,
  apiUpdateIncidencia,
} from "../../lib/api";
import {
  PORTAL_CATEGORIAS,
  categoriaPorId,
  equipoCodigoDesdeCategoria,
  type PortalCategoria,
} from "../../lib/portalCategorias";
import { PrioridadIncidenciaSelector } from "../incidencias/selectors/PrioridadIncidenciaSelector";

type Props = {
  categoriaInicial?: string;
  onCreada: (incidenciaId: number) => void;
  onReload: () => Promise<void>;
};

export function PortalNuevaSolicitudForm({
  categoriaInicial,
  onCreada,
  onReload,
}: Props) {
  const [categoriaId, setCategoriaId] = useState(
    categoriaInicial && categoriaPorId(categoriaInicial)
      ? categoriaInicial
      : PORTAL_CATEGORIAS[0].id,
  );
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [imagenesPendientes, setImagenesPendientes] = useState<ImagenPendiente[]>([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const categoria = categoriaPorId(categoriaId) ?? PORTAL_CATEGORIAS[0];

  useEffect(() => {
    if (categoriaInicial && categoriaPorId(categoriaInicial)) {
      setCategoriaId(categoriaInicial);
    }
  }, [categoriaInicial]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const titulo = asunto.trim();
    const cuerpo = descripcion.trim();
    if (!titulo || (!cuerpo && imagenesPendientes.length === 0)) {
      setFormError("Indica un asunto y describe tu solicitud.");
      return;
    }

    setCreating(true);
    setFormError(null);
    setExito(null);

    const descripcionBase = `Categoría: ${categoria.label}\nEquipo: ${categoria.equipoGestion}\n---\n${cuerpo || " "}`;

    try {
      const { item } = await apiCreateIncidencia({
        titulo: titulo.slice(0, 280),
        descripcion: descripcionBase,
        equipo_codigo: equipoCodigoDesdeCategoria(categoriaId),
        prioridad: prioridad.trim() || "media",
      });
      if (imagenesPendientes.length > 0) {
        const descConImg = await adjuntarImagenesPendientesADescripcion(
          item.id,
          descripcionBase,
          imagenesPendientes,
        );
        await apiUpdateIncidencia(item.id, { descripcion: descConImg });
        for (const p of imagenesPendientes) URL.revokeObjectURL(p.preview);
      }
      setAsunto("");
      setDescripcion("");
      setPrioridad("media");
      setImagenesPendientes([]);
      setExito(`Solicitud VEL-${item.id} registrada. El equipo ${categoria.equipoGestion} la revisará pronto.`);
      await onReload();
      onCreada(item.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="portal-animate-in portal-stagger-2 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <PanelIntro categoria={categoria} />
      <form onSubmit={onSubmit} className="portal-card p-6 sm:p-8">
        <fieldset>
          <legend className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--velo-text-subtle)]">
            ¿De qué se trata?
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PORTAL_CATEGORIAS.map((cat) => {
              const Icon = cat.icon;
              const activa = categoriaId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaId(cat.id)}
                  className={`group relative flex items-start gap-3 overflow-hidden rounded-xl border-2 p-3.5 text-left transition-all duration-200 ${
                    activa
                      ? "border-transparent shadow-md"
                      : "border-[var(--velo-border)] bg-white hover:border-slate-300"
                  }`}
                  style={
                    activa
                      ? {
                          background: `linear-gradient(135deg, ${cat.accentSoft} 0%, #fff 100%)`,
                          boxShadow: `0 4px 20px ${cat.accent}22`,
                        }
                      : undefined
                  }
                >
                  {activa && (
                    <span
                      className="absolute left-0 top-0 h-full w-1 rounded-r"
                      style={{ backgroundColor: cat.accent }}
                    />
                  )}
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: activa ? cat.accent : cat.accentSoft,
                      color: activa ? "#fff" : cat.accent,
                    }}
                  >
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--velo-text)]">{cat.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-[var(--velo-text-muted)]">
                      {cat.descripcion}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--velo-text-subtle)]">
              Asunto
            </label>
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej. Solicitud de monitor para teletrabajo"
              className="w-full rounded-xl border-2 border-[var(--velo-border)] bg-slate-50/50 px-4 py-3 text-sm font-medium transition focus:border-[var(--velo-brand)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--velo-brand-muted)]"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--velo-text-subtle)]">
              Descripción
            </label>
            <DescripcionEditor
              value={descripcion}
              onChange={setDescripcion}
              imagenesPendientes={imagenesPendientes}
              onImagenesPendientesChange={setImagenesPendientes}
              onError={(msg) => setFormError(msg)}
              placeholder="Describe con detalle: qué ocurre, desde cuándo, ubicación, urgencia…"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--velo-text-subtle)]">
              Prioridad
              <span className="ml-1.5 font-normal normal-case text-[var(--velo-text-muted)]">
                (opcional)
              </span>
            </label>
            <PrioridadIncidenciaSelector
              value={prioridad}
              onChange={setPrioridad}
              permitirTodos={false}
              disabled={creating}
            />
            <p className="mt-1.5 text-[11px] text-[var(--velo-text-subtle)]">
              Si no la cambias, se aplicará prioridad <strong className="font-semibold">media</strong>.
            </p>
          </div>
        </div>

        {formError && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle size={18} />
            {formError}
          </p>
        )}
        {exito && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CheckCircle2 size={18} />
            {exito}
          </p>
        )}

        <button
          type="submit"
          disabled={creating}
          className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--velo-brand)] to-[#0747a6] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60"
        >
          {creating ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Enviar solicitud
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function PanelIntro({ categoria }: { categoria: PortalCategoria }) {
  return (
    <div className="portal-card relative overflow-hidden p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-40 blur-3xl"
        style={{ background: categoria.accentSoft }}
      />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--velo-brand-muted)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--velo-brand)]">
          <Sparkles size={12} />
          Rápido y sencillo
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--velo-text)] sm:text-3xl">
          Cuéntanos qué necesitas
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--velo-text-muted)]">
          Elige el área, describe el problema y el equipo adecuado recibirá tu solicitud. Podrás seguir el
          estado y chatear desde «Mis solicitudes».
        </p>
        <ol className="mt-8 space-y-4">
          {[
            "Selecciona el área (IT, RRHH, Finanzas…)",
            "Resume el asunto en una línea",
            "Añade detalles para agilizar la resolución",
          ].map((paso, i) => (
            <li key={paso} className="flex gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--velo-brand)] text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5 text-[var(--velo-text-muted)]">{paso}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
