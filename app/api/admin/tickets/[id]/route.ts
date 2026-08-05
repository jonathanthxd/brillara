import { ApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { getAdminSession } from "@/lib/server/session";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { validateAdminManualStatus } from "@/lib/validation";
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
      .select("*, advisors(code, name), partners(name), partner_locations(name, city)")
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
    const status = validateAdminManualStatus((await request.json()).status);
    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("tickets")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (currentError || !current) throw new ApiError("Ticket no encontrado.", 404);
    if ((current as { status: string | null }).status === "compra-realizada") {
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .select("id, voided_at")
        .eq("ticket_id", id)
        .maybeSingle();
      if (purchaseError) throw purchaseError;
      if (purchase && !(purchase as { voided_at: string | null }).voided_at) {
        throw new ApiError("Anula la compra desde Partners antes de reabrir este ticket.", 403);
      }
    }
    const { data, error } = await supabase
      .from("tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
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
