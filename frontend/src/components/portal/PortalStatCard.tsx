import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function PortalStatCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "brand" | "amber" | "green" | "rose";
  hint?: string;
  compact?: boolean;
}) {
  const tones = {
    brand: "from-blue-500/10 to-blue-600/5 text-[var(--velo-brand)]",
    amber: "from-amber-500/15 to-orange-500/5 text-amber-700",
    green: "from-emerald-500/15 to-green-500/5 text-emerald-700",
    rose: "from-rose-500/12 to-rose-600/5 text-rose-700",
  };
  if (compact) {
    return (
      <div className={`portal-card flex items-center gap-2.5 bg-gradient-to-br p-2.5 ${tones[tone]}`}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-none tabular-nums text-[var(--velo-text)]">
            {value}
          </p>
          <p className="truncate text-[10px] font-medium text-[var(--velo-text-muted)]">{label}</p>
          {hint && (
            <p className="truncate text-[9px] text-[var(--velo-text-subtle)]">{hint}</p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={`portal-card flex items-center gap-4 bg-gradient-to-br p-4 ${tones[tone]}`}>
      <span className="flex size-11 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tabular-nums text-[var(--velo-text)]">{value}</p>
        <p className="text-xs font-medium text-[var(--velo-text-muted)]">{label}</p>
        {hint && <p className="mt-0.5 truncate text-[10px] text-[var(--velo-text-subtle)]">{hint}</p>}
      </div>
    </div>
  );
}

export const defaultStatIcon = Inbox;
