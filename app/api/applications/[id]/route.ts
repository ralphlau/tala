import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getOwnedApplication(id: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { user: null, application: null };

  const application = await prisma.application.findUnique({ where: { id } });
  return { user, application };
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;
    const bodyText = await request.text();

    if (!bodyText) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { user, application } = await getOwnedApplication(id, session.user.email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (application.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Whitelist editable fields only — never trust the raw body directly
    const ALLOWED_FIELDS = [
      "company", "role", "jobUrl", "salary", "status",
      "notes", "workType", "priority", "interviewDate",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) data[key] = body[key];
    }

    const updated = await prisma.application.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = context.params;
    const { user, application } = await getOwnedApplication(id, session.user.email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (application.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.application.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
