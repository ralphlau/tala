import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  caption: string;
  icon: LucideIcon;
  accent: string;
}

export function StatCard({ label, value, caption, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.85)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{caption}</p>
    </div>
  );
}
