import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { apiGetMe } from "../lib/api";
import { parseIncidenciaIdDesdeSearch, rutaIncidenciaParaUsuario } from "../lib/incidenciaEnlace";
import { isAdminUsuario, puedeUsarWorkspaceKanban } from "../lib/roles";
import { AppLogo } from "../components/layout/AppLogo";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (res.error) throw new Error(res.error.message ?? "Correo o contraseña incorrectos.");

      const me = await apiGetMe();
      const from = (location.state as { from?: string } | null)?.from ?? "";
      const incId =
        parseIncidenciaIdDesdeSearch(from.includes("?") ? from.slice(from.indexOf("?")) : "") ??
        parseIncidenciaIdDesdeSearch(location.search);

      if (incId) {
        navigate(`${rutaIncidenciaParaUsuario(me)}?incidencia=${incId}`, { replace: true });
        return;
      }

      if (isAdminUsuario(me)) {
        navigate("/dashboard/incidencias", { replace: true });
      } else if (puedeUsarWorkspaceKanban(me)) {
        navigate("/workspace", { replace: true });
      } else {
        navigate("/portal", { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Correo o contraseña incorrectos.";
      if (msg.includes("fetch") || msg.includes("Failed") || msg.includes("Network")) {
        setError(
          "No se puede conectar con el servidor. ¿Está el backend en marcha? (npm run dev en backend/)",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--velo-bg)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Link to="/" className="transition opacity-90 hover:opacity-100">
            <AppLogo />
          </Link>
        </div>

        <div className="rounded-lg border border-[var(--velo-border)] bg-white p-8 shadow-md">
          <h1 className="text-xl font-bold text-[var(--velo-text)]">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-[var(--velo-text-muted)]">
            Accede al portal de incidencias de tu empresa
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[var(--velo-text-muted)]">
                Correo electrónico
              </label>
              <input
                id="email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="w-full rounded-md border border-[var(--velo-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--velo-brand)] focus:ring-2 focus:ring-[var(--velo-brand-muted)]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[var(--velo-text-muted)]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full rounded-md border border-[var(--velo-border)] px-3 py-2.5 pr-10 text-sm outline-none focus:border-[var(--velo-brand)] focus:ring-2 focus:ring-[var(--velo-brand-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[var(--velo-text-subtle)] hover:text-[var(--velo-text)]"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--velo-brand)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--velo-brand-hover)] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--velo-text-subtle)]">
          <Link to="/" className="font-medium text-[var(--velo-brand)] hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
