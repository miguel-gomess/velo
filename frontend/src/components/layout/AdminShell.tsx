import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AppLogo } from "./AppLogo";

type AdminShellProps = {
  panelLabel: string;
  panelExtra?: ReactNode;
  nav: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

export function AdminShell({ panelLabel, panelExtra, nav, footer, children }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[var(--velo-bg)] lg:flex-row">
      <header className="flex shrink-0 items-center gap-3 border-b border-[var(--velo-border)] bg-white px-3 py-2.5 safe-area-pt sm:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg border border-[var(--velo-border)] p-2 text-[var(--velo-text)]"
          aria-label="Abrir menú de navegación"
          aria-expanded={menuOpen}
        >
          <Menu size={20} />
        </button>
        <AppLogo size="sm" />
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--velo-text-muted)]">
          {panelLabel}
        </p>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#091e42]/45 backdrop-blur-[1px] lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(17.5rem,88vw)] flex-col border-r border-[var(--velo-border)] bg-white shadow-xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-[var(--velo-border)] px-4 py-4 lg:px-5 lg:py-5">
          <div className="min-w-0">
            <AppLogo size="sm" />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--velo-text-subtle)]">
              {panelLabel}
            </p>
            {panelExtra}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-[var(--velo-text-muted)] hover:bg-slate-100 lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3 lg:p-4"
          onClick={() => setMenuOpen(false)}
        >
          {nav}
        </nav>

        <div className="border-t border-[var(--velo-border)] p-3 lg:p-4">{footer}</div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5 lg:p-8">
        {children}
      </main>
    </div>
  );
}
