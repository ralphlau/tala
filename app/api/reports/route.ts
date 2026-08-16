import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: { interviews: true },
      orderBy: { appliedDate: "asc" },
    });

    const total = applications.length;

    const stageCounts = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 } as Record<
      string,
      number
    >;
    for (const app of applications) {
      stageCounts[app.status] = (stageCounts[app.status] ?? 0) + 1;
    }

    const reachedInterview = applications.filter(
      (app) => app.interviews.length > 0 || app.status === "Interview" || app.status === "Offer"
    ).length;
    const reachedOffer = stageCounts.Offer ?? 0;

    const responseRate = total > 0 ? reachedInterview / total : 0;
    const offerRate = total > 0 ? reachedOffer / total : 0;
    const offerRateAmongInterviewed = reachedInterview > 0 ? reachedOffer / reachedInterview : 0;

    const daysToFirstInterview: number[] = [];
    for (const app of applications) {
      if (app.interviews.length === 0) continue;
      const earliest = app.interviews.reduce((min, iv) =>
        iv.date < min.date ? iv : min
      );
      const days =
        (new Date(earliest.date).getTime() - new Date(app.appliedDate).getTime()) /
        (1000 * 60 * 60 * 24);
      if (days >= 0) daysToFirstInterview.push(days);
    }
    const avgDaysToInterview =
      daysToFirstInterview.length > 0
        ? daysToFirstInterview.reduce((a, b) => a + b, 0) / daysToFirstInterview.length
        : null;

    const monthly: Record<string, number> = {};
    for (const app of applications) {
      const key = monthKey(new Date(app.appliedDate));
      monthly[key] = (monthly[key] ?? 0) + 1;
    }
    const applicationsOverTime = Object.entries(monthly)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, count]) => ({ month, count }));

    return NextResponse.json({
      total,
      stageCounts,
      responseRate,
      offerRate,
      offerRateAmongInterviewed,
      avgDaysToInterview,
      applicationsOverTime,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
