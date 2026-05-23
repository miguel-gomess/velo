import { memo, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { apiAssetUrl, type Incidencia, type Usuario } from "../../lib/api";
import { AuthImage } from "../AuthImage";
import { CopiarEnlaceIncidenciaButton } from "./CopiarEnlaceIncidenciaButton";
import {
  KANBAN_COLUMNAS,
  KANBAN_TEMAS,
  labelEstado,
  normalizarEstado,
  prioridadTone,
  type EstadoKanban,
} from "../../lib/incidencias";
import { puedeMoverIncidenciaEnTablero } from "../../lib/equipos";
import {
  GripVertical,
  Image as ImageIcon,
  Inbox,
  Lock,
} from "lucide-react";
type Props = {
  items: Incidencia[];
  me: Usuario;
  esAdmin?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  sinLeerPorIncidencia?: Record<number, number>;
  onOpen: (inc: Incidencia) => void;
  onMove: (id: number, estado: EstadoKanban) => void | Promise<void>;
};

function columnMeta(colId: EstadoKanban) {
  const col = KANBAN_COLUMNAS.find((c) => c.id === colId);
  return {
    label: col?.label ?? labelEstado(colId),
    theme: KANBAN_TEMAS[colId],
  };
}

function formatFechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function CardFilaPersona({
  etiqueta,
  nombre,
  extra,
}: {
  etiqueta: string;
  nombre?: string | null;
  extra?: string | null;
}) {
  return (
    <p className="truncate text-[11px] leading-snug">
      <span className="font-semibold text-[var(--velo-text-subtle)]">{etiqueta}</span>
      <span className="text-[var(--velo-text-subtle)]"> · </span>
      {nombre ? (
        <>
          <span className="font-medium text-[var(--velo-text)]">{nombre}</span>
          {extra ? (
            <span className="text-[var(--velo-text-subtle)]"> ({extra})</span>
          ) : null}
        </>
      ) : (
        <span className="italic text-[var(--velo-text-subtle)]">Sin asignar</span>
      )}
    </p>
  );
}

function primeraImagenDesdeDescripcion(descripcion: string): string | null {
  const m = /!\[[^\]]*\]\(([^)]+)\)/.exec(descripcion);
  return m?.[1] ?? null;
}

