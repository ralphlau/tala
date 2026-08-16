"use client";

export const dynamic = "force-dynamic";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  LayoutGrid,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToastContainer, useToast } from "@/hooks/useToast";
import { STAGE_CONFIG, type Priority, type Stage } from "@/types";

interface Application {
  id: string;
  company: string;
  role: string;
  jobUrl?: string;
  salary?: string;
  status: string;
  notes?: string;
  appliedDate: string;
  workType?: string;
  priority?: string;
  interviewDate?: string;
}

const STAGES: Stage[] = ["Applied", "Interview", "Offer", "Rejected"];

function getInitials(company: string) {
  const fallback = company.trim().slice(0, 2).toUpperCase();
  return fallback || "AT";
}

function getAvatarColor(company: string) {
  const values = [...company].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const palette = [
    "from-sky-500 to-cyan-400",
    "from-violet-500 to-fuchsia-400",
    "from-emerald-500 to-lime-400",
    "from-amber-500 to-orange-400",
    "from-rose-500 to-pink-400",
  ];
  return palette[values % palette.length];
}

function SortableApplicationCard({
  app,
  onSelect,
  stage,
}: {
  app: Application;
  onSelect: (application: Application) => void;
  stage: Stage;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid={`application-card-${app.id}`}
      onClick={() => onSelect(app)}
      style={style}
      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-left transition hover:border-sky-400/30 hover:bg-slate-800"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(app.company)} text-xs font-semibold text-white`}>
            {getInitials(app.company)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{app.company}</p>
            <p className="text-xs text-slate-400">{app.role}</p>
          </div>
        </div>
        <StatusBadge kind="stage" value={stage} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
          {app.workType ?? "Work type TBD"}
        </span>
        <StatusBadge kind="priority" value={(app.priority as Priority) ?? "Medium"} />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <CalendarDays className="h-3.5 w-3.5" />
        {new Date(app.appliedDate).toLocaleDateString()}
      </div>
    </button>
  );
}

function StageColumn({
  stage,
  applications,
  onSelect,
}: {
  stage: Stage;
  applications: Application[];
  onSelect: (application: Application) => void;
}) {
  const config = STAGE_CONFIG[stage];
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      data-testid={`stage-column-${stage.toLowerCase()}`}
      className={`rounded-2xl border ${config.border} ${isOver ? "bg-sky-500/10" : "bg-slate-950/70"} p-3`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
          <h3 className={`text-sm font-semibold ${config.accent}`}>{stage}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400">
          {applications.length}
        </span>
      </div>

      <SortableContext items={applications.map((app) => app.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-3 space-y-2">
          {applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 px-3 py-6 text-center text-sm text-slate-500">
              No applications yet
            </div>
          ) : (
            applications.map((app) => (
              <SortableApplicationCard key={app.id} app={app} onSelect={onSelect} stage={stage} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toasts, addToast, dismissToast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );
  const [form, setForm] = useState({
    company: "",
    role: "",
    jobUrl: "",
    salary: "",
    notes: "",
    status: "Applied" as Stage,
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      void fetchApplications();
    }
  }, [status]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/applications");
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Unable to refresh applications",
        description: "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          company: form.company.trim(),
          role: form.role.trim(),
          salary: form.salary.trim() || null,
          notes: form.notes.trim() || null,
        }),
        credentials: "include",
      });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "Unable to add application");
      }

      setShowModal(false);
      setForm({
        company: "",
        role: "",
        jobUrl: "",
        salary: "",
        notes: "",
        status: "Applied",
      });
      setApplications((prev) => [payload, ...prev]);
      addToast({
        title: "Application added",
        description: `${payload.company} is now tracked in your pipeline.`,
        tone: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Unable to add application",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Stage) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to update status");
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
      setSelectedApp(null);
      addToast({
        title: "Stage updated",
        description: `${payload.company} moved to ${newStatus}.`,
        tone: "info",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Unable to update stage",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to delete application");
      }

      setApplications((prev) => prev.filter((app) => app.id !== id));
      setSelectedApp(null);
      addToast({
        title: "Application removed",
        description: "The record has been removed from your pipeline.",
        tone: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Unable to delete application",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    }
  };

  const getByStage = (stage: Stage) => applications.filter((app) => app.status === stage);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const targetStage = String(over.id) as Stage;
    const draggedApplication = applications.find((app) => app.id === activeId);

    if (!draggedApplication || draggedApplication.status === targetStage) return;

    await handleStatusChange(activeId, targetStage);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
          <div className="hidden w-72 shrink-0 rounded-3xl border border-white/10 bg-slate-900/70 p-5 lg:block">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-700" />
            <div className="mt-6 space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-2xl bg-slate-800" />
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <div className="h-36 animate-pulse rounded-3xl border border-white/10 bg-slate-900/70" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-slate-900/70" />
              ))}
            </div>
            <div className="grid gap-4 xl:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-slate-900/70" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-4 py-4 text-slate-100 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_24px_80px_-24px_rgba(2,6,23,0.95)] backdrop-blur lg:flex lg:flex-col">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-semibold text-white">
                HT
              </div>
              <div>
                <p className="text-sm font-semibold text-white">TALA</p>
                <p className="text-sm text-slate-400">Portfolio dashboard</p>
              </div>
            </div>
            <nav className="mt-8 space-y-2">
              {[
                { label: "Overview", icon: LayoutGrid, active: true },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                      item.active
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-sky-200">
              <Sparkles className="h-4 w-4" /> QA-ready workflow
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Built with stronger review loops, clearer stages, and polished UX for interviews.
            </p>
          </div>
        </aside>

        <main className="flex-1">
          <header className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_24px_80px_-24px_rgba(2,6,23,0.95)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-400">Good evening</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
                  Welcome back, {session?.user?.name ?? "there"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  Keep your hiring pipeline organized with a calmer, more intentional experience.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {session?.user?.role === "admin" && (
                  <button
                    type="button"
                    data-testid="admin-link-button"
                    onClick={() => router.push("/admin")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Manage users
                  </button>
                )}
                <button
                  type="button"
                  data-testid="add-application-button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400"
                >
                  <Plus className="h-4 w-4" />
                  Add application
                </button>
                <button
                  type="button"
                  data-testid="sign-out-button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Applications"
              value={applications.length}
              caption="Tracked in your active pipeline"
              icon={Briefcase}
              accent="bg-sky-500/15 text-sky-300"
            />
            <StatCard
              label="Interviews"
              value={getByStage("Interview").length}
              caption="Moving into conversations"
              icon={CalendarDays}
              accent="bg-amber-500/15 text-amber-300"
            />
            <StatCard
              label="Offers"
              value={getByStage("Offer").length}
              caption="Positive momentum"
              icon={Sparkles}
              accent="bg-emerald-500/15 text-emerald-300"
            />
            <StatCard
              label="Rejected"
              value={getByStage("Rejected").length}
              caption="Closed loops"
              icon={BarChart3}
              accent="bg-rose-500/15 text-rose-300"
            />
          </section>

          <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_24px_80px_-24px_rgba(2,6,23,0.95)] backdrop-blur sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Pipeline overview</h2>
                <p className="mt-1 text-sm text-slate-400">
                  A clearer view of each hiring stage and the most recent activity.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                Stage flow
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="grid gap-4 xl:grid-cols-4">
                {STAGES.map((stage) => (
                  <StageColumn
                    key={stage}
                    stage={stage}
                    applications={getByStage(stage)}
                    onSelect={setSelectedApp}
                  />
                ))}
              </div>
            </DndContext>
          </section>
        </main>
      </div>

      {showModal && (
        <div
          data-testid="application-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Add application</h2>
                <p className="mt-1 text-sm text-slate-400">Capture the next opportunity in seconds.</p>
              </div>
              <button
                type="button"
                data-testid="close-application-modal"
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300" htmlFor="application-company">Company *</label>
                <input
                  id="application-company"
                  data-testid="application-company"
                  type="text"
                  value={form.company}
                  onChange={(event) => setForm({ ...form, company: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-sky-400"
                  placeholder="e.g. Stripe"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300" htmlFor="application-role">Role *</label>
                <input
                  id="application-role"
                  data-testid="application-role"
                  type="text"
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-sky-400"
                  placeholder="e.g. QA Engineer"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300" htmlFor="application-jobUrl">Job URL</label>
                <input
                  id="application-jobUrl"
                  data-testid="application-jobUrl"
                  type="url"
                  value={form.jobUrl}
                  onChange={(event) => setForm({ ...form, jobUrl: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-sky-400"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300" htmlFor="application-salary">Salary</label>
                <input
                  id="application-salary"
                  data-testid="application-salary"
                  type="text"
                  value={form.salary}
                  onChange={(event) => setForm({ ...form, salary: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-sky-400"
                  placeholder="e.g. 25,000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300" htmlFor="application-status">Status</label>
                <select
                  id="application-status"
                  data-testid="application-status"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as Stage })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-400"
                >
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300" htmlFor="application-notes">Notes</label>
                <textarea
                  id="application-notes"
                  data-testid="application-notes"
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400"
                  placeholder="Anything worth remembering?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  data-testid="cancel-application"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-application"
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedApp && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
          onClick={() => setSelectedApp(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Selected application</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{selectedApp.company}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedApp.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
                <span>Status</span>
                <StatusBadge kind="stage" value={selectedApp.status as Stage} />
              </div>
              {selectedApp.salary ? (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
                  <span>Salary</span>
                  <span className="text-emerald-300">{selectedApp.salary}</span>
                </div>
              ) : null}
              {selectedApp.jobUrl ? (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
                  <span>Job URL</span>
                  <a
                    href={selectedApp.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-40 truncate text-sky-300 hover:underline"
                  >
                    View posting
                  </a>
                </div>
              ) : null}
              {selectedApp.notes ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
                  <p className="mb-1 text-slate-400">Notes</p>
                  <p>{selectedApp.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm text-slate-400">Move to stage</p>
              <div className="grid grid-cols-2 gap-2">
                {STAGES.filter((stage) => stage !== selectedApp.status).map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    data-testid={`move-to-${stage.toLowerCase()}-button`}
                    onClick={() => handleStatusChange(selectedApp.id, stage)}
                    className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-200"
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              data-testid="delete-application-button"
              onClick={() => handleDelete(selectedApp.id)}
              className="mt-6 w-full rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
            >
              Delete application
            </button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}