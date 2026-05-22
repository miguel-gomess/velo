import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { apiGetIncidencias } from "../lib/api";
import { parseIncidenciaIdDesdeSearch, rutaIncidenciaParaUsuario } from "../lib/incidenciaEnlace";
import { isAdminUsuario, puedeUsarWorkspaceKanban } from "../lib/roles";
import { useProfile } from "../hooks/useProfile";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { PageLoading } from "../components/layout/PageLoading";
import { PortalHeader } from "../components/portal/PortalHeader";
import { PortalNavSidebar, PortalNavMobile } from "../components/portal/PortalNav";
import { PortalInicioPanel } from "../components/portal/PortalInicioPanel";
import { PortalNuevaSolicitudForm } from "../components/portal/PortalNuevaSolicitudForm";
import { PortalMisSolicitudesView } from "../components/portal/PortalMisSolicitudesView";
import { contarPorEstado, incidenciasVisiblesEnPortal, type PortalTabId } from "../components/portal/portalUtils";
import { AlertCircle, Home, MessageSquare, Plus } from "lucide-react";

export function Portal() {
  const { data: session, isPending } = authClient.useSession();
  const email = session?.user?.email?.trim() ?? null;
  const profile = useProfile(email);

  const [tab, setTab] = useState<PortalTabId>("inicio");
  const [categoriaPreset, setCategoriaPreset] = useState<string | undefined>();
  const [items, setItems] = useState<Awaited<ReturnType<typeof apiGetIncidencias>>["items"]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const me = profile.email === email ? profile.user : null;

  useEffect(() => {
    if (me) void loadTickets();
  }, [me]);

  async function loadTickets() {
    setListLoading(true);
    try {
      const r = await apiGetIncidencias("portal");
      setItems(r.items);
    } catch {
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }

  const misSolicitudes = useMemo(
    () => (me ? incidenciasVisiblesEnPortal(items, me.id) : []),
    [items, me],
  );

  const stats = useMemo(() => contarPorEstado(misSolicitudes), [misSolicitudes]);
  const { total: notifTotal, por_incidencia: sinLeerPorIncidencia, refrescar: refrescarNotif } =
    useNotificaciones();

  useEffect(() => {
    if (!me) return;
    const id = parseIncidenciaIdDesdeSearch(searchParams.toString());
    if (!id) return;

    if (puedeUsarWorkspaceKanban(me) || isAdminUsuario(me)) {
      navigate(`${rutaIncidenciaParaUsuario(me)}?incidencia=${id}`, { replace: true });
      return;
    }

    setTab("seguimiento");
    setSeleccionadaId(id);
    const next = new URLSearchParams(searchParams);
    next.delete("incidencia");
    setSearchParams(next, { replace: true });
  }, [me, searchParams, setSearchParams, navigate]);

  function irAIncidencia(id: number) {
    setTab("seguimiento");
    setSeleccionadaId(id);
    void refrescarNotif();
  }

  if (isPending || (email && !profile.ready)) {
    return (
      <div className="portal-shell flex h-svh">
        <PageLoading label="Cargando portal…" />
      </div>
    );
  }

  if (!session?.user || !email) return <Navigate to="/login" replace />;

  if (!me) {
    return (
      <div className="portal-shell flex min-h-screen items-center justify-center px-6">
        <div className="portal-card max-w-md p-10 text-center">
          <AlertCircle className="mx-auto mb-4 text-rose-500" size={44} />
          <h2 className="text-xl font-bold text-[var(--velo-text)]">Acceso no disponible</h2>
          <p className="mt-2 text-sm text-[var(--velo-text-muted)]">
            {profile.error || "Tu usuario no figura en el directorio activo."}
          </p>
          <button
            type="button"
            onClick={() => authClient.signOut()}
            className="mt-8 w-full rounded-xl bg-[var(--velo-text)] py-3 text-sm font-semibold text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const nombreUsuario = session.user.name?.split(" ")[0] ?? me.nombre.split(" ")[0] ?? "Usuario";
  const deptLabel = (me.departamento ?? "").trim();

  const navItems = [
    { id: "inicio" as const, label: "Inicio", icon: Home },
    { id: "nueva" as const, label: "Nueva solicitud", icon: Plus },
    {
      id: "seguimiento" as const,
      label: "Mis solicitudes",
      icon: MessageSquare,
      badge: notifTotal > 0 ? notifTotal : stats.total || undefined,
    },
  ];

  return (
    <div className="portal-shell flex h-svh flex-col overflow-hidden">
      <PortalHeader
        nombreUsuario={nombreUsuario}
        me={me}
        sessionName={session.user.name ?? null}
        deptLabel={deptLabel}
        onIrAIncidencia={irAIncidencia}
      />

      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:gap-4 lg:px-6 lg:py-3">
        <PortalNavSidebar
          items={navItems}
          tab={tab}
          onTab={setTab}
          stats={stats.total > 0 ? stats : undefined}
        />
        <PortalNavMobile items={navItems} tab={tab} onTab={setTab} />

        <main
          className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${
            tab === "inicio" ? "lg:overflow-hidden" : ""
          }`}
        >
          {tab === "inicio" && (
            <PortalInicioPanel
              nombreUsuario={nombreUsuario}
              usuarioId={me.id}
              stats={stats}
              misSolicitudes={misSolicitudes}
              sinLeerPorIncidencia={sinLeerPorIncidencia}
              onNueva={() => setTab("nueva")}
              onVerTodas={() => setTab("seguimiento")}
              onAbrir={irAIncidencia}
              onCategoria={(id) => {
                setCategoriaPreset(id);
                setTab("nueva");
              }}
            />
          )}

          {tab === "nueva" && (
            <PortalNuevaSolicitudForm
              categoriaInicial={categoriaPreset}
              onCreada={(id) => {
                setCategoriaPreset(undefined);
                irAIncidencia(id);
              }}
              onReload={loadTickets}
            />
          )}

          {tab === "seguimiento" && (
            <PortalMisSolicitudesView
              misSolicitudes={misSolicitudes}
              listLoading={listLoading}
              sinLeerPorIncidencia={sinLeerPorIncidencia}
              me={me}
              usuarioId={me.id}
              seleccionadaId={seleccionadaId}
              onSeleccionar={setSeleccionadaId}
              onRefresh={() => void loadTickets()}
              onNueva={() => setTab("nueva")}
              onRefrescarNotif={() => void refrescarNotif()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
