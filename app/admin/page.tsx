"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, ArrowLeft, Users, Briefcase, TrendingUp } from "lucide-react";
import { ToastContainer, useToast } from "@/hooks/useToast";
import type { Role } from "@/types";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  _count: { applications: number };
}

interface PlatformStats {
  totalUsers: number;
  totalAdmins: number;
  totalApplications: number;
  stageCounts: Record<string, number>;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toasts, addToast, dismissToast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) return;
      setStats(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to load users");
      setUsers(data);
    } catch (error) {
      console.error(error);
      addToast({ title: "Unable to load users", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (user: AdminUser) => {
    const nextRole: Role = user.role === "admin" ? "user" : "admin";
    setPendingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to update role");

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
      addToast({ title: `${user.email} is now ${nextRole}`, tone: "success" });
    } catch (error) {
      addToast({
        title: "Unable to update role",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Delete ${user.email}? This also deletes their applications. This can't be undone.`)) {
      return;
    }
    setPendingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      addToast({ title: `${user.email} deleted`, tone: "info" });
    } catch (error) {
      addToast({
        title: "Unable to delete user",
        description: error instanceof Error ? error.message : undefined,
        tone: "error",
      });
    } finally {
      setPendingId(null);
    }
  };

  if (status === "loading" || (status === "authenticated" && session?.user?.role !== "admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>

        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-sky-400" />
          <div>
            <h1 className="text-xl font-semibold text-white">User management</h1>
            <p className="text-sm text-slate-400">Manage accounts and admin access</p>
          </div>
        </div>

        {stats && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="h-4 w-4" />
                <span className="text-sm">Total Users</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">
                {stats.totalUsers}{" "}
                <span className="text-sm font-normal text-slate-500">
                  ({stats.totalAdmins} admin{stats.totalAdmins === 1 ? "" : "s"})
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex items-center gap-2 text-slate-400">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm">Total Applications</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.totalApplications}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex items-center gap-2 text-slate-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Platform Offer Rate</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-white">
                {stats.totalApplications > 0
                  ? `${Math.round((stats.stageCounts.Offer / stats.totalApplications) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading users...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Applications</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => {
                  const isSelf = user.id === session?.user?.id;
                  return (
                    <tr key={user.id} data-testid={`admin-user-row-${user.id}`}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{user.name || "—"}</p>
                        <p className="text-slate-400">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          data-testid={`admin-user-role-${user.id}`}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-sky-500/10 text-sky-300"
                              : "bg-white/5 text-slate-300"
                          }`}
                        >
                          {user.role}
                        </span>
                        {isSelf && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{user._count.applications}</td>
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            data-testid={`admin-toggle-role-${user.id}`}
                            disabled={pendingId === user.id || (isSelf && user.role === "admin")}
                            onClick={() => handleRoleToggle(user)}
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/5 disabled:opacity-40"
                          >
                            Make {user.role === "admin" ? "user" : "admin"}
                          </button>
                          <button
                            type="button"
                            data-testid={`admin-delete-user-${user.id}`}
                            disabled={pendingId === user.id || isSelf}
                            onClick={() => handleDelete(user)}
                            className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-1.5 text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
