import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Confirms the current request is from a logged-in admin.
 * Returns { session } on success, or { errorResponse } to return immediately.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { session: null, errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.user.role !== "admin") {
    return { session: null, errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session, errorResponse: null };
}
