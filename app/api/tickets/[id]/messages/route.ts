import { ApiError, jsonError } from "@/lib/server/api";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { getVisitorSession } from "@/lib/server/session";
import { DatabaseTicket, toTicket } from "@/lib/tickets";
import { validateMessage } from "@/lib/validation";
import { TicketMessage } from "@/types/ticket";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getVisitorSession();
    if (!session) throw new ApiError("Primero indica tu nombre para continuar.", 401);

    const { id } = await context.params;
    if (!session.ticketIds.includes(id)) {
      throw new ApiError("No tienes acceso a este ticket.", 404);
    }

    const text = validateMessage((await request.json()).text);
    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (currentError || !current) throw new ApiError("Ticket no encontrado.", 404);

    const message: TicketMessage = {
      id: crypto.randomUUID(),
      sender: "cliente",
      text,
      timestamp: new Date().toISOString(),
    };
    const messages = [...((current as DatabaseTicket).messages ?? []), message];
    const { data, error } = await supabase
      .from("tickets")
      .update({ messages, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { ticket: toTicket(data as DatabaseTicket) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
