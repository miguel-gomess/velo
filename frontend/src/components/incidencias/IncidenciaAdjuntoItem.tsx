import { useRef, useState } from "react";
import {
  apiActualizarIncidenciaAdjunto,
  apiAssetUrl,
  apiEliminarIncidenciaAdjunto,
  type IncidenciaAdjunto,
} from "../../lib/api";
import { validarImagen } from "../../lib/imagenes";
import { AuthImage } from "../AuthImage";
import { ConfirmDialog } from "../ConfirmDialog";
import { Check, Eye, Loader2, Pencil, Trash2, Upload, X } from "lucide-react";

type Props = {
  incidenciaId: number;
  adjunto: IncidenciaAdjunto;
  puedeGestionar: boolean;
  onActualizado: (item: IncidenciaAdjunto) => void;
  onEliminado: (id: number) => void;
  onVer: (url: string) => void;
  onError?: (msg: string) => void;
};

export function IncidenciaAdjuntoItem({
  incidenciaId,
  adjunto,
  puedeGestionar,
  onActualizado,
  onEliminado,
  onVer,
  onError,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(adjunto.nombre_original);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const url = apiAssetUrl(adjunto.imagen_url);

  async function guardar(nuevaImagen?: File) {
    setGuardando(true);
    try {
      const { item } = await apiActualizarIncidenciaAdjunto(incidenciaId, adjunto.id, {
        nombre_original: nombre.trim() || adjunto.nombre_original,
        imagen: nuevaImagen,
      });
      onActualizado(item);
      setEditando(false);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminacion() {
    setEliminando(true);
    try {
      await apiEliminarIncidenciaAdjunto(incidenciaId, adjunto.id);
      setConfirmarEliminar(false);
      onEliminado(adjunto.id);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "No se pudo eliminar");
      setEliminando(false);
    }
  }

  if (editando) {
    return (
      <div className="w-full min-w-[12rem] max-w-xs rounded-lg border border-[var(--velo-border)] bg-white p-3 shadow-sm">
        <label className="text-[10px] font-bold uppercase text-[var(--velo-text-subtle)]">
          Nombre del archivo
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--velo-border)] px-2 py-1.5 text-xs"
          maxLength={255}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={guardando}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--velo-border)] px-2 py-1 text-[10px] font-semibold hover:bg-[var(--velo-bg)]"
          >
            <Upload size={12} />
            Reemplazar imagen
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const err = validarImagen(file);
              if (err) {
                onError?.(err);
                return;
              }
              void guardar(file);
            }}
          />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            disabled={guardando}
            onClick={() => {
              setNombre(adjunto.nombre_original);
              setEditando(false);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-[var(--velo-text-muted)] hover:bg-[var(--velo-bg)]"
          >
            <X size={12} />
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando || !nombre.trim()}
            onClick={() => void guardar()}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--velo-brand)] px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
          >
            {guardando ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onVer(url)}
        disabled={eliminando}
        className="relative size-20 overflow-hidden rounded-md border border-[var(--velo-border)] bg-[var(--velo-bg)] shadow-[var(--velo-shadow)] disabled:opacity-50"
        title={adjunto.nombre_original}
      >
        <AuthImage
          src={url}
          alt={adjunto.nombre_original}
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-[#091e42]/0 opacity-0 transition-opacity group-hover:bg-[#091e42]/40 group-hover:opacity-100">
          <Eye size={16} className="text-white" />
        </span>
      </button>
      {puedeGestionar && (
        <div className="absolute -right-1 -top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="rounded-full border border-[var(--velo-border)] bg-white p-1 text-[var(--velo-text-muted)] shadow hover:text-[var(--velo-brand)]"
            aria-label="Editar adjunto"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmarEliminar(true)}
            disabled={eliminando}
            className="rounded-full border border-[var(--velo-border)] bg-white p-1 text-rose-600 shadow hover:bg-rose-50 disabled:opacity-50"
            aria-label="Eliminar adjunto"
          >
            {eliminando ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Trash2 size={11} />
            )}
          </button>
        </div>
      )}
      <p className="mt-1 max-w-[5rem] truncate text-[9px] text-[var(--velo-text-subtle)]">
        {adjunto.nombre_original}
      </p>

      <ConfirmDialog
        open={confirmarEliminar}
        title="Eliminar adjunto"
        description={
          <>
            ¿Seguro que quieres eliminar <strong>{adjunto.nombre_original}</strong>? Esta acción no se
            puede deshacer.
          </>
        }
        loading={eliminando}
        onCancel={() => !eliminando && setConfirmarEliminar(false)}
        onConfirm={() => void confirmarEliminacion()}
      />
    </div>
  );
}
