import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";

const prisma = new PrismaClient();

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const [totalUsers, totalAdmins, totalApplications, stageGroups] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.application.count(),
      prisma.application.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    const stageCounts: Record<string, number> = {
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };
    for (const group of stageGroups) {
      stageCounts[group.status] = group._count.status;
    }

    return NextResponse.json({
      totalUsers,
      totalAdmins,
      totalApplications,
      stageCounts,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
