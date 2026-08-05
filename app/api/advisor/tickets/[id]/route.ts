import { ApiError, jsonError } from "@/lib/server/api";
import { requireActiveAdvisorSession } from "@/lib/server/advisor-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { validateAdvisorTicketStatus } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const advisor = await requireActiveAdvisorSession();
    const { id } = await context.params;
    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select("*, advisors(code, name), partners(name), partner_locations(name, city)")
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
    const advisor = await requireActiveAdvisorSession();
    const { id } = await context.params;
    const status = validateAdvisorTicketStatus((await request.json()).status);
    const { data: current, error: currentError } = await getSupabaseAdmin()
      .from("tickets")
      .select("status")
      .eq("id", id)
      .eq("advisor_id", advisor.id)
      .maybeSingle();
    if (currentError || !current) throw new ApiError("Ticket no encontrado.", 404);
    const currentStatus = (current as { status: string | null }).status;
    if (currentStatus === "compra-realizada" || currentStatus === "no-concretado" || currentStatus === "archivado") {
      throw new ApiError("El resultado presencial está cerrado y no puede modificarse desde el panel del asesor.", 403);
    }
    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("advisor_id", advisor.id)
      .select("*, advisors(code, name), partners(name), partner_locations(name, city)")
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
