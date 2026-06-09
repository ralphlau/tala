import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession();

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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { company, role, jobUrl, salary, notes, status } = await request.json();

  if (!company || !role) {
    return NextResponse.json(
      { error: "Company and role are required" },
      { status: 400 }
    );
  }

  const application = await prisma.application.create({
    data: {
      userId: user.id,
      company,
      role,
      jobUrl: jobUrl || null,
      salary: salary || null,
      notes: notes || null,
      status: status || "Applied",
    },
  });

  return NextResponse.json(application, { status: 201 });
}