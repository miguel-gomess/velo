import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { apiGetMe } from "../lib/api";
import { parseIncidenciaIdDesdeSearch, rutaIncidenciaParaUsuario } from "../lib/incidenciaEnlace";
import { isAdminUsuario, puedeUsarWorkspaceKanban, RUTA_PANEL_ADMIN } from "../lib/roles";

export function HomeRedirect() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isPending || !session?.user?.email) return;
    let cancelled = false;
    apiGetMe()
      .then((me) => {
        if (cancelled) return;
        const incId = parseIncidenciaIdDesdeSearch(window.location.search);
        if (incId) {
          navigate(`${rutaIncidenciaParaUsuario(me)}?incidencia=${incId}`, { replace: true });
          return;
        }
        if (isAdminUsuario(me)) {
          navigate(RUTA_PANEL_ADMIN, { replace: true });
        } else if (puedeUsarWorkspaceKanban(me)) {
          navigate("/workspace", { replace: true });
        } else {
          navigate("/portal", { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) navigate("/portal", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [session, isPending, navigate]);

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  return null;
}
