import { Navigate, Route, Routes } from "react-router-dom";
import { HomeRedirect } from "./components/HomeRedirect";
import { RequireAuth } from "./components/RequireAuth";
import { authClient } from "./lib/authClient";
import { Dashboard } from "./pages/Dashboard";
import { DirectorioPanel } from "./pages/dashboard/DirectorioPanel";
import { IncidenciasPanel } from "./pages/dashboard/IncidenciasPanel";
import { PanelAnalisis } from "./pages/dashboard/AnalisisPanel";
import { ConfigPanel } from "./pages/dashboard/ConfigPanel";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Portal } from "./pages/Portal";
import { Workspace } from "./pages/Workspace";
import { WorkspaceKanbanPanel } from "./pages/workspace/WorkspaceKanbanPanel";
import { SinAcceso } from "./pages/SinAcceso";

function App() {
  const { data: session } = authClient.useSession();

  return (
    <Routes>
      <Route path="/" element={session ? <HomeRedirect /> : <Landing />} />
      <Route path="/login" element={session ? <HomeRedirect /> : <Login />} />
      <Route path="/sin-acceso" element={<SinAcceso />} />
      <Route
        path="/portal"
        element={
          <RequireAuth>
            <Portal />
          </RequireAuth>
        }
      />
      <Route
        path="/workspace"
        element={
          <RequireAuth>
            <Workspace />
          </RequireAuth>
        }
      >
        <Route index element={<WorkspaceKanbanPanel />} />
        <Route path="*" element={<Navigate to="/workspace" replace />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="incidencias" replace />} />
        <Route path="incidencias" element={<IncidenciasPanel />} />
        <Route path="directorio" element={<DirectorioPanel />} />
        <Route path="analisis" element={<PanelAnalisis />} />
        <Route path="config" element={<ConfigPanel />} />
        <Route path="*" element={<Navigate to="incidencias" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
