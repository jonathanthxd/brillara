import { ApiError, jsonError } from "@/lib/server/api";
import { getAdminSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const { active } = await request.json();

    if (typeof active !== "boolean") throw new ApiError("El estado no es válido.");

    const { error } = await getSupabaseAdmin()
      .from("announcements")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const { error } = await getSupabaseAdmin().from("announcements").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
