import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import { Settings } from "lucide-react";

type Equipo = { codigo: string; nombre: string };

export function ConfigPanel() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(apiUrl("/api/equipos"), { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Error al cargar equipos");
        setEquipos(data.items ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          <Settings size={14} />
          Configuración
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Equipos de gestión</h1>
        <p className="mt-1 text-sm text-slate-600">
          Catálogo de equipos usado en el portal y el tablero Kanban. Los cambios en BD se
          aplican con <code className="rounded bg-slate-100 px-1">npm run db:equipos</code>.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {equipos.map((e) => (
            <li key={e.codigo} className="flex items-center justify-between px-5 py-3.5">
              <span className="font-mono text-sm font-bold text-indigo-700">{e.codigo}</span>
              <span className="text-sm text-slate-700">{e.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
