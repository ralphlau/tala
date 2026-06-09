"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Application {
  id: string;
  company: string;
  role: string;
  jobUrl?: string;
  salary?: string;
  status: string;
  notes?: string;
  appliedDate: string;
}

const STAGES = ["Applied", "Interview", "Offer", "Rejected"];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    company: "",
    role: "",
    jobUrl: "",
    salary: "",
    notes: "",
    status: "Applied",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchApplications();
  }, [status]);

  const fetchApplications = async () => {
    const res = await fetch("/api/applications");
    const data = await res.json();
    setApplications(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ company: "", role: "", jobUrl: "", salary: "", notes: "", status: "Applied" });
      fetchApplications();
    }
  };

  const getByStage = (stage: string) =>
    applications.filter((a) => a.status === stage);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">HireTrack</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Add Application
            </button>
            <span className="text-gray-400 text-sm">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Applied", value: applications.length, color: "text-blue-400" },
            { label: "Interviews", value: getByStage("Interview").length, color: "text-yellow-400" },
            { label: "Offers", value: getByStage("Offer").length, color: "text-green-400" },
            { label: "Rejected", value: getByStage("Rejected").length, color: "text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STAGES.map((stage) => (
            <div key={stage} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center justify-between">
                {stage}
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  {getByStage(stage).length}
                </span>
              </h3>
              <div className="space-y-3 min-h-32">
                {getByStage(stage).length === 0 ? (
                  <p className="text-gray-600 text-sm text-center pt-8">No applications yet</p>
                ) : (
                  getByStage(stage).map((app) => (
                    <div key={app.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
                      <p className="font-medium text-white text-sm">{app.company}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{app.role}</p>
                      {app.salary && (
                        <p className="text-green-400 text-xs mt-1">{app.salary}</p>
                      )}
                      <p className="text-gray-600 text-xs mt-2">
                        {new Date(app.appliedDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Add Application</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Company *</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Cloudstaff Philippines"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Role *</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. QA Engineer"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Job URL</label>
                <input
                  type="url"
                  value={form.jobUrl}
                  onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Salary</label>
                <input
                  type="text"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 25,000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Any notes about this application..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-700 text-gray-300 hover:text-white py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}