import { PRIORITY_CONFIG, STAGE_CONFIG, type Priority, type Stage } from "@/types";

interface StatusBadgeProps {
  kind: "stage" | "priority";
  value: Stage | Priority;
}

export function StatusBadge({ kind, value }: StatusBadgeProps) {
  if (kind === "stage") {
    const config = STAGE_CONFIG[value as Stage];
    return (
      <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${config.surface} ${config.border} ${config.accent}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  const config = PRIORITY_CONFIG[value as Priority];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.surface} ${config.accent}`}>
      {config.label}
    </span>
  );
}
