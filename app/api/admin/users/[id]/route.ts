import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/require-admin";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const { session, errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { id } = context.params;
    const bodyText = await request.text();

    if (!bodyText) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { role } = body;
    if (role !== "user" && role !== "admin") {
      return NextResponse.json({ error: "Role must be 'user' or 'admin'" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent an admin from demoting themselves and getting locked out
    if (targetUser.id === session!.user.id && role !== "admin") {
      return NextResponse.json(
        { error: "You can't remove your own admin access" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
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
  const { session, errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { id } = context.params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent an admin from deleting their own account via this panel
    if (targetUser.id === session!.user.id) {
      return NextResponse.json(
        { error: "You can't delete your own account from here" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
