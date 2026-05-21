import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description: string;
  Icon: LucideIcon;
  hint?: string;
};

export function SeccionPlaceholder({ title, description, Icon, hint }: Props) {
  return (
    <div className="max-w-3xl">
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-12 shadow-xl shadow-slate-200/20">
        <div className="mb-8 inline-flex rounded-2xl bg-indigo-50 p-5 text-indigo-600">
          <Icon size={40} strokeWidth={2} />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">{title}</h1>
        <p className="mt-4 text-lg font-medium text-slate-500 leading-relaxed">
          {description}
        </p>
        {hint ? (
          <p className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-4 text-sm font-semibold text-slate-400">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
