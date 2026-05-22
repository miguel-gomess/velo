import { Link } from "react-router-dom";
import { AppLogo } from "../components/layout/AppLogo";
import { ArrowRight, Kanban, MessageSquare, Shield } from "lucide-react";

const FEATURES = [
  {
    icon: Kanban,
    title: "Tablero Kanban",
    text: "Prioriza y mueve incidencias entre equipos con visibilidad clara.",
  },
  {
    icon: MessageSquare,
    title: "Portal del empleado",
    text: "Solicitudes, seguimiento y comunicación en un solo lugar.",
  },
  {
    icon: Shield,
    title: "Acceso por rol",
    text: "Panel de administración, workspace y portal según tu perfil.",
  },
] as const;

export function Landing() {
  return (
    <div className="landing-shell flex min-h-screen flex-col">
      <header className="landing-header mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <AppLogo />
        <Link
          to="/login"
          className="rounded-md border border-[var(--velo-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--velo-text)] shadow-sm transition hover:border-[var(--velo-brand-muted)] hover:text-[var(--velo-brand)]"
        >
          Acceder
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-16 pt-4">
        <div className="landing-hero grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="landing-hero-copy">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--velo-brand)]">
              Gestión interna
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--velo-text)] sm:text-5xl">
              Incidencias con el ritmo de tu equipo
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--velo-text-muted)]">
              Velo centraliza solicitudes, asignaciones y seguimiento. Menos correos sueltos,
              más contexto compartido.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md bg-[var(--velo-brand)] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--velo-brand-hover)]"
              >
                Iniciar sesión
                <ArrowRight size={18} />
              </Link>
              <span className="text-sm text-[var(--velo-text-subtle)]">
                Acceso con cuenta corporativa
              </span>
            </div>
          </div>

          <div className="landing-hero-panel rounded-2xl border border-[var(--velo-border)] bg-white/90 p-6 shadow-[var(--velo-shadow-md)] backdrop-blur-sm">
            <ul className="space-y-5">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--velo-brand-muted)] text-[var(--velo-brand)]">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--velo-text)]">{title}</h2>
                    <p className="mt-1 text-sm leading-snug text-[var(--velo-text-muted)]">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--velo-border)] bg-white/60 py-4 text-center text-xs text-[var(--velo-text-subtle)]">
        Velo · Sistema de gestión de incidencias internas
      </footer>
    </div>
  );
}
