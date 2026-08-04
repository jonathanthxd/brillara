import { ApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { getVisitorSession } from "@/lib/server/session";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getVisitorSession();
    if (!session) throw new ApiError("Primero indica tu nombre para continuar.", 401);

    const { id } = await context.params;
    if (!session.ticketIds.includes(id)) {
      throw new ApiError("No tienes acceso a este ticket.", 404);
    }

    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select("*")
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
