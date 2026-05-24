import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  apiCreateEpica,
  apiGetEpicas,
  apiUpdateEpica,
  type Epica,
} from "../../lib/api";
import { Layers, Plus, RefreshCw } from "lucide-react";

export function EpicasConfigSection() {
  const [epicas, setEpicas] = useState<Epica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [nueva, setNueva] = useState({ clave: "", nombre: "", color: "#6366f1" });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiGetEpicas({ todas: true });
      setEpicas(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar épicas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    if (!nueva.clave.trim() || !nueva.nombre.trim()) return;
    setError(null);
    try {
      await apiCreateEpica({
        clave: nueva.clave.trim().toUpperCase(),
        nombre: nueva.nombre.trim(),
        color: nueva.color,
      });
      setNueva({ clave: "", nombre: "", color: "#6366f1" });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la épica");
    }
  }

  async function guardar(ep: Epica, patch: Partial<Epica>) {
    setGuardandoId(ep.id);
    setError(null);
    try {
      await apiUpdateEpica(ep.id, patch);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardandoId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[var(--velo-brand)]" />
          <h2 className="text-lg font-semibold text-[var(--velo-text)]">Épicas de roadmap</h2>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--velo-border)] px-3 py-1.5 text-xs font-semibold text-[var(--velo-text)] hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <p className="max-w-2xl text-sm text-[var(--velo-text-muted)]">
        Las épicas agrupan incidencias en roadmap, cronograma y análisis SLA. Desactiva una épica para
        ocultarla en selectores sin borrar el histórico.
      </p>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => void crear(e)}
        className="grid gap-3 rounded-2xl border border-[var(--velo-border)] bg-white p-4 shadow-sm sm:grid-cols-[1fr_1.5fr_auto_auto_auto]"
      >
        <label className="flex flex-col gap-1 text-[10px] font-medium text-[var(--velo-text-muted)]">
          Clave
          <input
            value={nueva.clave}
            onChange={(e) => setNueva((n) => ({ ...n, clave: e.target.value.toUpperCase() }))}
            placeholder="INFRA"
            maxLength={32}
            className="rounded-lg border border-[var(--velo-border)] px-2.5 py-2 font-mono text-sm uppercase"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-medium text-[var(--velo-text-muted)]">
          Nombre
          <input
            value={nueva.nombre}
            onChange={(e) => setNueva((n) => ({ ...n, nombre: e.target.value }))}
            placeholder="Infraestructura"
            maxLength={120}
            className="rounded-lg border border-[var(--velo-border)] px-2.5 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-medium text-[var(--velo-text-muted)]">
          Color
          <input
            type="color"
            value={nueva.color}
            onChange={(e) => setNueva((n) => ({ ...n, color: e.target.value }))}
            className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--velo-border)]"
          />
        </label>
        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--velo-brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--velo-brand-hover)] sm:w-auto"
          >
            <Plus size={16} />
            Crear épica
          </button>
        </div>
      </form>

      {loading && epicas.length === 0 ? (
        <div className="h-32 animate-pulse rounded-2xl border border-[var(--velo-border)] bg-slate-100" />
      ) : (
        <ul className="divide-y divide-[var(--velo-border)] overflow-hidden rounded-2xl border border-[var(--velo-border)] bg-white shadow-sm">
          {epicas.map((ep) => (
            <li key={ep.id} className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_1.5fr_auto] sm:items-center">
              <input
                type="color"
                value={ep.color}
                disabled={guardandoId === ep.id}
                onChange={(e) => void guardar(ep, { color: e.target.value })}
                className="size-9 cursor-pointer rounded-lg border border-[var(--velo-border)]"
                aria-label={`Color de ${ep.clave}`}
              />
              <input
                defaultValue={ep.clave}
                disabled={guardandoId === ep.id}
                onBlur={(e) => {
                  const v = e.target.value.trim().toUpperCase();
                  if (v && v !== ep.clave) void guardar(ep, { clave: v });
                }}
                className="rounded-lg border border-[var(--velo-border)] px-2.5 py-2 font-mono text-sm uppercase"
              />
              <input
                defaultValue={ep.nombre}
                disabled={guardandoId === ep.id}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== ep.nombre) void guardar(ep, { nombre: v });
                }}
                className="rounded-lg border border-[var(--velo-border)] px-2.5 py-2 text-sm"
              />
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--velo-text-muted)]">
                <input
                  type="checkbox"
                  checked={ep.activa}
                  disabled={guardandoId === ep.id}
                  onChange={(e) => void guardar(ep, { activa: e.target.checked })}
                />
                Activa
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
