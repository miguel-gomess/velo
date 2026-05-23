const MARK_SRC = "/favicon.svg?v=3";

export function AppLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const mark = size === "sm" ? "size-9" : "size-11";
  const title = size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-3">
      <img
        src={MARK_SRC}
        alt=""
        width={size === "sm" ? 36 : 44}
        height={size === "sm" ? 36 : 44}
        className={`${mark} shrink-0 rounded-lg shadow-sm`}
        decoding="async"
      />
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
