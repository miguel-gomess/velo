import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  apiCreateUsuario,
  apiDeleteUsuario,
  apiGetUsuarios,
  apiUpdateUsuario,
  type Usuario,
} from "../../lib/api";
import { UserAvatar } from "../../components/UserAvatar";
import {
  Users,
  ShieldCheck,
  Building2,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  Loader2,
  Inbox,
  Mail,
  Lock,
  UserRound,
  Check,
} from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarFormularioAlta(fields: {
  nombre: string;
  email: string;
  password: string;
}): Record<string, string> {
  const errs: Record<string, string> = {};
  const nombre = fields.nombre.trim();
  const email = fields.email.trim();
  if (!nombre || nombre.length < 2) {
    errs.nombre = "Indica un nombre de al menos 2 caracteres";
  }
  if (!email) {
    errs.email = "El email institucional es obligatorio";
  } else if (!EMAIL_RE.test(email)) {
    errs.email = "Formato inválido — usa algo como nombre@velo.com";
  }
  if (!fields.password) {
    errs.password = "La contraseña es obligatoria";
  } else if (fields.password.length < 8) {
    errs.password = "Mínimo 8 caracteres";
  }
  return errs;
}

function validarFormularioEdicion(fields: {
  nombre: string;
  password: string;
}): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!fields.nombre.trim() || fields.nombre.trim().length < 2) {
    errs.nombre = "Indica un nombre de al menos 2 caracteres";
  }
  if (fields.password.trim() && fields.password.length < 8) {
    errs.password = "Mínimo 8 caracteres";
  }
  return errs;
}

