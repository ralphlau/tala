"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
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
            <span className="text-gray-400 text-sm">
              {session?.user?.name}
            </span>
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
            { label: "Total Applied", value: "0", color: "blue" },
            { label: "Interviews", value: "0", color: "yellow" },
            { label: "Offers", value: "0", color: "green" },
            { label: "Rejected", value: "0", color: "red" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Kanban Board Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["Applied", "Interview", "Offer", "Rejected"].map((stage) => (
            <div
              key={stage}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <h3 className="font-semibold text-white mb-4 flex items-center justify-between">
                {stage}
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  0
                </span>
              </h3>
              <div className="min-h-32 flex items-center justify-center">
                <p className="text-gray-600 text-sm text-center">
                  No applications yet
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}