function CardLayout({
  inc,
  me,
  columnColor,
  onClick,
  isDragging,
  isOverlay,
  readOnly,
  mensajesSinLeer = 0,
}: {
  inc: Incidencia;
  me: Usuario;
  columnColor: string;
  onClick?: () => void;
  isDragging?: boolean;
  isOverlay?: boolean;
  readOnly?: boolean;
  mensajesSinLeer?: number;
}) {
  const imagenPortadaRaw =
    (inc as Incidencia & { imagen_url?: string }).imagen_url ||
    (inc as Incidencia & { imagenes?: string[] }).imagenes?.[0] ||
    primeraImagenDesdeDescripcion(inc.descripcion);
  const imagenPortada = imagenPortadaRaw ? apiAssetUrl(imagenPortadaRaw) : null;

  const fechaCreacion = formatFechaCorta(inc.fecha_creacion);

  const surfaceClass = [
    "kanban-card-surface group relative flex flex-col overflow-hidden text-left select-none",
    isDragging ? "kanban-card-surface--ghost" : "",
    isOverlay ? "kanban-card-surface--overlay" : "",
    readOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={surfaceClass}
      style={
        !isDragging
          ? ({ "--kanban-accent": columnColor } as React.CSSProperties)
          : undefined
      }
    >
      {!isDragging && <div className="kanban-card-accent-top" aria-hidden />}

      {imagenPortada && !isDragging && (
        <div className="relative h-28 overflow-hidden border-b border-[var(--velo-border)] bg-slate-100">
          <AuthImage
            src={imagenPortada}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-[#091e42]/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <ImageIcon size={11} />
            Adjunto
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-3">
        {!isDragging && !readOnly && (
          <GripVertical
            size={15}
            className="absolute right-2.5 top-10 text-[var(--velo-text-subtle)] opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        )}

        <div className="flex items-start justify-between gap-2 pr-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="font-mono text-[11px] font-bold tracking-tight text-[var(--velo-brand)]">
              VEL-{inc.id}
            </span>
            {!isDragging && !isOverlay && (
              <CopiarEnlaceIncidenciaButton
                incidenciaId={inc.id}
                me={me}
                variant="icon"
                alwaysVisible
              />
            )}
            {fechaCreacion ? (
              <span className="text-[10px] text-[var(--velo-text-subtle)]">
                {fechaCreacion}
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {mensajesSinLeer > 0 && (
              <span
                className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white"
                title="Mensajes sin leer"
              >
                {mensajesSinLeer > 9 ? "9+" : mensajesSinLeer}
              </span>
            )}
            <span
              className={`rounded-md border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${prioridadTone(inc.prioridad)}`}
            >
              {inc.prioridad ?? "normal"}
            </span>
          </div>
        </div>

        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-[var(--velo-text)]">
          {inc.titulo}
        </h3>

        {inc.equipo_codigo ? (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
            {inc.equipo_codigo}
          </p>
        ) : null}

        <div className="mt-2.5 space-y-1 border-t border-[var(--velo-border)] pt-2">
          {inc.solicitante_nombre ? (
            <CardFilaPersona
              etiqueta="Solicitante"
              nombre={inc.solicitante_nombre}
              extra={inc.solicitante_departamento}
            />
          ) : null}
          <CardFilaPersona etiqueta="Asignado" nombre={inc.asignado_nombre} />
        </div>

      </div>
    </article>
  );
}

type KanbanCardProps = {
  inc: Incidencia;
  me: Usuario;
  columnColor: string;
  onOpen: (inc: Incidencia) => void;
  isDragging?: boolean;
  readOnly?: boolean;
  mensajesSinLeer?: number;
};

function KanbanCardImpl({
  inc,
  me,
  columnColor,
  onOpen,
  isDragging,
  readOnly,
  mensajesSinLeer = 0,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingKit } =
    useDraggable({
      id: `inc-${inc.id}`,
      data: { inc },
      disabled: readOnly,
    });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const ghost = isDragging || isDraggingKit;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="outline-none"
      {...(readOnly ? {} : { ...listeners, ...attributes })}
    >
      <CardLayout
        inc={inc}
        me={me}
        columnColor={columnColor}
        isDragging={ghost}
        onClick={() => onOpen(inc)}
        readOnly={readOnly}
        mensajesSinLeer={mensajesSinLeer}
      />
    </div>
  );
}

const KanbanCard = memo(KanbanCardImpl, (prev, next) => {
  return (
    prev.inc === next.inc &&
    prev.me.id === next.me.id &&
    prev.columnColor === next.columnColor &&
    prev.onOpen === next.onOpen &&
    prev.isDragging === next.isDragging &&
    prev.readOnly === next.readOnly &&
    prev.mensajesSinLeer === next.mensajesSinLeer
  );
});

type KanbanColumnProps = {
  colId: EstadoKanban;
  items: Incidencia[];
  me: Usuario;
  esAdmin: boolean;
  onOpen: (inc: Incidencia) => void;
  activeId: string | null;
  readOnly?: boolean;
  sinLeerPorIncidencia?: Record<number, number>;
};

function KanbanColumnImpl({
  colId,
  items,
  me,
  esAdmin,
  onOpen,
  activeId,
  readOnly,
  sinLeerPorIncidencia = {},
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: colId });
  const { label, theme } = columnMeta(colId);

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "kanban-column--over" : ""}`}
      style={{
        background: isOver ? "#fff" : theme.soft,
        borderColor: theme.border,
        ["--kanban-col-soft" as string]: theme.soft,
        ["--kanban-col-border" as string]: theme.border,
      }}
    >
      <header className="shrink-0 px-3.5 pb-2 pt-3">
        <div
          className="mb-3 h-1 rounded-full"
          style={{ background: `linear-gradient(90deg, ${theme.color}, transparent)` }}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full shadow-sm"
              style={{ backgroundColor: theme.color, boxShadow: `0 0 0 3px ${theme.ring}` }}
            />
            <h2 className="truncate text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--velo-text)]">
              {label}
            </h2>
          </div>
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold tabular-nums text-white shadow-sm"
            style={{ backgroundColor: theme.color }}
          >
            {items.length}
          </span>
        </div>
      </header>

      <div className="kanban-column-scroll flex flex-col gap-2.5">
        {items.length === 0 ? (
          <div
            className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-12 text-center"
            style={{ borderColor: theme.border, background: `${theme.color}14` }}
          >
            <Inbox size={22} style={{ color: theme.color }} className="mb-2 opacity-60" />
            <p className="text-xs font-semibold text-[var(--velo-text-muted)]">Vacío</p>
            <p className="mt-0.5 text-[10px] text-[var(--velo-text-subtle)]">
              {readOnly ? "Sin incidencias" : "Arrastra una tarjeta aquí"}
            </p>
          </div>
        ) : (
          items.map((inc) => {
            const cardReadOnly =
              readOnly || !puedeMoverIncidenciaEnTablero(inc, me, esAdmin);
            return (
              <KanbanCard
                key={inc.id}
                inc={inc}
                me={me}
                columnColor={theme.color}
                onOpen={onOpen}
                isDragging={activeId === `inc-${inc.id}`}
                readOnly={cardReadOnly}
                mensajesSinLeer={sinLeerPorIncidencia[inc.id] ?? 0}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

const KanbanColumn = memo(KanbanColumnImpl);

function KanbanSkeleton() {
  return (
    <div className="kanban-board flex min-h-0 flex-1 flex-col">
      <div className="kanban-columns min-h-[min(70vh,720px)]">
        {KANBAN_COLUMNAS.map((col) => (
          <div
            key={col.id}
            className="kanban-column flex flex-col p-3"
            style={{ background: KANBAN_TEMAS[col.id].soft }}
          >
            <div className="kanban-skeleton mb-3 h-4 w-28" />
            <div className="flex flex-1 flex-col gap-2.5">
              <div className="kanban-skeleton h-28" />
              <div className="kanban-skeleton h-24" />
              <div className="kanban-skeleton h-24 opacity-70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  items,
  me,
  esAdmin = false,
  loading,
  readOnly,
  sinLeerPorIncidencia = {},
  onOpen,
  onMove,
}: Props) {
  const [activeInc, setActiveInc] = useState<Incidencia | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  );

  const porColumna = useMemo(() => {
    const map: Record<EstadoKanban, Incidencia[]> = {
      abierta: [],
      en_curso: [],
      en_revision: [],
      cerrada: [],
    };
    for (const inc of items) {
      map[normalizarEstado(inc.estado)].push(inc);
    }
    return map;
  }, [items]);

  const total = items.length;
  const activeColumnColor = activeInc
    ? KANBAN_TEMAS[normalizarEstado(activeInc.estado)].color
    : KANBAN_TEMAS.abierta.color;

  if (loading) {
    return <KanbanSkeleton />;
  }

  return (
    <div className="kanban-board flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--velo-text-muted)]">
          <span className="font-bold text-[var(--velo-text)]">{total}</span> incidencias en el
          tablero
        </p>
        {readOnly ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--velo-border)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--velo-text-subtle)]">
            <Lock size={11} />
            Solo lectura
          </span>
        ) : (
          <span className="text-[10px] font-medium text-[var(--velo-text-subtle)]">
            Arrastra las tarjetas para cambiar de columna
          </span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => {
          const inc = e.active.data.current?.inc as Incidencia | undefined;
          if (!inc || readOnly || !puedeMoverIncidenciaEnTablero(inc, me, esAdmin)) return;
          setActiveInc(inc);
        }}
        onDragEnd={(e) => {
          setActiveInc(null);
          const inc = e.active.data.current?.inc as Incidencia | undefined;
          if (!inc || readOnly || !puedeMoverIncidenciaEnTablero(inc, me, esAdmin)) return;
          const overId = e.over?.id;
          if (
            inc &&
            overId &&
            typeof overId === "string" &&
            normalizarEstado(inc.estado) !== overId
          ) {
            void onMove(inc.id, overId as EstadoKanban);
          }
        }}
      >
        <div className="kanban-columns min-h-[min(50dvh,420px)] max-h-[calc(100dvh-11rem)] sm:min-h-[min(60vh,560px)] sm:max-h-[calc(100vh-13rem)] lg:min-h-[min(68vh,680px)] lg:max-h-[calc(100vh-14rem)]">
          {KANBAN_COLUMNAS.map((col) => (
            <KanbanColumn
              key={col.id}
              colId={col.id}
              items={porColumna[col.id]}
              me={me}
              esAdmin={esAdmin}
              onOpen={onOpen}
              activeId={activeInc ? `inc-${activeInc.id}` : null}
              readOnly={readOnly}
              sinLeerPorIncidencia={sinLeerPorIncidencia}
            />
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: "cubic-bezier(0.18, 0.89, 0.32, 1.28)",
          }}
        >
          {activeInc ? (
            <div className="w-[min(100vw-2rem,20rem)] rotate-[2.5deg]">
              <CardLayout
                inc={activeInc}
                me={me}
                columnColor={activeColumnColor}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
