import { ApiError, jsonError } from "@/lib/server/api";
import { requireActiveAdvisorSession } from "@/lib/server/advisor-auth";
import { getSupabaseAdmin } from "@/lib/server/supabase";
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
    const advisor = await requireActiveAdvisorSession();

    const { id } = await context.params;
    const text = validateMessage((await request.json()).text);
    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("tickets")
      .select("*, advisors(code, name)")
      .eq("id", id)
      .eq("advisor_id", advisor.id)
      .single();

    if (currentError || !current) throw new ApiError("Ticket no encontrado.", 404);

    const message: TicketMessage = {
      id: crypto.randomUUID(),
      sender: "admin",
      senderName: `${advisor.name}#${advisor.code}`,
      text,
      timestamp: new Date().toISOString(),
    };
    const messages = [...((current as DatabaseTicket).messages ?? []), message];
    const { data, error } = await supabase
      .from("tickets")
      .update({ messages, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("advisor_id", advisor.id)
      .select("*, advisors(code, name)")
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
