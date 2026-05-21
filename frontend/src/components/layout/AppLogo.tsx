export function AppLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-9 text-sm" : "size-11 text-lg";
  const title = size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex ${box} items-center justify-center rounded-lg bg-[var(--velo-brand)] font-bold text-white shadow-sm`}
      >
        V
      </div>
      <div>
        <div className={`${title} font-bold leading-none tracking-tight text-[var(--velo-text)]`}>
          Velo
        </div>
        {size === "md" && (
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--velo-text-subtle)]">
            Gestión interna
          </div>
        )}
      </div>
    </div>
  );
}
