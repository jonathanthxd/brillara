import { ApiError, jsonError } from "@/lib/server/api";
import { getAdvisorSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { validateStatus } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requireAdvisor() {
  const advisor = await getAdvisorSession();
  if (!advisor) throw new ApiError("No autorizado.", 401);
  return advisor;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const advisor = await requireAdvisor();
    const { id } = await context.params;
    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select("*, advisors(code, name)")
      .eq("id", id)
      .eq("advisor_id", advisor.id)
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
    const advisor = await requireAdvisor();
    const { id } = await context.params;
    const status = validateStatus((await request.json()).status);
    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("advisor_id", advisor.id)
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
