/** Marca «V» — mismo diseño que favicon.svg (Login, pestaña del navegador). */
export function VeloMark({ className = "size-11" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`shrink-0 rounded-lg shadow-sm ${className}`}
      aria-hidden
    >
      <rect width="32" height="32" rx="6" className="fill-[var(--velo-brand)]" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        className="fill-white"
        style={{
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
          fontSize: "18px",
          fontWeight: 700,
        }}
      >
        V
      </text>
    </svg>
  );
}