function NivelBadge({ esAdmin }: { esAdmin: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        esAdmin ? "directorio-badge-admin" : "directorio-badge-standard"
      }`}
    >
      {esAdmin ? "Admin" : "Standard"}
    </span>
  );
}

function StatCard({
  title,
  value,
  sub,
  Icon,
  accent,
}: {
  title: string;
  value: string;
  sub: string;
  Icon: React.ElementType;
  accent: string;
}) {
  return (
    <article
      className="directorio-stat"
      style={{ "--stat-accent": accent } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 pl-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--velo-text-subtle)]">
            {title}
          </p>
          <p className="mt-1.5 text-3xl font-extrabold tabular-nums tracking-tight text-[var(--velo-text)]">
            {value}
          </p>
          <p className="mt-2 text-xs font-medium text-[var(--velo-text-muted)]">{sub}</p>
        </div>
        <div className="directorio-stat-icon shrink-0">
          <Icon size={22} strokeWidth={2.25} aria-hidden />
        </div>
      </div>
    </article>
  );
}

function ModalShell({
  onClose,
  children,
  maxWidth = "max-w-lg",
  variant = "default",
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  variant?: "default" | "form";
}) {
  const isForm = variant === "form";

  return createPortal(
    <div className="directorio-modal-layer z-[100] p-4 sm:p-6">
      <button
        type="button"
        className="directorio-modal-backdrop absolute inset-0"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className={`directorio-modal relative z-[1] mx-auto w-full ${maxWidth} max-h-[min(88vh,680px)] ${
          isForm ? "directorio-modal--form" : "overflow-y-auto bg-[var(--velo-surface)] p-6 sm:p-8"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="directorio-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {isForm ? <div className="directorio-modal-body">{children}</div> : children}
      </div>
    </div>,
    document.body,
  );
}

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`directorio-form-field ${error ? "has-error" : ""}`}>
      <span className="directorio-form-label">
        {label}
        {hint ? <span className="directorio-form-hint"> ({hint})</span> : null}
      </span>
      {children}
      {error ? (
        <p className="directorio-field-error" role="alert">
          <AlertCircle size={13} aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FieldInput({
  icon: Icon,
  error,
  className = "",
  list,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ElementType;
  error?: string;
  list?: string;
}) {
  return (
    <div className={`directorio-input-wrap ${error ? "has-error" : ""}`}>
      {Icon ? <Icon size={17} strokeWidth={2} className="directorio-input-icon" aria-hidden /> : null}
      <input
        {...props}
        list={list}
        className={`directorio-field ${Icon ? "directorio-field--with-icon" : ""} ${className}`.trim()}
        aria-invalid={error ? true : undefined}
      />
    </div>
  );
}

function AdminPrivilegioToggle({
  checked,
  onChange,
  disabled,
  compact,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`directorio-admin-card ${checked ? "is-on" : ""} ${compact ? "directorio-admin-card--compact" : ""}`}
    >
      <div className="directorio-admin-card__info">
        <span className="directorio-admin-card__icon" aria-hidden>
          <ShieldCheck size={compact ? 18 : 20} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="directorio-admin-card__title">
            {compact ? "Rol de administrador" : "Privilegios de administrador"}
          </p>
          {!compact && (
            <p className="directorio-admin-card__desc">
              Gestión de usuarios, incidencias globales y análisis.
            </p>
          )}
        </div>
      </div>
      <label className="directorio-switch">
        <input
          type="checkbox"
          className="directorio-switch__input"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="directorio-switch__track" aria-hidden>
          <span className="directorio-switch__thumb" />
        </span>
        <span className="directorio-switch__estado">{checked ? "Activado" : "Desactivado"}</span>
      </label>
    </div>
  );
}

export function DirectorioPanel() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPasswordCreate, setShowPasswordCreate] = useState(false);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);

  const [editing, setEditing] = useState<Usuario | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDepartamento, setEditDepartamento] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editEsAdmin, setEditEsAdmin] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState<Usuario | null>(null);
  const [removing, setRemoving] = useState(false);

  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const cargar = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetUsuarios(query);
      setItems(res.items);
    } catch {
      setError("No se pudo cargar el directorio. Comprueba la conexión con el servidor.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void cargar(q), 220);
    return () => clearTimeout(t);
  }, [q, cargar]);

  const stats = useMemo(
    () => ({
      total: items.length,
      admins: items.filter((u) => u.es_admin).length,
      deps: new Set(
        items.map((u) => (u.departamento ?? "").trim().toUpperCase()).filter(Boolean),
      ).size,
    }),
    [items],
  );

  const departamentosSugeridos = useMemo(() => {
    const set = new Set<string>();
    for (const u of items) {
      const d = (u.departamento ?? "").trim();
      if (d) set.add(d);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [items]);

  function limpiarErrorAlta(campo: string) {
    setCreateErrors((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  }

  function limpiarErrorEdicion(campo: string) {
    setEditErrors((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const errs = validarFormularioAlta({ nombre, email, password });
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }
    setCreateErrors({});
    setCreating(true);
    setError(null);
    try {
      await apiCreateUsuario({
        nombre: nombre.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        password,
        departamento: departamento.trim() ? departamento.trim().toUpperCase() : undefined,
        es_admin: esAdmin,
      });
      setOpenCreate(false);
      setNombre("");
      setEmail("");
      setPassword("");
      setDepartamento("");
      setEsAdmin(false);
      setShowPasswordCreate(false);
      await cargar(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setCreating(false);
    }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const errs = validarFormularioEdicion({ nombre: editNombre, password: editPassword });
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    setEditErrors({});
    setSavingEdit(true);
    setError(null);
    try {
      await apiUpdateUsuario(editing.id, {
        nombre: editNombre.trim().toUpperCase(),
        departamento: editDepartamento.trim()
          ? editDepartamento.trim().toUpperCase()
          : "",
        es_admin: editEsAdmin,
        password: editPassword.trim() || undefined,
      });
      setEditing(null);
      setEditPassword("");
      setShowPasswordEdit(false);
      await cargar(q);
    } catch {
      setError("No se pudo actualizar el usuario");
    } finally {
      setSavingEdit(false);
    }
  }

  async function onDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await apiDeleteUsuario(deleting.id);
      setDeleting(null);
      await cargar(q);
    } catch {
      setError("No se pudo eliminar el usuario");
    } finally {
      setRemoving(false);
    }
  }

  function abrirEdicion(u: Usuario) {
    setEditing(u);
    setEditNombre(u.nombre);
    setEditDepartamento(u.departamento || "");
    setEditEsAdmin(u.es_admin);
    setEditPassword("");
    setShowPasswordEdit(false);
    setEditErrors({});
    setError(null);
  }

  function cerrarAlta() {
    setOpenCreate(false);
    setCreateErrors({});
    setError(null);
  }

  function abrirAlta() {
    setError(null);
    setCreateErrors({});
    setNombre("");
    setEmail("");
    setPassword("");
    setDepartamento("");
    setEsAdmin(false);
    setShowPasswordCreate(false);
    setOpenCreate(true);
  }

  useEffect(() => {
    if (!openCreate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !creating) cerrarAlta();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCreate, creating]);

  return (
    <div className="directorio-panel">
      <header className="directorio-hero mb-6 p-4 sm:mb-8 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--velo-text)] sm:text-3xl">
              Usuarios
            </h1>
            <p className="mt-1.5 text-sm text-[var(--velo-text-muted)]">
              Gestión de accesos y perfiles corporativos
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="directorio-search">
              <Search
                size={18}
                className="shrink-0 text-[var(--velo-text-subtle)]"
                aria-hidden
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o email…"
                aria-label="Buscar usuarios"
              />
            </label>
            <button
              type="button"
              onClick={abrirAlta}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--velo-brand)] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--velo-brand-hover)] active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={2.5} aria-hidden />
              Nuevo usuario
            </button>
          </div>
        </div>
      </header>

      {error && !openCreate && !editing && (
        <div
          className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total usuarios"
          value={loading ? "—" : String(stats.total)}
          sub="Cuentas activas"
          Icon={Users}
          accent="var(--velo-brand)"
        />
        <StatCard
          title="Administradores"
          value={loading ? "—" : String(stats.admins)}
          sub="Privilegios totales"
          Icon={ShieldCheck}
          accent="#7c3aed"
        />
        <StatCard
          title="Departamentos"
          value={loading ? "—" : String(stats.deps)}
          sub="Áreas operativas"
          Icon={Building2}
          accent="var(--velo-success)"
        />
      </div>

      <section className="directorio-table-wrap">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--velo-border)] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[var(--velo-text)]">Directorio</h2>
            <span className="rounded-full bg-[var(--velo-brand-muted)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--velo-brand)]">
              {loading ? "…" : `${items.length} usuarios`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void cargar(q)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[var(--velo-brand)] transition hover:bg-[var(--velo-brand-muted)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden />
            Sincronizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="directorio-table w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr>
                <th className="px-5 py-3.5 sm:px-6">Usuario</th>
                <th className="px-5 py-3.5 sm:px-6">Área</th>
                <th className="px-5 py-3.5 sm:px-6">Nivel</th>
                <th className="px-5 py-3.5 sm:px-6">Registro</th>
                <th className="px-5 py-3.5 text-right sm:px-6">Gestión</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="directorio-skeleton-row">
                    <td className="px-5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-11 shrink-0 rounded-2xl directorio-skeleton-bar" />
                        <div className="flex-1 space-y-2">
                          <div className="directorio-skeleton-bar w-28" />
                          <div className="directorio-skeleton-bar w-36 max-w-full" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6">
                      <div className="directorio-skeleton-bar w-16" />
                    </td>
                    <td className="px-5 sm:px-6">
                      <div className="directorio-skeleton-bar w-20" />
                    </td>
                    <td className="px-5 sm:px-6">
                      <div className="directorio-skeleton-bar w-24" />
                    </td>
                    <td className="px-5 sm:px-6" />
                  </tr>
                ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Inbox
                      className="mx-auto mb-3 text-[var(--velo-text-subtle)]"
                      size={40}
                      strokeWidth={1.25}
                    />
                    <p className="font-semibold text-[var(--velo-text)]">
                      {q.trim() ? "Sin resultados" : "No hay usuarios"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--velo-text-muted)]">
                      {q.trim()
                        ? "Prueba con otro término de búsqueda."
                        : "Crea el primer usuario con el botón «Nuevo usuario»."}
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                items.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar nombre={u.nombre} userId={u.id} size="xl" square />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--velo-text)]">
                            {u.nombre}
                          </p>
                          <p className="truncate text-xs text-[var(--velo-text-muted)]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <span className="inline-flex rounded-md bg-[var(--velo-bg)] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[var(--velo-text-muted)]">
                        {u.departamento || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <NivelBadge esAdmin={u.es_admin} />
                    </td>
                    <td className="px-5 py-4 tabular-nums text-[var(--velo-text-muted)] sm:px-6">
                      {new Date(u.fecha_creacion).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEdicion(u)}
                          className="directorio-action-btn directorio-action-btn--edit"
                          aria-label={`Editar ${u.nombre}`}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleting(u);
                            setError(null);
                          }}
                          className="directorio-action-btn directorio-action-btn--delete"
                          aria-label={`Eliminar ${u.nombre}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {openCreate && (
        <ModalShell variant="form" onClose={cerrarAlta} maxWidth="max-w-xl">
          <form onSubmit={onCreate} className="directorio-form" noValidate>
            <header className="directorio-form-header">
              <span className="directorio-form-header-icon">
                <UserPlus size={24} strokeWidth={2.25} />
              </span>
              <div>
                <h2 id="directorio-modal-title" className="directorio-form-title">
                  Registrar usuario
                </h2>
                <p className="directorio-form-subtitle">
                  Alta en directorio y cuenta de acceso
                </p>
              </div>
            </header>

            <FormField label="Nombre completo" error={createErrors.nombre}>
              <FieldInput
                icon={UserRound}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  limpiarErrorAlta("nombre");
                }}
                placeholder="Ej. María López"
                autoComplete="name"
                error={createErrors.nombre}
              />
            </FormField>

            <FormField label="Unidad o área" hint="opcional">
              <FieldInput
                icon={Building2}
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="IT, RRHH, Operaciones…"
                autoComplete="organization"
                list="directorio-dept-sugerencias"
              />
              <datalist id="directorio-dept-sugerencias">
                {departamentosSugeridos.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Email institucional" error={createErrors.email}>
              <FieldInput
                icon={Mail}
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  limpiarErrorAlta("email");
                }}
                placeholder="nombre@velo.com"
                autoComplete="email"
                error={createErrors.email}
              />
            </FormField>

            <FormField label="Contraseña" error={createErrors.password}>
              <div
                className={`directorio-input-wrap directorio-input-wrap--password ${
                  createErrors.password ? "has-error" : ""
                }`}
              >
                <Lock size={17} strokeWidth={2} className="directorio-input-icon" aria-hidden />
                <input
                  type={showPasswordCreate ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    limpiarErrorAlta("password");
                  }}
                  placeholder="Mínimo 8 caracteres"
                  className="directorio-field directorio-field--with-icon pr-11"
                  autoComplete="new-password"
                  aria-invalid={createErrors.password ? true : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordCreate(!showPasswordCreate)}
                  className="directorio-password-toggle"
                  tabIndex={-1}
                  aria-label={showPasswordCreate ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPasswordCreate ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </FormField>

            <AdminPrivilegioToggle
              checked={esAdmin}
              onChange={setEsAdmin}
              disabled={creating}
            />

            {error && (
              <p className="directorio-form-error">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <div className="directorio-form-actions">
              <button
                type="button"
                onClick={cerrarAlta}
                disabled={creating}
                className="directorio-btn directorio-btn--ghost"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="directorio-btn directorio-btn--primary"
              >
                {creating ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={17} />}
                Confirmar alta
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {editing && (
        <ModalShell variant="form" onClose={() => setEditing(null)} maxWidth="max-w-xl">
          <form onSubmit={onUpdate} className="directorio-form" noValidate>
            <header className="directorio-form-header">
              <span className="directorio-form-header-icon directorio-form-header-icon--edit">
                <Settings size={22} strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <h2 className="directorio-form-title">Editar perfil</h2>
                <p className="directorio-form-subtitle truncate">{editing.email}</p>
              </div>
            </header>

            <FormField label="Nombre" error={editErrors.nombre}>
              <FieldInput
                icon={UserRound}
                value={editNombre}
                onChange={(e) => {
                  setEditNombre(e.target.value);
                  limpiarErrorEdicion("nombre");
                }}
                error={editErrors.nombre}
              />
            </FormField>

            <FormField label="Departamento" hint="opcional">
              <FieldInput
                icon={Building2}
                value={editDepartamento}
                onChange={(e) => setEditDepartamento(e.target.value)}
                placeholder="IT, RRHH…"
                list="directorio-dept-edit"
              />
              <datalist id="directorio-dept-edit">
                {departamentosSugeridos.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Nueva contraseña" hint="dejar vacío para no cambiar" error={editErrors.password}>
              <div
                className={`directorio-input-wrap directorio-input-wrap--password ${
                  editErrors.password ? "has-error" : ""
                }`}
              >
                <Lock size={17} strokeWidth={2} className="directorio-input-icon" aria-hidden />
                <input
                  type={showPasswordEdit ? "text" : "password"}
                  value={editPassword}
                  onChange={(e) => {
                    setEditPassword(e.target.value);
                    limpiarErrorEdicion("password");
                  }}
                  placeholder="Mínimo 8 caracteres"
                  className="directorio-field directorio-field--with-icon pr-11"
                  autoComplete="new-password"
                  aria-invalid={editErrors.password ? true : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordEdit(!showPasswordEdit)}
                  className="directorio-password-toggle"
                  tabIndex={-1}
                  aria-label={showPasswordEdit ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPasswordEdit ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </FormField>

            <AdminPrivilegioToggle
              checked={editEsAdmin}
              onChange={setEditEsAdmin}
              disabled={savingEdit}
              compact
            />

            {error && (
              <p className="directorio-form-error">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <div className="directorio-form-actions">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="directorio-btn directorio-btn--ghost"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="directorio-btn directorio-btn--primary"
              >
                {savingEdit ? <Loader2 size={18} className="animate-spin" /> : <Check size={17} />}
                Guardar cambios
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deleting && (
        <ModalShell onClose={() => setDeleting(null)} maxWidth="max-w-md">
          <div className="text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-rose-50 text-[var(--velo-danger)]">
              <Trash2 size={28} />
            </span>
            <h2 className="text-xl font-bold text-[var(--velo-text)]">¿Eliminar usuario?</h2>
            <p className="mt-2 text-sm text-[var(--velo-text-muted)]">
              Se borrará <strong className="text-[var(--velo-text)]">{deleting.nombre}</strong> y
              su acceso al sistema. Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="flex-1 rounded-lg border border-[var(--velo-border)] py-2.5 text-sm font-semibold text-[var(--velo-text)] hover:bg-[var(--velo-bg)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={removing}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--velo-danger)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {removing ? <Loader2 size={18} className="animate-spin" /> : null}
                Sí, eliminar
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
