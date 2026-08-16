"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  Percent,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { STAGE_CONFIG, type Stage } from "@/types";

interface ReportData {
  total: number;
  stageCounts: Record<string, number>;
  responseRate: number;
  offerRate: number;
  offerRateAmongInterviewed: number;
  avgDaysToInterview: number | null;
  applicationsOverTime: { month: string; count: number }[];
}

const STAGE_HEX: Record<Stage, string> = {
  Applied: "#38bdf8",
  Interview: "#fbbf24",
  Offer: "#34d399",
  Rejected: "#fb7185",
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function ReportsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/reports")
      .then((res) => res.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, [status]);

  const stageData = data
    ? (Object.keys(STAGE_CONFIG) as Stage[]).map((stage) => ({
        name: stage,
        value: data.stageCounts[stage] ?? 0,
      }))
    : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-4 py-4 text-slate-100 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:border-sky-400/30 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Reports</h1>
            <p className="text-sm text-slate-400">
              Pipeline performance across all your applications.
            </p>
          </div>
        </div>

        {loading || !data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-white/10 bg-slate-900/70"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Applications"
                value={data.total}
                caption="All applications tracked"
                icon={BarChart3}
                accent="bg-sky-500/15 text-sky-300"
              />
              <StatCard
                label="Response Rate"
                value={formatPercent(data.responseRate)}
                caption="Reached interview stage"
                icon={TrendingUp}
                accent="bg-amber-500/15 text-amber-300"
              />
              <StatCard
                label="Offer Rate"
                value={formatPercent(data.offerRate)}
                caption="Of all applications"
                icon={Percent}
                accent="bg-emerald-500/15 text-emerald-300"
              />
              <StatCard
                label="Avg. Days to Interview"
                value={
                  data.avgDaysToInterview !== null
                    ? Math.round(data.avgDaysToInterview)
                    : "—"
                }
                caption="From application date"
                icon={CalendarClock}
                accent="bg-violet-500/15 text-violet-300"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
                <h2 className="mb-4 text-sm font-semibold text-slate-300">
                  Pipeline by Stage
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stageData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {stageData.map((entry) => (
                          <Cell key={entry.name} fill={STAGE_HEX[entry.name as Stage]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          color: "#e2e8f0",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  {stageData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-400">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: STAGE_HEX[entry.name as Stage] }}
                      />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
                <h2 className="mb-4 text-sm font-semibold text-slate-300">
                  Applications Over Time
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.applicationsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          color: "#e2e8f0",
                        }}
                      />
                      <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
              <h2 className="mb-2 text-sm font-semibold text-slate-300">
                Interview → Offer Conversion
              </h2>
              <p className="text-3xl font-semibold text-white">
                {formatPercent(data.offerRateAmongInterviewed)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Of applications that reached an interview, this share converted to an offer.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
