import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[Velo] ErrorBoundary:", error, info.componentStack);
    }
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--velo-bg)] px-6">
        <div className="max-w-md rounded-xl border border-rose-200 bg-white p-8 text-center shadow-md">
          <AlertCircle className="mx-auto mb-4 text-rose-500" size={44} />
          <h1 className="text-xl font-bold text-[var(--velo-text)]">
            Algo se ha roto inesperadamente
          </h1>
          <p className="mt-2 text-sm text-[var(--velo-text-muted)]">
            Hemos registrado el error. Puedes recargar la página para volver a
            intentarlo.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-slate-50 p-3 text-left text-[11px] text-slate-700">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--velo-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--velo-brand-hover)]"
          >
            <RotateCcw size={16} />
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
