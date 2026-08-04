import { ApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { getAdminSession } from "@/lib/server/session";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { validateStatus } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) throw new ApiError("No autorizado.", 401);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select("*, advisors(code, name)")
      .eq("id", id)
      .single();

    if (error || !data) throw new ApiError("Ticket no encontrado.", 404);

    return NextResponse.json(
      { ticket: toTicket(data as DatabaseTicket) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const status = validateStatus((await request.json()).status);
    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, advisors(code, name)")
      .single();

    if (error || !data) throw new ApiError("No fue posible actualizar el ticket.", 404);

    return NextResponse.json(
      { ticket: toTicket(data as DatabaseTicket) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
