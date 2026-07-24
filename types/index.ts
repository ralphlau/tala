export type Stage = "Applied" | "Interview" | "Offer" | "Rejected";
export type WorkType = "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
export type Priority = "Low" | "Medium" | "High";
export type Role = "user" | "admin";

export const STAGE_CONFIG: Record<
  Stage,
  {
    label: Stage;
    accent: string;
    dot: string;
    border: string;
    surface: string;
  }
> = {
  Applied: {
    label: "Applied",
    accent: "text-sky-400",
    dot: "bg-sky-400",
    border: "border-sky-400/20",
    surface: "bg-sky-500/10",
  },
  Interview: {
    label: "Interview",
    accent: "text-amber-400",
    dot: "bg-amber-400",
    border: "border-amber-400/20",
    surface: "bg-amber-500/10",
  },
  Offer: {
    label: "Offer",
    accent: "text-emerald-400",
    dot: "bg-emerald-400",
    border: "border-emerald-400/20",
    surface: "bg-emerald-500/10",
  },
  Rejected: {
    label: "Rejected",
    accent: "text-rose-400",
    dot: "bg-rose-400",
    border: "border-rose-400/20",
    surface: "bg-rose-500/10",
  },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: Priority;
    accent: string;
    surface: string;
  }
> = {
  Low: {
    label: "Low",
    accent: "text-slate-300",
    surface: "bg-slate-500/10",
  },
  Medium: {
    label: "Medium",
    accent: "text-violet-300",
    surface: "bg-violet-500/10",
  },
  High: {
    label: "High",
    accent: "text-rose-300",
    surface: "bg-rose-500/10",
  },
};

export const WORK_TYPE_OPTIONS: WorkType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];
